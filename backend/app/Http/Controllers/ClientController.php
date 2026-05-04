<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClientController extends Controller
{
    // LISTAR CLIENTES
    public function index(Request $request)
    {
        try {
            $query = "SELECT * FROM t1_clients WHERE status != 'erased'";
            $params = [];

            if ($request->filled('search')) {
                $q = "%" . $request->search . "%";
                $query .= " AND (client_name LIKE ? OR business_name LIKE ? OR email LIKE ? OR nit LIKE ?)";
                $params = array_merge($params, [$q, $q, $q, $q]);
            }

            if ($request->filled('status') && $request->status !== 'all') {
                $query .= " AND status = ?";
                $params[] = $request->status;
            }

            $query .= " ORDER BY created_at DESC";
            $clients = DB::select($query, $params);

            // Adjuntar licencias a cada cliente
            if (count($clients) > 0) {
                $ids = array_map(fn($c) => $c->id, $clients);
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $licenses = DB::select("SELECT * FROM t2_licenses WHERE client_id IN ($placeholders) ORDER BY created_at DESC", $ids);
                $byClient = [];
                foreach ($licenses as $l) {
                    $byClient[$l->client_id][] = $l;
                }
                foreach ($clients as $c) {
                    $c->licenses = $byClient[$c->id] ?? [];
                }
            }

            return response()->json(['success' => true, 'data' => $clients]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al listar clientes: ' . $e->getMessage()], 500);
        }
    }

    // CREAR CLIENTE
    public function store(Request $request)
    {
        try {
            $request->validate([
                'client_name'   => 'required|string|max:150',
                'email'         => 'required|email|unique:t1_clients,email',
                'business_name' => 'nullable|string|max:150',
                'nit'           => 'nullable|string|max:50',
                'type_enterprise' => 'nullable|string|max:100',
                'phone'         => 'nullable|string|max:50',
            ]);

            DB::insert(
                "INSERT INTO t1_clients (client_name, business_name, nit, type_enterprise, email, phone, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())",
                [
                    $request->client_name,
                    $request->business_name,
                    $request->nit,
                    $request->type_enterprise,
                    $request->email,
                    $request->phone,
                ]
            );

            $id = DB::getPdo()->lastInsertId();

            // LOG
            $this->log($request, 'create_client', "Cliente creado: {$request->client_name} (ID: $id)");

            $client = DB::selectOne("SELECT * FROM t1_clients WHERE id = ?", [$id]);
            return response()->json(['success' => true, 'message' => 'Cliente creado correctamente.', 'data' => $client], 201);

        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al crear cliente: ' . $e->getMessage()], 500);
        }
    }

    // OBTENER UN CLIENTE
    public function show($id)
    {
        try {
            $client = DB::selectOne("SELECT * FROM t1_clients WHERE id = ? AND status != 'erased'", [$id]);
            if (!$client) {
                return response()->json(['success' => false, 'message' => 'Cliente no encontrado.'], 404);
            }
            $client->licenses = DB::select("SELECT * FROM t2_licenses WHERE client_id = ? ORDER BY created_at DESC", [$id]);
            return response()->json(['success' => true, 'data' => $client]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al obtener cliente: ' . $e->getMessage()], 500);
        }
    }

    // ACTUALIZAR CLIENTE
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'client_name'     => 'sometimes|string|max:150',
                'email'           => 'sometimes|email|unique:t1_clients,email,' . $id,
                'business_name'   => 'nullable|string|max:150',
                'nit'             => 'nullable|string|max:50',
                'type_enterprise' => 'nullable|string|max:100',
                'phone'           => 'nullable|string|max:50',
            ]);

            $fields = ['client_name', 'business_name', 'nit', 'type_enterprise', 'email', 'phone'];
            $updates = [];
            $params = [];

            foreach ($fields as $f) {
                if ($request->has($f)) {
                    $updates[] = "$f = ?";
                    $params[] = $request->$f;
                }
            }

            if (empty($updates)) {
                return response()->json(['success' => false, 'message' => 'No se enviaron campos para actualizar.'], 422);
            }

            $updates[] = "updated_at = NOW()";
            $params[] = $id;
            DB::update("UPDATE t1_clients SET " . implode(', ', $updates) . " WHERE id = ?", $params);

            $this->log($request, 'update_client', "Cliente actualizado ID: $id");

            $client = DB::selectOne("SELECT * FROM t1_clients WHERE id = ?", [$id]);
            return response()->json(['success' => true, 'message' => 'Cliente actualizado correctamente.', 'data' => $client]);

        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al actualizar cliente: ' . $e->getMessage()], 500);
        }
    }

    // ELIMINAR CLIENTE (borrado lógico)
    public function destroy(Request $request, $id)
    {
        try {
            $client = DB::selectOne("SELECT * FROM t1_clients WHERE id = ?", [$id]);
            if (!$client) {
                return response()->json(['success' => false, 'message' => 'Cliente no encontrado.'], 404);
            }

            DB::update("UPDATE t1_clients SET status = 'erased', updated_at = NOW() WHERE id = ?", [$id]);
            $this->log($request, 'delete_client', "Cliente eliminado: {$client->client_name} (ID: $id)");

            return response()->json(['success' => true, 'message' => 'Cliente eliminado correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al eliminar cliente: ' . $e->getMessage()], 500);
        }
    }

    private function log(Request $request, string $action, string $description): void
    {
        try {
            $user = $request->user();
            if ($user) {
                DB::insert(
                    "INSERT INTO t4_validation_logs (license_id, attempted_macaddress, ip_address, validation_status, created_at)
                     VALUES (NULL, ?, ?, 'success', NOW())",
                    [$action . '|' . $description, $request->ip()]
                );
            }
        } catch (\Exception $e) {
            // silencioso
        }
    }
}
