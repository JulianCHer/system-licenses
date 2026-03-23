<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('t1_licenses_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('t1_licenses_users');
            $table->foreignId('product_id')->constrained('t1_licenses_products');
            $table->foreignId('payment_id')->nullable()->constrained('t1_licenses_payments');
            $table->string('license_key', 255)->unique();
            $table->dateTime('start_date')->useCurrent();
            $table->dateTime('end_date');
            $table->string('status', 50)->default('ACTIVE');
            $table->integer('max_devices')->default(1);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('t1_licenses_records');
    }
};
