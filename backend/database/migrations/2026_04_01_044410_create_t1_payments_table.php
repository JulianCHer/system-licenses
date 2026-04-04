<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('t1_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('license_id')->constrained('t1_licenses')->onDelete('cascade');
            $table->foreignId('payment_method_id')->constrained('t1_payment_methods')->onDelete('restrict');
            $table->decimal('amount', 12, 2);
            $table->string('reference_number')->nullable();
            $table->string('evidence_url')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('t1_payments');
    }
};
