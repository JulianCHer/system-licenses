<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('t1_licenses_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('t1_licenses_users');
            $table->string('entity_name', 50)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('action', 100)->nullable();
            $table->text('details')->nullable();
            $table->string('ip_address', 50)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('t1_licenses_audit_logs');
    }
};
