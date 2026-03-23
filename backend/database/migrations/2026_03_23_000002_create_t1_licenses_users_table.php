<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('t1_licenses_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('t1_licenses_roles');
            $table->string('full_name', 150);
            $table->string('company_name', 150)->nullable();
            $table->string('email', 150)->unique();
            $table->string('password_hash', 255);
            $table->string('phone_number', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('t1_licenses_users');
    }
};
