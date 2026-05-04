<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = "SELECT * FROM t0_roles WHERE status != 'erased'";
            $params = [];

            if ($request->filled('search')) {
                $q = "%" . $request->search . "%";
                $query .= " AND (name LIKE ? OR description LIKE ?)";
                $params = [$q, $q];
            }

            $query .= " ORDER BY created_at DESC";
            $roles = DB::select($query, $params);

            // Fetch user counts for each role
            $roleIds = array_column($roles, 'id');
            if (!empty($roleIds)) {
                $placeholders = implode(',', array_fill(0, count($roleIds), '?'));
                $counts = DB::select("SELECT role_id, COUNT(*) as total FROM t0_users WHERE state != 'erased' AND role_id IN ($placeholders) GROUP BY role_id", $roleIds);
                $countsMap = [];
                foreach ($counts as $c) {
                    $countsMap[$c->role_id] = $c->total;
                }
                foreach ($roles as $role) {
                    $role->users_count = $countsMap[$role->id] ?? 0;
                }
            }

            return response()->json(['success' => true, 'data' => $roles]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al listar roles: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:100|unique:t0_roles,name',
                'description' => 'nullable|string|max:255',
            ]);

            DB::insert(
                "INSERT INTO t0_roles (name, description, status, created_at, updated_at) VALUES (?, ?, 'active', NOW(), NOW())",
                [$request->name, $request->description]
            );

            $id = DB::getPdo()->lastInsertId();
            $this->log($request, 'create_role', "Rol creado: {$request->name} (ID: $id)");

            $role = DB::selectOne("SELECT * FROM t0_roles WHERE id = ?", [$id]);
            $role->users_count = 0;
            return response()->json(['success' => true, 'message' => 'Rol creado correctamente.', 'data' => $role], 201);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al crear rol: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'name' => 'sometimes|string|max:100|unique:t0_roles,name,' . $id,
                'description' => 'nullable|string|max:255',
            ]);

            $updates = [];
            $params = [];
            foreach (['name', 'description'] as $f) {
                if ($request->has($f)) {
                    $updates[] = "$f = ?";
                    $params[] = $request->$f;
                }
            }
            if (empty($updates)) {
                return response()->json(['success' => false, 'message' => 'No hay campos para actualizar.'], 422);
            }
            $updates[] = "updated_at = NOW()";
            $params[] = $id;

            DB::update("UPDATE t0_roles SET " . implode(', ', $updates) . " WHERE id = ?", $params);

            $this->log($request, 'update_role', "Rol actualizado ID: $id");
            $role = DB::selectOne("SELECT * FROM t0_roles WHERE id = ?", [$id]);
            
            $count = DB::selectOne("SELECT COUNT(*) as total FROM t0_users WHERE state != 'erased' AND role_id = ?", [$id])->total;
            $role->users_count = $count;

            return response()->json(['success' => true, 'message' => 'Rol actualizado correctamente.', 'data' => $role]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al actualizar rol: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $role = DB::selectOne("SELECT * FROM t0_roles WHERE id = ?", [$id]);
            if (!$role) return response()->json(['success' => false, 'message' => 'Rol no encontrado.'], 404);

            $usersCount = DB::selectOne("SELECT COUNT(*) as total FROM t0_users WHERE role_id = ? AND state != 'erased'", [$id])->total;
            if ($usersCount > 0) {
                return response()->json(['success' => false, 'message' => 'No se puede eliminar el rol porque tiene usuarios asignados.'], 400);
            }

            DB::update("UPDATE t0_roles SET status = 'erased', updated_at = NOW() WHERE id = ?", [$id]);
            $this->log($request, 'delete_role', "Rol eliminado: {$role->name} (ID: $id)");

            return response()->json(['success' => true, 'message' => 'Rol eliminado correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al eliminar rol: ' . $e->getMessage()], 500);
        }
    }

    private function log(Request $request, string $action, string $description): void
    {
        try {
            DB::insert("INSERT INTO t4_validation_logs (license_id, attempted_macaddress, ip_address, validation_status, created_at) VALUES (NULL, ?, ?, 'success', NOW())", [$action . '|' . $description, $request->ip()]);
        } catch (\Exception $e) {}
    }
}
