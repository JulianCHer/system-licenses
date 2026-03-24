<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        // Validamos la contraseña usando Hash::check y password_hash (esquema personalizado)
        if (! $user || ! Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario o contraseña incorrectos.'
            ], 401);
        }

        // Validación adicional para bloqueo manual
        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'La cuenta de administrador está inactiva.'
            ], 403);
        }

        // Generar un Personal Access Token (Sanctum) para consumirlo desde Next.js
        $token = $user->createToken('lazarus-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Bienvenido al sistema Lazarus',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'role_id' => $user->role_id
            ]
        ], 200);
    }
}
