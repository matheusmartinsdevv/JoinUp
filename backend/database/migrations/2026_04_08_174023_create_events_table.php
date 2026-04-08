<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id("id_evento");
            $table->string('nome');
            $table->date('data');
            $table->text('descricao');
            $table->string('localizacao');
            $table->foreignId('id_genero_musical')
                ->constrained('generos_musicais')
                ->cascadeOnDelete();
            $table->foreignId('id_organizador')
                ->constrained('organizadores')
                ->cascadeOnDelete();

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
