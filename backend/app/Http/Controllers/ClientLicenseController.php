<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class ClientLicenseController extends Controller
{
    // 1. OBTENER CLIENTES (Con Licencias Asociadas y Filtros)
    public function getClients(Request $request)
    {
        $query = "SELECT * FROM t1_licenses_users WHERE status != 'erased' AND role_id != 1";
        $params = [];

        // Filtro por nombre o empresa (LIKE)
        if ($request->filled('name')) {
            $query .= " AND (full_name LIKE ? OR company_name LIKE ?)";
            $name = "%" . $request->name . "%";
            $params[] = $name;
            $params[] = $name;
        }

        // Filtro por tipo de establecimiento
        if ($request->filled('establishment_type')) {
            $query .= " AND establishment_type = ?";
            $params[] = $request->establishment_type;
        }

        $query .= " ORDER BY created_at DESC";

        $clients = DB::select($query, $params);

        // Simulando el Eager Loading nativo recorriendo el array:
        foreach ($clients as $client) {
            $client->licenses = DB::select("SELECT * FROM t1_licenses_records WHERE user_id = ?", [$client->id]);
        }

        return response()->json($clients);
    }

    // 2. ACTUALIZAR CLIENTE (Editar Info)
    public function updateClient(Request $request, $id)
    {
        $request->validate([
            'full_name' => 'sometimes|string|max:150',
            'company_name' => 'sometimes|string|max:150',
            'email' => 'sometimes|email|unique:t1_licenses_users,email,' . $id,
            'phone_number' => 'sometimes|string|max:50',
            'establishment_type' => 'sometimes|string|max:100',
        ]);

        $updates = [];
        $params = [];

        // Constructor dinámico de UPDATE en SQL
        $fields = ['full_name', 'company_name', 'email', 'phone_number', 'establishment_type'];
        foreach($fields as $field) {
            if ($request->has($field)) {
                $updates[] = "$field = ?";
                $params[] = $request->$field;
            }
        }

        if (count($updates) > 0) {
            $updates[] = "updated_at = NOW()";
            
            $sql = "UPDATE t1_licenses_users SET " . implode(', ', $updates) . " WHERE id = ?";
            $params[] = $id; // Parámetro para el WHERE
            
            DB::update($sql, $params);
        }

        // Devolver la nueva info parseada
        $user = DB::selectOne("SELECT * FROM t1_licenses_users WHERE id = ?", [$id]);
        return response()->json(['success' => true, 'message' => 'Cliente actualizado por SQL Puro', 'client' => $user]);
    }

    // 3. ELIMINAR CLIENTE (Borrado Lógico)
    public function eraseClient($id)
    {
        DB::update("UPDATE t1_licenses_users SET status = 'erased', is_active = 0, updated_at = NOW() WHERE id = ?", [$id]);
        return response()->json(['success' => true, 'message' => 'Cliente movido a papelera vía SQL']);
    }

    // 4. CREAR CLIENTE NUEVO (Previo a hacerle su licencia)
    public function createClient(Request $request)
    {
        // Auto-fix DB: Insertar Rol de Cliente si no existe usando SQL
        $roleExists = DB::select("SELECT id FROM t1_licenses_roles WHERE id = 2");
        if (empty($roleExists)) {
            DB::insert("INSERT INTO t1_licenses_roles (id, name, description, created_at, updated_at) VALUES (2, 'Cliente Adquiriente', 'Rol automático', NOW(), NOW())");
        }

        // Auto-fix DB: Crear las columnas faltantes usando Alter Table nativo
        if (!Schema::hasColumn('t1_licenses_users', 'company_name')) {
            DB::statement("ALTER TABLE t1_licenses_users ADD company_name VARCHAR(150) NULL, ADD phone_number VARCHAR(50) NULL");
        }

        $request->validate([
            'full_name' => 'required|string|max:150',
            'company_name' => 'nullable|string|max:150',
            'email' => 'required|email|unique:t1_licenses_users,email',
            'phone_number' => 'nullable|string|max:50',
            'establishment_type' => 'nullable|string|max:100',
        ]);
        
        $passwordHash = bcrypt('password123'); // Password filler
        
        // Inserción Parametrizada Pura (Protección PDO)
        DB::insert(
            "INSERT INTO t1_licenses_users (role_id, full_name, company_name, email, password_hash, phone_number, establishment_type, status, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [ 2, $request->full_name, $request->company_name, $request->email, $passwordHash, $request->phone_number, $request->establishment_type, 'active', 1 ]
        );

        $userId = DB::getPdo()->lastInsertId();
        $user = DB::selectOne("SELECT * FROM t1_licenses_users WHERE id = ?", [$userId]);

        return response()->json(['success' => true, 'message' => 'Cliente registrado mediante SQL', 'client' => $user], 201);
    }

    // 5. CREAR LICENCIA PARA UN CLIENTE
    public function createLicense(Request $request)
    {
        // Auto-seed: Generador de producto maestro
        $productExists = DB::select("SELECT id FROM t1_licenses_products WHERE id = 1");
        if (empty($productExists)) {
            DB::insert("INSERT INTO t1_licenses_products (id, name, is_active, created_at, updated_at) VALUES (1, 'Lazarus Auto-Gen', 1, NOW(), NOW())");
        }

        $request->validate([
            'user_id' => 'required|integer',
            'product_id' => 'required|integer', 
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'max_devices' => 'sometimes|integer'
        ]);

        // Cifrado y encriptación genérica
        $licenseKey = strtoupper(uniqid('LZR-') . '-' . substr(str_shuffle("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 5));

        // Inserción en la tabla hija
        DB::insert(
            "INSERT INTO t1_licenses_records (user_id, product_id, license_key, start_date, end_date, status, max_devices, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [$request->user_id, $request->product_id, $licenseKey, $request->start_date, $request->end_date, 'ACTIVE', $request->max_devices ?? 1]
        );

        $licenseId = DB::getPdo()->lastInsertId();
        $license = DB::selectOne("SELECT * FROM t1_licenses_records WHERE id = ?", [$licenseId]);

        return response()->json(['success' => true, 'message' => 'Licencia generada correctamente con SQL puro', 'license' => $license], 201);
    }
}
