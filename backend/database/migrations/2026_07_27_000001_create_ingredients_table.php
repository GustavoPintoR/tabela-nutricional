<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('energia', 10, 2)->default(0);
            $table->decimal('carbo', 10, 2)->default(0);
            $table->decimal('proteina', 10, 2)->default(0);
            $table->decimal('gordura', 10, 2)->default(0);
            $table->decimal('fibra', 10, 2)->default(0);
            $table->decimal('sodio', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
