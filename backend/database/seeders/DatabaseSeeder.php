<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder {
    public function run(): void {
        DB::table('t1_users')->insertOrIgnore([
            'name'       => 'Julian H',
            'email'      => 'admin@admin.com',
            'password'   => Hash::make('12345'),
            'role'       => 'admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Limpiar e insertar métodos de pago (idempotente)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('t1_payment_methods')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $methods = ['Nequi', 'Bancolombia', 'Davivienda', 'Efectivo', 'Tarjeta de Crédito'];
        foreach ($methods as $method) {
            DB::table('t1_payment_methods')->insert([
                'name'       => $method,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
