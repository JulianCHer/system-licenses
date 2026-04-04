<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('t1_enterprises', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('company_name')->nullable();
            $table->string('nit')->nullable();
            $table->string('establishment_type')->nullable();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->enum('status', ['active', 'inactive', 'erased'])->default('active');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('t1_enterprises');
    }
};
