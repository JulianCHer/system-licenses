<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('t1_licenses_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('t1_licenses_users');
            $table->foreignId('plan_id')->constrained('t1_licenses_plans');
            $table->decimal('amount_paid', 10, 2);
            $table->string('payment_method', 50)->nullable();
            $table->string('reference_number', 100)->nullable();
            $table->string('evidence_url', 255)->nullable();
            $table->string('status', 50)->default('PENDING_VALIDATION');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('t1_licenses_users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('t1_licenses_payments');
    }
};
