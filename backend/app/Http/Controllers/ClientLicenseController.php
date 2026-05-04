<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;


class ClientLicenseController extends Controller
{
    // 1. OBTENER CLIENTES (Con Licencias Asociadas y Filtros)
    public function getClients(Request $request)
    {
        try {
            $query = "SELECT * FROM t1_clients WHERE status != 'erased'";
            $params = [];

            if ($request->filled('name')) {
                $query .= " AND (client_name LIKE ? OR business_name LIKE ?)";
                $name = "%" . $request->name . "%";
                $params[] = $name;
                $params[] = $name;
            }

            if ($request->filled('establishment_type')) {
                $query .= " AND type_enterprise = ?";
                $params[] = $request->establishment_type;
            }

            if ($request->filled('status') && $request->status !== 'all') {
                $query .= " AND id IN (SELECT client_id FROM t2_licenses WHERE status = ?)";
                $params[] = $request->status;
            }

            $query .= " ORDER BY created_at DESC";

            $clients = DB::select($query, $params);

            if (count($clients) > 0) {
                $clientIds = array_map(function ($c) {
                    return $c->id; }, $clients);
                $placeholders = implode(',', array_fill(0, count($clientIds), '?'));

                $licQuery = "SELECT * FROM t2_licenses WHERE client_id IN ($placeholders)";
                $licParams = $clientIds;

                if ($request->filled('status') && $request->status !== 'all') {
                    $licQuery .= " AND status = ?";
                    $licParams[] = $request->status;
                }

                $licenses = DB::select($licQuery, $licParams);

                $licensesByClient = [];
                foreach ($licenses as $lic) {
                    $licensesByClient[$lic->client_id][] = $lic;
                }

                foreach ($clients as $client) {
                    $client->licenses = $licensesByClient[$client->id] ?? [];
                }
            }

            return response()->json($clients);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }

    // 9. OBTENER HISTORIAL GLOBAL DE PAGOS DE UN CLIENTE
    public function getClientPayments($clientId)
    {
        try {
            $payments = DB::select(
                "SELECT p.*, l.license_key, l.type 
                 FROM t3_payments p 
                 JOIN t2_licenses l ON p.license_id = l.id 
                 WHERE l.client_id = ? ORDER BY p.created_at DESC",
                [$clientId]
            );
            return response()->json(['success' => true, 'payments' => $payments], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }

    // 2. ACTUALIZAR CLIENTE (Editar Info)
    public function updateClient(Request $request, $id)
    {
        try {
            $request->validate([
                'client_name' => 'sometimes|string|max:150',
                'business_name' => 'sometimes|string|max:150',
                'nit' => 'sometimes|string|max:50',
                'type_enterprise' => 'sometimes|string|max:100',
                'email' => 'sometimes|email|unique:t1_clients,email,' . $id,
                'phone' => 'sometimes|string|max:50',
            ]);

            $updates = [];
            $params = [];

            $fields = ['client_name', 'business_name', 'nit', 'type_enterprise', 'email', 'phone'];
            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $updates[] = "$field = ?";
                    $params[] = $request->$field;
                }
            }

            if (count($updates) > 0) {
                $updates[] = "updated_at = NOW()";
                $sql = "UPDATE t1_clients SET " . implode(', ', $updates) . " WHERE id = ?";
                $params[] = $id;
                DB::update($sql, $params);
            }

            if ($request->has('licenses') && is_array($request->licenses)) {
                foreach ($request->licenses as $lic) {
                    if (isset($lic['id'])) {
                        DB::update(
                            "UPDATE t2_licenses SET type = ?, expires_at = ?, updated_at = NOW() WHERE id = ?",
                            [$lic['type'], $lic['expires_at'], $lic['id']]
                        );
                    }
                }
            }

            $user = DB::selectOne("SELECT * FROM t1_clients WHERE id = ?", [$id]);
            return response()->json(['success' => true, 'message' => 'Cliente actualizado', 'client' => $user]);

        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validación fallida: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }

    // 3. ELIMINAR CLIENTE (Borrado Lógico)
    public function eraseClient($id)
    {
        try {
            DB::update("UPDATE t1_clients SET status = 'erased', updated_at = NOW() WHERE id = ?", [$id]);
            return response()->json(['success' => true, 'message' => 'Cliente movido a papelera vía SQL']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }

    // 4. CREAR CLIENTE NUEVO
    public function createClient(Request $request)
    {
        try {
            $request->validate([
                'client_name' => 'required|string|max:150',
                'business_name' => 'nullable|string|max:150',
                'nit' => 'nullable|string|max:50',
                'type_enterprise' => 'nullable|string|max:100',
                'email' => 'required|email|unique:t1_clients,email',
                'phone' => 'nullable|string|max:50',
            ]);

            DB::insert(
                "INSERT INTO t1_clients (client_name, business_name, nit, type_enterprise, email, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())",
                [$request->client_name, $request->business_name, $request->nit, $request->type_enterprise, $request->email, $request->phone]
            );

            $clientId = DB::getPdo()->lastInsertId();
            $client = DB::selectOne("SELECT * FROM t1_clients WHERE id = ?", [$clientId]);

            return response()->json(['success' => true, 'client' => $client], 201);

        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Duplicado/Error: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }

    // 5. CREAR CONFIGURACION DE LICENCIA (MULTI-COUNT)
    public function createLicense(Request $request)
    {
        try {
            $request->validate([
                'client_id' => 'required|integer',
                'licenses' => 'required|array|min:1',
                'licenses.*.type' => 'required|in:trial,monthly,anual',
                'licenses.*.status' => 'required|in:active,suspended,expired,revoked',
                'licenses.*.expires_at' => 'nullable|date'
            ]);

            $insertedLicenses = [];

            foreach ($request->licenses as $licData) {
                $licenseKey = strtoupper(uniqid('LZR-') . '-' . substr(str_shuffle("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 5));

                DB::insert(
                    "INSERT INTO t2_licenses (client_id, license_key, type, status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
                    [
                        $request->client_id,
                        $licenseKey,
                        $licData['type'],
                        $licData['status'],
                        $licData['expires_at'] ?? null
                    ]
                );

                $licenseId = DB::getPdo()->lastInsertId();
                $insertedLicenses[] = DB::selectOne("SELECT * FROM t2_licenses WHERE id = ?", [$licenseId]);
            }

            return response()->json(['success' => true, 'message' => 'Lote de licencias generado.', 'licenses' => $insertedLicenses], 201);

        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validación Licencias: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }

    // 6. REGISTRAR PAGO Y ACTIVAR LICENCIA
    public function registerPayment(Request $request)
    {
        try {
            $request->validate([
                'license_id' => 'required|integer',
                'amount' => 'required|numeric|min:1',
                'gateway_reference' => 'nullable|string|max:255'
            ]);

            DB::insert(
                "INSERT INTO t3_payments (license_id, amount, gateway_reference, status, paid_at, created_at, updated_at) VALUES (?, ?, ?, 'completed', NOW(), NOW(), NOW())",
                [$request->license_id, $request->amount, $request->gateway_reference]
            );

            DB::update("UPDATE t2_licenses SET status = 'active', updated_at = NOW() WHERE id = ?", [$request->license_id]);

            return response()->json(['success' => true, 'message' => 'Abono registrado y licencia activada'], 201);

        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }

    // 7. OBTENER HISTORIAL DE PAGOS DE UNA LICENCIA
    public function getLicensePayments($licenseId)
    {
        try {
            $payments = DB::select(
                "SELECT * FROM t3_payments WHERE license_id = ? ORDER BY created_at DESC",
                [$licenseId]
            );
            return response()->json(['success' => true, 'payments' => $payments], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }

    // 8. DESHABILITAR LICENCIA
    public function disableLicense($licenseId)
    {
        try {
            DB::update("UPDATE t2_licenses SET status = 'suspended', updated_at = NOW() WHERE id = ?", [$licenseId]);
            return response()->json(['success' => true, 'message' => 'Licencia suspendida.'], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }
}
