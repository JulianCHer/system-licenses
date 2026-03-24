<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // 1. Insertamos el rol de Administrador primero (por la llave foránea)
        $roleId = DB::table('t1_licenses_roles')->insertGetId([
            'name' => 'ADMIN',
            'description' => 'Administrador absoluto del sistema Lazarus',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Insertamos tu usuario Administrador
        // NOTA: Usaremos el campo 'email' como tu nombre de usuario ('JulianH11')
        DB::table('t1_licenses_users')->insert([
            'role_id' => $roleId,
            'full_name' => 'Julian H',
            'company_name' => 'Lazarus Core',
            'email' => 'JulianH11', 
            'password_hash' => Hash::make('Azuladh@ra25'),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
