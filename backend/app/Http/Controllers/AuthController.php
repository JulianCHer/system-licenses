<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Helpers\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|string',
            'password' => 'required|string',
        ]);

        // Consulta directa para evitar problemas con $hidden en Eloquent
        $user = DB::table('t1_users')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            AuditLogger::log('LOGIN_FAILED', 'auth', "Intento de login fallido para: {$request->email}");
            return response()->json([
                'success' => false,
                'message' => 'Usuario o contraseña incorrectos.'
            ], 401);
        }

        // Usar el modelo Eloquent sólo para generar el Sanctum token
        $eloquentUser = User::find($user->id);
        $token = $eloquentUser->createToken('lazarus-auth-token')->plainTextToken;

        AuditLogger::log('LOGIN', 'auth', "Login exitoso de {$user->name}", [
            'user_id'   => $user->id,
            'user_name' => $user->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bienvenido al sistema Lazarus',
            'token'   => $token,
            'user'    => [
                'id'        => $user->id,
                'full_name' => $user->name,
                'role_id'   => $user->role === 'admin' ? 2 : 1,
            ]
        ], 200);
    }
}
