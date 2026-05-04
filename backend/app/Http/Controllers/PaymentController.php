<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = "SELECT p.*, l.license_key, l.type AS license_type, c.client_name, c.business_name
                FROM t3_payments p
                LEFT JOIN t2_licenses l ON p.license_id = l.id
                LEFT JOIN t1_clients c ON l.client_id = c.id
                WHERE 1=1";
            $params = [];

            if ($request->filled('search')) {
                $q = "%" . $request->search . "%";
                $query .= " AND (l.license_key LIKE ? OR c.client_name LIKE ? OR p.gateway_reference LIKE ?)";
                $params = array_merge($params, [$q, $q, $q]);
            }
            if ($request->filled('status') && $request->status !== 'all') {
                $query .= " AND p.status = ?";
                $params[] = $request->status;
            }
            if ($request->filled('from')) {
                $query .= " AND DATE(p.created_at) >= ?";
                $params[] = $request->from;
            }
            if ($request->filled('to')) {
                $query .= " AND DATE(p.created_at) <= ?";
                $params[] = $request->to;
            }
            if ($request->filled('client_id')) {
                $query .= " AND c.id = ?";
                $params[] = $request->client_id;
            }

            $query .= " ORDER BY p.created_at DESC";
            $payments = DB::select($query, $params);

            $total = array_sum(array_map(fn($p) => (float)$p->amount, $payments));
            return response()->json(['success' => true, 'data' => $payments, 'total' => $total]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al listar pagos: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'license_id'        => 'required|integer',
                'amount'            => 'required|numeric|min:0.01',
                'status'            => 'required|in:pending,completed,failed',
                'gateway_reference' => 'nullable|string|max:255',
                'paid_at'           => 'nullable|date',
            ]);

            DB::insert(
                "INSERT INTO t3_payments (license_id, amount, gateway_reference, status, paid_at, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
                [
                    $request->license_id,
                    $request->amount,
                    $request->gateway_reference,
                    $request->status,
                    $request->status === 'completed' ? ($request->paid_at ?? now()) : null,
                ]
            );

            $id = DB::getPdo()->lastInsertId();

            if ($request->status === 'completed') {
                DB::update("UPDATE t2_licenses SET status = 'active', updated_at = NOW() WHERE id = ?", [$request->license_id]);
            }

            $this->log($request, 'create_payment', "Pago creado ID: $id, licencia: {$request->license_id}, monto: {$request->amount}");

            $payment = DB::selectOne("SELECT p.*, l.license_key, c.client_name FROM t3_payments p LEFT JOIN t2_licenses l ON p.license_id = l.id LEFT JOIN t1_clients c ON l.client_id = c.id WHERE p.id = ?", [$id]);
            return response()->json(['success' => true, 'message' => 'Pago registrado correctamente.', 'data' => $payment], 201);

        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al registrar pago: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'amount'            => 'sometimes|numeric|min:0.01',
                'status'            => 'sometimes|in:pending,completed,failed',
                'gateway_reference' => 'nullable|string|max:255',
                'paid_at'           => 'nullable|date',
            ]);

            $updates = [];
            $params = [];
            foreach (['amount', 'status', 'gateway_reference', 'paid_at'] as $f) {
                if ($request->has($f)) { $updates[] = "$f = ?"; $params[] = $request->$f; }
            }
            if (empty($updates)) return response()->json(['success' => false, 'message' => 'Sin campos para actualizar.'], 422);

            $updates[] = "updated_at = NOW()";
            $params[] = $id;
            DB::update("UPDATE t3_payments SET " . implode(', ', $updates) . " WHERE id = ?", $params);

            $this->log($request, 'update_payment', "Pago actualizado ID: $id");
            $payment = DB::selectOne("SELECT p.*, l.license_key, c.client_name FROM t3_payments p LEFT JOIN t2_licenses l ON p.license_id = l.id LEFT JOIN t1_clients c ON l.client_id = c.id WHERE p.id = ?", [$id]);
            return response()->json(['success' => true, 'message' => 'Pago actualizado correctamente.', 'data' => $payment]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al actualizar pago: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $pay = DB::selectOne("SELECT * FROM t3_payments WHERE id = ?", [$id]);
            if (!$pay) return response()->json(['success' => false, 'message' => 'Pago no encontrado.'], 404);
            DB::delete("DELETE FROM t3_payments WHERE id = ?", [$id]);
            $this->log($request, 'delete_payment', "Pago eliminado ID: $id");
            return response()->json(['success' => true, 'message' => 'Pago eliminado correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al eliminar pago: ' . $e->getMessage()], 500);
        }
    }

    private function log(Request $request, string $action, string $description): void
    {
        try {
            DB::insert("INSERT INTO t4_validation_logs (license_id, attempted_macaddress, ip_address, validation_status, created_at) VALUES (NULL, ?, ?, 'success', NOW())", [$action . '|' . $description, $request->ip()]);
        } catch (\Exception $e) {}
    }
}
