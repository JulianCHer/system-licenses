<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = DB::table('t1_users')->where('name', $request->email)
            ->where('State', 'Active')->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario o contraseña incorrectos.'
            ], 401);
        }

        $eloquentUser = User::find($user->id);
        $token = $eloquentUser->createToken('lazarus-auth-token')->plainTextToken;

        DB::table('t1_logs')->insert([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => 'LOGIN',
            'module' => 'auth',
            'description' => "El usuario '{$user->name}' inició sesión.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bienvenido al sistema Lazarus',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'full_name' => $user->name,
                'role_id' => $user->role === 'admin' ? 2 : 1,
            ]
        ], 200);
    }
}
