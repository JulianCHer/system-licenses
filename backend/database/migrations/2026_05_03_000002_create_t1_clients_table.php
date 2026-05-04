<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t1_clients', function (Blueprint $table) {
            $table->id();
            $table->string('client_name', 150);
            $table->string('business_name', 150)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('nit', 50)->unique()->nullable();
            $table->string('type_enterprise', 100)->nullable();
            $table->string('email', 150)->unique();
            $table->enum('status', ['active', 'erased'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t1_clients');
    }
};
