<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\LicenseRecord;

class ClientLicenseController extends Controller
{
    // 1. OBTENER CLIENTES (Con Licencias Asociadas y Filtros)
    public function getClients(Request $request)
    {
        $query = User::where('status', '!=', 'erased')
                     ->where('role_id', '!=', 1) // Ocultar super admins
                     ->with('licenses');

        // Filtro por nombre o empresa (LIKE)
        if ($request->filled('name')) {
            $name = $request->name;
            $query->where(function($q) use ($name) {
                $q->where('full_name', 'like', "%{$name}%")
                  ->orWhere('company_name', 'like', "%{$name}%");
            });
        }

        // Filtro por tipo de establecimiento
        if ($request->filled('establishment_type')) {
            $query->where('establishment_type', $request->establishment_type);
        }

        $clients = $query->orderBy('created_at', 'desc')->get();
        return response()->json($clients);
    }

    // 2. ACTUALIZAR CLIENTE (Editar Info)
    public function updateClient(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'full_name' => 'sometimes|string|max:150',
            'company_name' => 'sometimes|string|max:150',
            'email' => 'sometimes|email|unique:t1_licenses_users,email,' . $id,
            'phone_number' => 'sometimes|string|max:50',
            'establishment_type' => 'sometimes|string|max:100',
        ]);

        $user->update($request->all());

        return response()->json(['success' => true, 'message' => 'Cliente actualizado con éxito', 'client' => $user]);
    }

    // 3. ELIMINAR CLIENTE (Borrado Lógico: status = erased)
    public function eraseClient($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'erased';
        $user->is_active = false;
        $user->save();

        return response()->json(['success' => true, 'message' => 'Cliente movido a papelera (erased)']);
    }

    // 4. CREAR CLIENTE NUEVO (Previo a hacerle su licencia)
    public function createClient(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:150',
            'company_name' => 'nullable|string|max:150',
            'email' => 'required|email|unique:t1_licenses_users,email',
            'phone_number' => 'nullable|string|max:50',
            'establishment_type' => 'nullable|string|max:100',
        ]);
        
        $user = User::create([
            'role_id' => 2, // 2 = Cliente normal
            'full_name' => $request->full_name,
            'company_name' => $request->company_name,
            'email' => $request->email,
            'password_hash' => bcrypt('password123'), // Placeholder, auth es via admin
            'phone_number' => $request->phone_number,
            'establishment_type' => $request->establishment_type,
            'status' => 'active',
            'is_active' => true,
        ]);

        return response()->json(['success' => true, 'message' => 'Cliente registrado en DB', 'client' => $user], 201);
    }

    // 5. CREAR LICENCIA PARA UN CLIENTE
    public function createLicense(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer', // El ID del cliente
            'product_id' => 'required|integer', 
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'max_devices' => 'sometimes|integer'
        ]);

        // Generar una llave aleatoria corporativa bonita
        $licenseKey = strtoupper(uniqid('LZR-') . '-' . substr(str_shuffle("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 5));

        $license = LicenseRecord::create([
            'user_id' => $request->user_id,
            'product_id' => $request->product_id,
            'license_key' => $licenseKey,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'status' => 'ACTIVE',
            'max_devices' => $request->max_devices ?? 1
        ]);

        return response()->json(['success' => true, 'message' => 'Licencia generada correctamente', 'license' => $license], 201);
    }
}
