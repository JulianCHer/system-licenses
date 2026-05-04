<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LicenseController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = "SELECT l.*, c.client_name, c.business_name, c.email AS client_email
                FROM t2_licenses l LEFT JOIN t1_clients c ON l.client_id = c.id WHERE 1=1";
            $params = [];

            if ($request->filled('search')) {
                $q = "%" . $request->search . "%";
                $query .= " AND (l.license_key LIKE ? OR c.client_name LIKE ? OR c.business_name LIKE ?)";
                $params = array_merge($params, [$q, $q, $q]);
            }
            if ($request->filled('status') && $request->status !== 'all') {
                $query .= " AND l.status = ?";
                $params[] = $request->status;
            }
            if ($request->filled('type') && $request->type !== 'all') {
                $query .= " AND l.type = ?";
                $params[] = $request->type;
            }
            if ($request->filled('expiring')) {
                $query .= " AND l.expires_at IS NOT NULL AND l.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) AND l.status = 'active'";
            }
            $query .= " ORDER BY l.created_at DESC";
            $licenses = DB::select($query, $params);
            return response()->json(['success' => true, 'data' => $licenses]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al listar licencias: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'client_id'     => 'required|integer',
                'type'          => 'required|in:trial,monthly,anual',
                'status'        => 'required|in:active,suspended,expired,revoked',
                'expires_at'    => 'nullable|date',
                'pc_macaddress' => 'nullable|string|max:50',
            ]);

            $key = 'LZR-' . strtoupper(bin2hex(random_bytes(4))) . '-' . strtoupper(bin2hex(random_bytes(4)));
            DB::insert(
                "INSERT INTO t2_licenses (client_id, license_key, pc_macaddress, status, type, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
                [$request->client_id, $key, $request->pc_macaddress, $request->status, $request->type, $request->expires_at]
            );
            $id = DB::getPdo()->lastInsertId();
            $this->log($request, 'create_license', "Licencia creada: $key (cliente: {$request->client_id})");
            $license = DB::selectOne("SELECT l.*, c.client_name, c.business_name FROM t2_licenses l LEFT JOIN t1_clients c ON l.client_id = c.id WHERE l.id = ?", [$id]);
            return response()->json(['success' => true, 'message' => 'Licencia creada correctamente.', 'data' => $license], 201);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al crear licencia: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'type'          => 'sometimes|in:trial,monthly,anual',
                'status'        => 'sometimes|in:active,suspended,expired,revoked',
                'expires_at'    => 'nullable|date',
                'pc_macaddress' => 'nullable|string|max:50',
            ]);
            $updates = [];
            $params = [];
            foreach (['type', 'status', 'expires_at', 'pc_macaddress'] as $f) {
                if ($request->has($f)) { $updates[] = "$f = ?"; $params[] = $request->$f; }
            }
            if (empty($updates)) {
                return response()->json(['success' => false, 'message' => 'No hay campos para actualizar.'], 422);
            }
            $updates[] = "updated_at = NOW()";
            $params[] = $id;
            DB::update("UPDATE t2_licenses SET " . implode(', ', $updates) . " WHERE id = ?", $params);
            $this->log($request, 'update_license', "Licencia actualizada ID: $id");
            $license = DB::selectOne("SELECT l.*, c.client_name FROM t2_licenses l LEFT JOIN t1_clients c ON l.client_id = c.id WHERE l.id = ?", [$id]);
            return response()->json(['success' => true, 'message' => 'Licencia actualizada correctamente.', 'data' => $license]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al actualizar licencia: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $lic = DB::selectOne("SELECT * FROM t2_licenses WHERE id = ?", [$id]);
            if (!$lic) return response()->json(['success' => false, 'message' => 'Licencia no encontrada.'], 404);
            DB::update("UPDATE t2_licenses SET status = 'revoked', updated_at = NOW() WHERE id = ?", [$id]);
            $this->log($request, 'delete_license', "Licencia revocada: {$lic->license_key} (ID: $id)");
            return response()->json(['success' => true, 'message' => 'Licencia revocada correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al revocar licencia: ' . $e->getMessage()], 500);
        }
    }

    private function log(Request $request, string $action, string $description): void
    {
        try {
            DB::insert("INSERT INTO t4_validation_logs (license_id, attempted_macaddress, ip_address, validation_status, created_at) VALUES (NULL, ?, ?, 'success', NOW())", [$action . '|' . $description, $request->ip()]);
        } catch (\Exception $e) {}
    }
}
