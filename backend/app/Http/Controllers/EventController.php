<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function listarEventos()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function criarEvento(Request $request)
    {
        $Evento = Event::create([
            'nome' => $request->nome,
            'data'=> $request->data,
            'descricao'=> $request->descricao, 
            'localizacao'=> $request->localizacao,
            'id_genero_musical'=> $request->id_genero_musical,
            'id_organizador'=> $request->id_organizador
            ]);
            
            return response()->json($event, 201);

    }




    
    /**
     * Store a newly created resource in storage.
     */
    public function editarEvento(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function excluirEvento(Event $event)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function verEvento(Event $event)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Event $event)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Event $event)
    {
        //
    }
}
