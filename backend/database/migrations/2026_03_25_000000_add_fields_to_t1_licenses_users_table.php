<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('t1_licenses_users', function (Blueprint $table) {
            $table->string('establishment_type', 100)->nullable()->after('phone_number');
            $table->string('status', 50)->default('active')->after('establishment_type');
        });
    }

    public function down()
    {
        Schema::table('t1_licenses_users', function (Blueprint $table) {
            $table->dropColumn(['establishment_type', 'status']);
        });
    }
};
