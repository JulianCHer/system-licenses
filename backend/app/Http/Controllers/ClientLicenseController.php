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
            $query = "SELECT * FROM t1_enterprises WHERE status != 'erased'";
            $params = [];

            if ($request->filled('name')) {
                $query .= " AND (full_name LIKE ? OR company_name LIKE ?)";
                $name = "%" . $request->name . "%";
                $params[] = $name;
                $params[] = $name;
            }

            if ($request->filled('establishment_type')) {
                $query .= " AND id IN (SELECT enterprise_id FROM t1_licenses WHERE app_type = ?)";
                $params[] = $request->establishment_type;
            }

            if ($request->filled('status') && $request->status !== 'all') {
                $query .= " AND id IN (SELECT enterprise_id FROM t1_licenses WHERE status = ?)";
                $params[] = $request->status;
            }

            $query .= " ORDER BY created_at DESC";

            $clients = DB::select($query, $params);

            if (count($clients) > 0) {
                $userIds = array_map(function($c) { return $c->id; }, $clients);
                $placeholders = implode(',', array_fill(0, count($userIds), '?'));
                
                $licQuery = "SELECT * FROM t1_licenses WHERE enterprise_id IN ($placeholders)";
                $licParams = $userIds;

                if ($request->filled('status') && $request->status !== 'all') {
                    $licQuery .= " AND status = ?";
                    $licParams[] = $request->status;
                }

                $licenses = DB::select($licQuery, $licParams);
                
                $licensesByUser = [];
                foreach ($licenses as $lic) {
                    $licensesByUser[$lic->enterprise_id][] = $lic;
                }
                
                foreach ($clients as $client) {
                    $client->licenses = $licensesByUser[$client->id] ?? [];
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
                "SELECT p.*, l.license_key, l.app_type, m.name as payment_method 
                 FROM t1_payments p 
                 JOIN t1_licenses l ON p.license_id = l.id 
                 JOIN t1_payment_methods m ON p.payment_method_id = m.id 
                 WHERE l.enterprise_id = ? ORDER BY p.created_at DESC", 
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
                'full_name' => 'sometimes|string|max:150',
                'company_name' => 'sometimes|string|max:150',
                'nit' => 'sometimes|string|max:50',
                'establishment_type' => 'sometimes|string|max:100',
                'email' => 'sometimes|email|unique:t1_enterprises,email,' . $id,
                'phone' => 'sometimes|string|max:50',
            ]);

            $updates = [];
            $params = [];

            $fields = ['full_name', 'company_name', 'nit', 'establishment_type', 'email', 'phone'];
            foreach($fields as $field) {
                if ($request->has($field)) {
                    $updates[] = "$field = ?";
                    $params[] = $request->$field;
                }
            }

            if (count($updates) > 0) {
                $updates[] = "updated_at = NOW()";
                $sql = "UPDATE t1_enterprises SET " . implode(', ', $updates) . " WHERE id = ?";
                $params[] = $id;
                DB::update($sql, $params);
            }

            if ($request->has('licenses') && is_array($request->licenses)) {
                foreach ($request->licenses as $lic) {
                    if (isset($lic['id'])) {
                        DB::update(
                            "UPDATE t1_licenses SET app_type = ?, plan_type = ?, start_date = ?, end_date = ?, updated_at = NOW() WHERE id = ?",
                            [$lic['app_type'], $lic['plan_type'], $lic['start_date'], $lic['end_date'], $lic['id']]
                        );
                    }
                }
            }

            $user = DB::selectOne("SELECT * FROM t1_enterprises WHERE id = ?", [$id]);
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
            DB::update("UPDATE t1_enterprises SET status = 'erased', updated_at = NOW() WHERE id = ?", [$id]);
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
                'full_name' => 'required|string|max:150',
                'company_name' => 'required|string|max:150',
                'nit' => 'required|string|max:50',
                'establishment_type' => 'required|string|max:100',
                'email' => 'required|email|unique:t1_enterprises,email',
                'phone' => 'nullable|string|max:50',
            ]);
            
            DB::insert(
                "INSERT INTO t1_enterprises (full_name, company_name, nit, establishment_type, email, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())",
                [ $request->full_name, $request->company_name, $request->nit, $request->establishment_type, $request->email, $request->phone ]
            );

            $userId = DB::getPdo()->lastInsertId();
            $user = DB::selectOne("SELECT * FROM t1_enterprises WHERE id = ?", [$userId]);

            return response()->json(['success' => true, 'client' => $user], 201);

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
                'enterprise_id' => 'required|integer',
                'licenses' => 'required|array|min:1',
                'licenses.*.app_type' => 'required|string|max:100',
                'licenses.*.plan_type' => 'required|string|max:50',
                'licenses.*.start_date' => 'required|date',
                'licenses.*.end_date' => 'required|date|after_or_equal:licenses.*.start_date',
                'licenses.*.status' => 'required|string|max:50'
            ]);

            $insertedLicenses = [];

            foreach ($request->licenses as $licData) {
                $licenseKey = strtoupper(uniqid('LZR-') . '-' . substr(str_shuffle("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 5));

                DB::insert(
                    "INSERT INTO t1_licenses (enterprise_id, license_key, app_type, plan_type, status, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
                    [
                        $request->enterprise_id, 
                        $licenseKey, 
                        $licData['app_type'],
                        $licData['plan_type'],
                        $licData['status'],
                        $licData['start_date'], 
                        $licData['end_date']
                    ]
                );

                $licenseId = DB::getPdo()->lastInsertId();
                $insertedLicenses[] = DB::selectOne("SELECT * FROM t1_licenses WHERE id = ?", [$licenseId]);
            }

            return response()->json(['success' => true, 'message' => 'Lote de t1_licenses generado.', 'licenses' => $insertedLicenses], 201);

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
                'amount_paid' => 'required|numeric|min:1',
                'payment_method' => 'required|string|max:50',
                'reference_number' => 'nullable|string|max:100',
                'evidence' => 'nullable|image|max:5120'
            ]);

            $evidenceUrl = null;
            if ($request->hasFile('evidence')) {
                $path = $request->file('evidence')->store('receipts', 'public');
                $evidenceUrl = '/storage/' . $path;
            }

            // Encuentra el payment_method_id a partir del string quemado temporalmente
            $method = DB::selectOne("SELECT id FROM t1_payment_methods WHERE name = ? LIMIT 1", [$request->payment_method]);
            $methodId = $method ? $method->id : 1; 

            DB::insert(
                "INSERT INTO t1_payments (license_id, payment_method_id, amount, reference_number, evidence_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
                [$request->license_id, $methodId, $request->amount_paid, $request->reference_number, $evidenceUrl]
            );

            DB::update("UPDATE t1_licenses SET status = 'active', updated_at = NOW() WHERE id = ?", [$request->license_id]);

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
                "SELECT p.*, m.name as payment_method FROM t1_payments p JOIN t1_payment_methods m ON p.payment_method_id = m.id WHERE p.license_id = ? ORDER BY p.created_at DESC", 
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
            DB::update("UPDATE t1_licenses SET status = 'disabled', updated_at = NOW() WHERE id = ?", [$licenseId]);
            return response()->json(['success' => true, 'message' => 'Licencia suspendida.'], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error SQL: ' . $e->getMessage()], 500);
        }
    }
}
