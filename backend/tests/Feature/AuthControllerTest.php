<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    // Crear usuario de prueba antes de cada test
    private function crearUsuario(string $email = 'test@test.com', string $password = 'secret123'): void
    {
        \Illuminate\Support\Facades\DB::table('t1_users')->insert([
            'name'       => 'Usuario Test',
            'email'      => $email,
            'password'   => Hash::make($password),
            'role'       => 'admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** @test */
    public function login_exitoso_con_credenciales_correctas(): void
    {
        $this->crearUsuario('admin@test.com', 'password123');

        $response = $this->postJson('/api/login', [
            'email'    => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'token',
                     'user' => ['id', 'full_name', 'role_id'],
                 ])
                 ->assertJson(['success' => true]);
    }

    /** @test */
    public function login_falla_con_contrasena_incorrecta(): void
    {
        $this->crearUsuario('admin@test.com', 'password123');

        $response = $this->postJson('/api/login', [
            'email'    => 'admin@test.com',
            'password' => 'contrasena_incorrecta',
        ]);

        $response->assertStatus(401)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Usuario o contraseña incorrectos.',
                 ]);
    }

    /** @test */
    public function login_falla_con_email_inexistente(): void
    {
        $response = $this->postJson('/api/login', [
            'email'    => 'noexiste@test.com',
            'password' => 'cualquiera',
        ]);

        $response->assertStatus(401)
                 ->assertJson(['success' => false]);
    }

    /** @test */
    public function login_falla_si_faltan_campos_requeridos(): void
    {
        // Sin ningún dato
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422);
    }

    /** @test */
    public function login_falla_si_falta_solo_el_password(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@test.com',
        ]);

        $response->assertStatus(422);
    }
}
