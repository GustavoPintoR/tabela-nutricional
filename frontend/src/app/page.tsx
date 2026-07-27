"use client";

import { useEffect, useMemo, useState } from "react";

type Ingredient = {
  id: number;
  name: string;
  energia: number;
  carbo: number;
  proteina: number;
  gordura: number;
  fibra: number;
  sodio: number;
};

type RecipeIngredient = {
  id: number;
  name: string;
  qty: number;
};

type Recipe = {
  id: number;
  name: string;
  portion_size: number;
  ingredients: RecipeIngredient[];
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const initialCustomIngredient = {
  name: "",
  energia: "",
  carbo: "",
  proteina: "",
  gordura: "",
  fibra: "",
  sodio: "",
};

const normalizeValue = (value: string) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export default function Home() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<number | "">("");
  const [ingredientQty, setIngredientQty] = useState(0);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [recipeName, setRecipeName] = useState("");
  const [portionSize, setPortionSize] = useState(50);
  const [labelVisible, setLabelVisible] = useState(false);
  const [customIngredient, setCustomIngredient] = useState(initialCustomIngredient);

  useEffect(() => {
    fetch(`${apiBase}/ingredients`)
      .then((res) => res.json())
      .then(setIngredients)
      .catch(console.error);

    fetch(`${apiBase}/recipes`)
      .then((res) => res.json())
      .then(setRecipes)
      .catch(console.error);
  }, []);

  const totals = useMemo(() => {
    const totals = { energia: 0, carbo: 0, proteina: 0, gordura: 0, fibra: 0, sodio: 0 };
    let totalWeight = 0;

    recipeIngredients.forEach((item) => {
      const ingredient = ingredients.find((i) => i.id === item.id);
      if (!ingredient) return;

      const factor = item.qty / 100;
      totals.energia += ingredient.energia * factor;
      totals.carbo += ingredient.carbo * factor;
      totals.proteina += ingredient.proteina * factor;
      totals.gordura += ingredient.gordura * factor;
      totals.fibra += ingredient.fibra * factor;
      totals.sodio += ingredient.sodio * factor;
      totalWeight += item.qty;
    });

    return { totals, totalWeight };
  }, [recipeIngredients, ingredients]);

  const addIngredient = () => {
    if (!selectedIngredient) {
      alert("Selecione um ingrediente.");
      return;
    }

    if (!ingredientQty || ingredientQty <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }

    const ingredient = ingredients.find((item) => item.id === Number(selectedIngredient));
    if (!ingredient) return;

    setRecipeIngredients((current) => [
      ...current,
      { id: ingredient.id, name: ingredient.name, qty: ingredientQty },
    ]);
    setIngredientQty(0);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients((current) => current.filter((_, idx) => idx !== index));
  };

  const saveRecipe = () => {
    if (!recipeName.trim()) {
      alert("Informe o nome da receita.");
      return;
    }

    if (!portionSize || portionSize <= 0) {
      alert("Informe o tamanho da porção.");
      return;
    }

    if (recipeIngredients.length === 0) {
      alert("Adicione pelo menos um ingrediente.");
      return;
    }

    if (totals.totalWeight <= 0) {
      alert("O peso total da receita deve ser maior que zero.");
      return;
    }

    fetch(`${apiBase}/recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: recipeName,
        portion_size: portionSize,
        ingredients: recipeIngredients.map((item) => ({ id: item.id, qty: item.qty })),
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => Promise.reject(body));
        }
        return res.json();
      })
      .then((recipe: Recipe) => {
        setRecipes((current) => [recipe, ...current]);
        setLabelVisible(true);
      })
      .catch((error) => {
        console.error(error);
        alert("Erro ao salvar a receita. Verifique os dados e tente novamente.");
      });
  };

  const addCustomIngredient = () => {
    const payload = {
      name: customIngredient.name.trim(),
      energia: normalizeValue(customIngredient.energia),
      carbo: normalizeValue(customIngredient.carbo),
      proteina: normalizeValue(customIngredient.proteina),
      gordura: normalizeValue(customIngredient.gordura),
      fibra: normalizeValue(customIngredient.fibra),
      sodio: normalizeValue(customIngredient.sodio),
    };

    if (!payload.name) {
      alert("Informe o nome do ingrediente.");
      return;
    }

    fetch(`${apiBase}/ingredients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => Promise.reject(body));
        }
        return res.json();
      })
      .then((ingredient: Ingredient) => {
        setIngredients((current) => [...current, ingredient]);
        setCustomIngredient(initialCustomIngredient);
      })
      .catch((error) => {
        console.error(error);
        alert("Erro ao adicionar ingrediente customizado.");
      });
  };

  const formatPercentage = (value: number, daily: number) => {
    return daily > 0 ? `${((value / daily) * 100).toFixed(0)}%` : "—";
  };

  const lineItem = (label: string, value: number, unit: string, daily: number) => (
    <tr>
      <td className="border px-2 py-1">{label}</td>
      <td className="border px-2 py-1">{value.toFixed(1)} {unit}</td>
      <td className="border px-2 py-1">{formatPercentage(value, daily)}</td>
    </tr>
  );

  const printTotals = useMemo(() => {
    const multiplier = portionSize > 0 && totals.totalWeight > 0 ? portionSize / totals.totalWeight : 0;
    return {
      energia: totals.totals.energia * multiplier,
      carbo: totals.totals.carbo * multiplier,
      proteina: totals.totals.proteina * multiplier,
      gordura: totals.totals.gordura * multiplier,
      fibra: totals.totals.fibra * multiplier,
      sodio: totals.totals.sodio * multiplier,
    };
  }, [portionSize, totals]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold">Gerador de Tabela Nutricional</h1>
          <p className="mt-2 text-sm text-slate-600">Next.js frontend integrado ao backend Laravel + MySQL.</p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
          <section className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Nome da receita</span>
                <input
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Porção (g)</span>
                <input
                  type="number"
                  value={portionSize}
                  onChange={(e) => setPortionSize(Number(e.target.value))}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
              <label className="block">
                <span className="text-sm font-medium">Ingrediente</span>
                <select
                  value={selectedIngredient}
                  onChange={(e) => setSelectedIngredient(e.target.value ? Number(e.target.value) : "")}
                  className="mt-1 w-full rounded border px-3 py-2"
                >
                  <option value="">Selecione um ingrediente</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Quantidade (g)</span>
                <input
                  type="number"
                  value={ingredientQty}
                  onChange={(e) => setIngredientQty(Number(e.target.value))}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="mt-6 rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                Adicionar
              </button>
            </div>

            <div className="rounded border bg-slate-50 p-4">
              <h2 className="font-semibold">Ingredientes atuais</h2>
              {recipeIngredients.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">Nenhum ingrediente adicionado.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {recipeIngredients.map((item, index) => (
                    <li key={`${item.id}-${index}`} className="flex items-center justify-between rounded border p-3">
                      <span>{item.name} — {item.qty} g</span>
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-500"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={saveRecipe}
              className="rounded bg-slate-900 px-5 py-3 text-white hover:bg-slate-700"
            >
              Gerar e salvar receita
            </button>
          </section>

          <section className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Adicionar ingrediente customizado</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Nome</span>
                <input
                  value={customIngredient.name}
                  onChange={(e) => setCustomIngredient({ ...customIngredient, name: e.target.value })}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Energia (kcal)</span>
                <input
                  value={customIngredient.energia}
                  onChange={(e) => setCustomIngredient({ ...customIngredient, energia: e.target.value })}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Carbo</span>
                <input
                  value={customIngredient.carbo}
                  onChange={(e) => setCustomIngredient({ ...customIngredient, carbo: e.target.value })}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Proteína</span>
                <input
                  value={customIngredient.proteina}
                  onChange={(e) => setCustomIngredient({ ...customIngredient, proteina: e.target.value })}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Gordura</span>
                <input
                  value={customIngredient.gordura}
                  onChange={(e) => setCustomIngredient({ ...customIngredient, gordura: e.target.value })}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Fibra</span>
                <input
                  value={customIngredient.fibra}
                  onChange={(e) => setCustomIngredient({ ...customIngredient, fibra: e.target.value })}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Sódio</span>
                <input
                  value={customIngredient.sodio}
                  onChange={(e) => setCustomIngredient({ ...customIngredient, sodio: e.target.value })}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={addCustomIngredient}
              className="rounded bg-slate-900 px-5 py-3 text-white hover:bg-slate-700"
            >
              Adicionar ingrediente
            </button>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Rótulo nutricional</h2>
            <div className="mt-4 rounded border bg-slate-50 p-4">
              <div className="text-sm font-semibold">Porção de {portionSize} g</div>
              {labelVisible ? (
                <table className="mt-4 w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1 text-left">Nutriente</th>
                      <th className="border px-2 py-1 text-left">Qtd.</th>
                      <th className="border px-2 py-1 text-left">%VD*</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItem('Valor energético', printTotals.energia, 'kcal', 2000)}
                    {lineItem('Carboidratos', printTotals.carbo, 'g', 300)}
                    {lineItem('Proteínas', printTotals.proteina, 'g', 75)}
                    {lineItem('Gorduras totais', printTotals.gordura, 'g', 55)}
                    {lineItem('Fibra alimentar', printTotals.fibra, 'g', 25)}
                    {lineItem('Sódio', printTotals.sodio, 'mg', 2000)}
                  </tbody>
                </table>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Clique em "Gerar e salvar receita" para calcular o rótulo.</p>
              )}
              <p className="mt-3 text-xs text-slate-500">*Valores diários com base em 2.000 kcal</p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Receitas salvas</h2>
            <div className="mt-4 space-y-4">
              {recipes.length === 0 ? (
                <p className="text-sm text-slate-600">Nenhuma receita salva ainda.</p>
              ) : (
                recipes.map((recipe) => (
                  <div key={recipe.id} className="rounded border p-4">
                    <div className="font-semibold">{recipe.name}</div>
                    <div className="text-sm text-slate-600">Porção: {recipe.portion_size} g</div>
                    <div className="mt-2 text-sm text-slate-700">
                      Ingredientes: {recipe.ingredients.map((item) => item.name).join(", ")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
