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
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)
            ->where('state', 'active')
            ->first();

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

        $token = $user->createToken('lazarus-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Bienvenido al sistema Lazarus',
            'token'   => $token,
            'user'    => [
                'id'        => $user->id,
                'full_name' => $user->name,
                'username'  => $user->username,
                'role'      => $user->role,
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
