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
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Grupo de rutas protegidas para usar con el Token de React
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Módulo Principal: Clientes y Licencias
    Route::get('/clients', [ClientLicenseController::class, 'getClients']);
    Route::post('/clients', [ClientLicenseController::class, 'createClient']);
    Route::put('/clients/{id}', [ClientLicenseController::class, 'updateClient']);
    Route::get('/clients/{id}/payments', [ClientLicenseController::class, 'getClientPayments']);
    Route::delete('/clients/{id}', [ClientLicenseController::class, 'eraseClient']);
    Route::post('/licenses', [ClientLicenseController::class, 'createLicense']);
    Route::post('/payments', [ClientLicenseController::class, 'registerPayment']);
    Route::get('/licenses/{id}/payments', [ClientLicenseController::class, 'getLicensePayments']);
    Route::put('/licenses/{id}/disable', [ClientLicenseController::class, 'disableLicense']);
});
