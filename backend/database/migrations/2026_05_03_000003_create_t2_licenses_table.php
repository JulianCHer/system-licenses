<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t2_licenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('client_id');
            $table->string('license_key', 255)->unique();
            $table->string('pc_macaddress', 50)->nullable();
            $table->enum('status', ['active', 'suspended', 'expired', 'revoked'])->default('active');
            $table->enum('type', ['trial', 'monthly', 'anual'])->default('trial');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deleted_at')->nullable();

            $table->foreign('client_id', 'fk_t2_licenses_client')
                  ->references('id')
                  ->on('t1_clients')
                  ->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t2_licenses');
    }
};
