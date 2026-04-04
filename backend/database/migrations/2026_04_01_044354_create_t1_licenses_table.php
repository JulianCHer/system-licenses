<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('t1_licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enterprise_id')->constrained('t1_enterprises')->onDelete('cascade');
            $table->string('license_key')->unique();
            $table->string('app_type');
            $table->string('plan_type');
            $table->enum('status', ['active', 'pending', 'disabled', 'erased'])->default('pending');
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('t1_licenses');
    }
};
