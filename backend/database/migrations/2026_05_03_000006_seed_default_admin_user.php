<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;


return new class extends Migration {
    public function up(): void
    {
        DB::table('t0_users')->insert([
            'name' => 'JULIAN HERNANDEZ',
            'username' => 'JulianH11',
            'password' => Hash::make('Julian2019'),
            'role' => 'admin',
            'state' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('t0_users')->where('username', 'JulianH11')->delete();
    }
};
