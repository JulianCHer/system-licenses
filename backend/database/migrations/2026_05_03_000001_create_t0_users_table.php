<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t0_users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('username', 50)->unique();
            $table->string('password', 255);
            $table->unsignedBigInteger('role_id');
            $table->foreign('role_id')->references('id')->on('t0_roles');
            $table->enum('state', ['active', 'erased'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t0_users');
    }
};
