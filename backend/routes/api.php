<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientLicenseController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Ruta pública de autenticación validada para la tabla personalizada
Route::post('/login', [AuthController::class, 'login']);

// Grupo de rutas protegidas para usar con el Token de React
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Módulo Principal: Clientes y Licencias
    Route::get('/clients', [ClientLicenseController::class, 'getClients']);
    Route::post('/clients', [ClientLicenseController::class, 'createClient']);
    Route::put('/clients/{id}', [ClientLicenseController::class, 'updateClient']);
    Route::delete('/clients/{id}', [ClientLicenseController::class, 'eraseClient']);
    Route::post('/licenses', [ClientLicenseController::class, 'createLicense']);
});
