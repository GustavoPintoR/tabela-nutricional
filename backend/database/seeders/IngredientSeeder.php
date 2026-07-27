<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        $ingredients = [
            ['name' => 'Feijão carioca', 'energia' => 76.0, 'carbo' => 13.8, 'proteina' => 4.3, 'gordura' => 0.5, 'fibra' => 6.0, 'sodio' => 5.0],
            ['name' => 'Arroz branco', 'energia' => 130.0, 'carbo' => 28.2, 'proteina' => 2.4, 'gordura' => 0.2, 'fibra' => 0.4, 'sodio' => 1.0],
            ['name' => 'Carne bovina moída', 'energia' => 250.0, 'carbo' => 0.0, 'proteina' => 26.0, 'gordura' => 17.0, 'fibra' => 0.0, 'sodio' => 65.0],
            ['name' => 'Frango grelhado', 'energia' => 165.0, 'carbo' => 0.0, 'proteina' => 31.0, 'gordura' => 3.6, 'fibra' => 0.0, 'sodio' => 70.0],
            ['name' => 'Banana', 'energia' => 89.0, 'carbo' => 22.8, 'proteina' => 1.1, 'gordura' => 0.3, 'fibra' => 2.6, 'sodio' => 1.0],
        ];

        foreach ($ingredients as $data) {
            Ingredient::updateOrCreate(['name' => $data['name']], $data);
        }
    }
}
