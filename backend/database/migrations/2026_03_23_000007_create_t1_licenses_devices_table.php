<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('t1_licenses_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('license_id')->constrained('t1_licenses_records');
            $table->string('hardware_id', 255);
            $table->string('device_name', 100)->nullable();
            $table->timestamp('registered_at')->useCurrent();
            $table->timestamp('last_login_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->unique(['license_id', 'hardware_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('t1_licenses_devices');
    }
};
