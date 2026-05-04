<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t3_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('license_id');
            $table->decimal('amount', 10, 2);
            $table->string('gateway_reference', 255)->nullable();
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('license_id', 'fk_t3_payments_license')
                  ->references('id')
                  ->on('t2_licenses')
                  ->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t3_payments');
    }
};
