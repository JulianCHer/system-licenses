<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;


return new class extends Migration {
    public function up(): void
    {
        // Insert default roles
        DB::table('t0_roles')->insert([
            ['name' => 'admin', 'description' => 'Administrador del sistema', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'operator', 'description' => 'Operador regular', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'viewer', 'description' => 'Visualizador', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $adminRole = DB::table('t0_roles')->where('name', 'admin')->first();

        DB::table('t0_users')->insert([
            'name' => 'JULIAN HERNANDEZ',
            'username' => 'JulianH11',
            'password' => Hash::make('Julian2019'),
            'role_id' => $adminRole->id,
            'state' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('t0_users')->where('username', 'JulianH11')->delete();
        DB::table('t0_roles')->whereIn('name', ['admin', 'operator', 'viewer'])->delete();
    }
};
