<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('t1_audit_logs', function (Blueprint $table) {
            $table->id();

            // Quién hizo la acción (nullable si es sistema/guest)
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable(); // snapshot del nombre al momento del log

            // Qué acción realizó
            $table->string('action');            // ej: 'login', 'create', 'update', 'delete', 'disable', 'payment'
            $table->string('module');            // ej: 'enterprise', 'license', 'payment', 'auth'
            $table->string('description');       // mensaje legible: "Creó la empresa Hoteles XYZ"

            // Sobre qué entidad
            $table->string('entity_type')->nullable();   // ej: 'enterprise', 'license', 'payment'
            $table->unsignedBigInteger('entity_id')->nullable(); // ID del registro afectado

            // Valores antes/después (para auditoría de cambios)
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            // Metadatos de red
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
            $table->index('action');
        });
    }

    public function down(): void {
        Schema::dropIfExists('t1_audit_logs');
    }
};
