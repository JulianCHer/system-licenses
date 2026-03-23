<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('t1_licenses_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('t1_licenses_products');
            $table->string('name', 100);
            $table->integer('duration_days');
            $table->decimal('price', 10, 2);
            $table->integer('max_devices')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('t1_licenses_plans');
    }
};
