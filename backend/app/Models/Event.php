<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $table = 'evento';
    protected $primaryKey = 'id_evento';
    protected $fillable = [
        'nome',
        'data',
        'descricao',
        'localizacao',
        'id_genero_musical',
        'id_organizador'
    ];

    function generoMusical()
    {
        return $this->belongsTo(GeneroMusical::class, 'id_genero_musical');
    }

    function organizador()
    {
        return $this->belongsTo(Organizador::class, 'id_organizador');
    }

    

}
