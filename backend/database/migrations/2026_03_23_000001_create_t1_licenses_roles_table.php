<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('t1_licenses_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->text('description')->nullable();
            $table->timestamps(); // Agrega created_at y updated_at automáticamente
        });
    }

    public function down()
    {
        Schema::dropIfExists('t1_licenses_roles');
    }
};
