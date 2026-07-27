<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RecipeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Recipe::with('ingredients')->orderBy('created_at', 'desc')->get());
    }

    public function show(Recipe $recipe): JsonResponse
    {
        return response()->json($recipe->load('ingredients'));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'portion_size' => 'required|integer|min:1',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.id' => 'required|integer|exists:ingredients,id',
            'ingredients.*.qty' => 'required|integer|min:1',
        ]);

        $recipe = Recipe::create([
            'name' => $validated['name'],
            'portion_size' => $validated['portion_size'],
        ]);

        $syncData = [];
        foreach ($validated['ingredients'] as $item) {
            $syncData[$item['id']] = ['qty' => $item['qty']];
        }

        $recipe->ingredients()->sync($syncData);

        return response()->json($recipe->load('ingredients'), 201);
    }
}
