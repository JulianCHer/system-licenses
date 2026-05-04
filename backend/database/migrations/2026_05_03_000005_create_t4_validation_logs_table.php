<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t4_validation_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('license_id')->nullable();
            $table->string('attempted_macaddress', 50)->nullable();
            $table->string('ip_address', 45);
            $table->enum('validation_status', [
                'success',
                'failed_expired',
                'failed_invalid_mac',
                'failed_invalid_key',
            ]);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('license_id', 'fk_t4_logs_license')
                  ->references('id')
                  ->on('t2_licenses')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t4_validation_logs');
    }
};
