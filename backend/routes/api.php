<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\LicenseController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LogController;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', fn(Request $request) => $request->user());

    // Módulo Clientes
    Route::get('/clients', [ClientController::class, 'index']);
    Route::post('/clients', [ClientController::class, 'store']);
    Route::get('/clients/{id}', [ClientController::class, 'show']);
    Route::put('/clients/{id}', [ClientController::class, 'update']);
    Route::delete('/clients/{id}', [ClientController::class, 'destroy']);

    // Módulo Licencias
    Route::get('/licenses', [LicenseController::class, 'index']);
    Route::post('/licenses', [LicenseController::class, 'store']);
    Route::put('/licenses/{id}', [LicenseController::class, 'update']);
    Route::delete('/licenses/{id}', [LicenseController::class, 'destroy']);

    // Módulo Facturación / Pagos
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::put('/payments/{id}', [PaymentController::class, 'update']);
    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);

    // Módulo Roles
    Route::get('/roles', [App\Http\Controllers\RoleController::class, 'index']);
    Route::post('/roles', [App\Http\Controllers\RoleController::class, 'store']);
    Route::put('/roles/{id}', [App\Http\Controllers\RoleController::class, 'update']);
    Route::delete('/roles/{id}', [App\Http\Controllers\RoleController::class, 'destroy']);

    // Módulo Usuarios
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::patch('/users/{id}/role', [UserController::class, 'changeRole']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Módulo Logs
    Route::get('/logs', [LogController::class, 'index']);
});
