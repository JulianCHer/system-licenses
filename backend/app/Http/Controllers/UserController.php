<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = min((int) $request->get('per_page', 20), 100);
            $page = max((int) $request->get('page', 1), 1);
            $offset = ($page - 1) * $perPage;

            $where = "WHERE u.state != 'erased'";
            $params = [];

            if ($request->filled('search')) {
                $q = '%' . $request->search . '%';
                $where .= " AND (u.name LIKE ? OR u.username LIKE ?)";
                $params[] = $q;
                $params[] = $q;
            }

            if ($request->filled('role_id') && $request->role_id !== 'all') {
                $where .= " AND u.role_id = ?";
                $params[] = $request->role_id;
            }

            $total = DB::selectOne("SELECT COUNT(*) AS total FROM t0_users u $where", $params)->total;

            $users = DB::select(
                "SELECT u.id, u.name, u.username, u.role_id, r.name as role_name, u.state, u.created_at, u.updated_at
                 FROM t0_users u
                 LEFT JOIN t0_roles r ON u.role_id = r.id
                 $where
                 ORDER BY u.created_at DESC
                 LIMIT ? OFFSET ?",
                array_merge($params, [$perPage, $offset])
            );

            return response()->json([
                'success' => true,
                'data' => $users,
                'total' => (int) $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => (int) ceil($total / $perPage),
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al listar usuarios: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:150',
                'username' => 'required|string|max:50|unique:t0_users,username',
                'password' => 'required|string|min:6',
                'role_id' => 'required|integer|exists:t0_roles,id',
            ]);

            DB::insert(
                "INSERT INTO t0_users (name, username, password, role_id, state, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', NOW(), NOW())",
                [$request->name, $request->username, Hash::make($request->password), $request->role_id]
            );

            $id = DB::getPdo()->lastInsertId();
            $this->log($request, 'create_user', "Usuario creado: {$request->username} (ID: $id)");

            $user = DB::selectOne("SELECT u.id, u.name, u.username, u.role_id, r.name as role_name, u.state, u.created_at, u.updated_at FROM t0_users u LEFT JOIN t0_roles r ON u.role_id = r.id WHERE u.id = ?", [$id]);

            return response()->json(['success' => true, 'message' => 'Usuario creado correctamente.', 'data' => $user], 201);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al crear usuario: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'name' => 'sometimes|string|max:150',
                'username' => 'sometimes|string|max:50|unique:t0_users,username,' . $id,
                'password' => 'nullable|string|min:6',
                'role_id' => 'sometimes|integer|exists:t0_roles,id',
                'state' => 'sometimes|in:active,erased',
            ]);

            $updates = [];
            $params = [];

            foreach (['name', 'username', 'role_id', 'state'] as $f) {
                if ($request->has($f)) {
                    $updates[] = "$f = ?";
                    $params[] = $request->$f;
                }
            }

            if ($request->filled('password')) {
                $updates[] = "password = ?";
                $params[] = Hash::make($request->password);
            }

            if (empty($updates)) {
                return response()->json(['success' => false, 'message' => 'No hay campos para actualizar.'], 422);
            }

            $updates[] = "updated_at = NOW()";
            $params[] = $id;

            DB::update("UPDATE t0_users SET " . implode(', ', $updates) . " WHERE id = ?", $params);

            $this->log($request, 'update_user', "Usuario actualizado ID: $id");

            $user = DB::selectOne("SELECT u.id, u.name, u.username, u.role_id, r.name as role_name, u.state, u.created_at, u.updated_at FROM t0_users u LEFT JOIN t0_roles r ON u.role_id = r.id WHERE u.id = ?", [$id]);

            return response()->json(['success' => true, 'message' => 'Usuario actualizado correctamente.', 'data' => $user]);

        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Error de validación: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al actualizar usuario: ' . $e->getMessage()], 500);
        }
    }

    public function changeRole(Request $request, $id)
    {
        try {
            $request->validate(['role_id' => 'required|integer|exists:t0_roles,id']);
            DB::update("UPDATE t0_users SET role_id = ?, updated_at = NOW() WHERE id = ?", [$request->role_id, $id]);
            $this->log($request, 'update_user', "Rol cambiado a ID '{$request->role_id}' — Usuario ID: $id");
            return response()->json(['success' => true, 'message' => 'Rol actualizado correctamente.']);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Rol inválido: ' . $e->validator->errors()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al cambiar el rol: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $user = DB::selectOne("SELECT * FROM t0_users WHERE id = ?", [$id]);
            if (!$user)
                return response()->json(['success' => false, 'message' => 'Usuario no encontrado.'], 404);

            DB::update("UPDATE t0_users SET state = 'erased', updated_at = NOW() WHERE id = ?", [$id]);
            $this->log($request, 'delete_user', "Usuario eliminado: {$user->username} (ID: $id)");

            return response()->json(['success' => true, 'message' => 'Usuario eliminado correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al eliminar usuario: ' . $e->getMessage()], 500);
        }
    }

    private function log(Request $request, string $action, string $description): void
    {
        try {
            DB::insert("INSERT INTO t4_validation_logs (license_id, attempted_macaddress, ip_address, validation_status, created_at) VALUES (NULL, ?, ?, 'success', NOW())", [$action . '|' . $description, $request->ip()]);
        } catch (\Exception $e) {
        }
    }
}
