<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class IngredientController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Ingredient::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:ingredients,name',
            'energia' => 'required|numeric|min:0',
            'carbo' => 'required|numeric|min:0',
            'proteina' => 'required|numeric|min:0',
            'gordura' => 'required|numeric|min:0',
            'fibra' => 'required|numeric|min:0',
            'sodio' => 'required|numeric|min:0',
        ]);

        $ingredient = Ingredient::create($validated);

        return response()->json($ingredient, 201);
    }
}
