<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = DB::selectOne("
            SELECT u.id, u.name as full_name, u.username, u.password, u.role_id, r.name as role_name 
            FROM t0_users u 
            LEFT JOIN t0_roles r ON u.role_id = r.id 
            WHERE u.username = ? AND u.state = 'active'
        ", [$request->username]);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario ingresado no existe o está inactivo.'
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña ingresada es incorrecta.'
            ], 401);
        }

        // Generate token using the User model since Sanctum requires a model
        $userModel = User::find($user->id);
        $token = $userModel->createToken('lazarus-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Bienvenido al sistema Lazarus',
            'token'   => $token,
            'user'    => [
                'id'        => $user->id,
                'full_name' => $user->full_name,
                'username'  => $user->username,
                'role'      => $user->role_name,
                'role_id'   => $user->role_id,
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente.'
        ], 200);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'new_password' => 'required|string|min:8',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario ingresado no existe.'
            ], 404);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente.'
        ], 200);
    }
}
