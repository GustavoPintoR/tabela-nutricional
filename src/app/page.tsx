"use client";

import { useEffect, useMemo, useState } from "react";

type Ingredient = {
  id: number;
  name: string;
  category: string;
  energy: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
};

type RecipeItem = Ingredient & { grams: number };

type SavedRecipe = {
  id: string;
  name: string;
  portion: number;
  items: RecipeItem[];
  createdAt: string;
};

type Nutrients = Pick<Ingredient, "energy" | "protein" | "carbs" | "fat" | "fiber" | "sodium">;

const emptyIngredient = {
  name: "",
  category: "Alimentos adicionados",
  energy: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sodium: "",
};

const nutrientLabels: Array<[keyof Nutrients, string, string]> = [
  ["energy", "Valor energético", "kcal"],
  ["carbs", "Carboidratos", "g"],
  ["protein", "Proteínas", "g"],
  ["fat", "Gorduras totais", "g"],
  ["fiber", "Fibra alimentar", "g"],
  ["sodium", "Sódio", "mg"],
];

const number = (value: string | number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const format = (value: number, digits = 1) =>
  new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);

export default function Home() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("rotulo-facil-recipes");
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem("rotulo-facil-recipes");
      return [];
    }
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [grams, setGrams] = useState(100);
  const [recipeName, setRecipeName] = useState("Minha receita");
  const [portion, setPortion] = useState(100);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState(emptyIngredient);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"ingredients" | "recipe">("ingredients");

  useEffect(() => {
    fetch("/api/ingredients")
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar a TACO.");
        return response.json();
      })
      .then(setIngredients)
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false));

  }, []);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(ingredients.map((item) => item.category))).sort()],
    [ingredients],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return ingredients
      .filter((item) => category === "Todas" || item.category === category)
      .filter((item) => !normalized || item.name.toLocaleLowerCase("pt-BR").includes(normalized))
      .slice(0, 80);
  }, [ingredients, query, category]);

  const totals = useMemo(
    () =>
      items.reduce(
        (sum, item) => {
          const factor = item.grams / 100;
          sum.weight += item.grams;
          sum.energy += item.energy * factor;
          sum.protein += item.protein * factor;
          sum.carbs += item.carbs * factor;
          sum.fat += item.fat * factor;
          sum.fiber += item.fiber * factor;
          sum.sodium += item.sodium * factor;
          return sum;
        },
        { weight: 0, energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
      ),
    [items],
  );

  const perPortion = useMemo(() => {
    const factor = totals.weight > 0 ? portion / totals.weight : 0;
    return {
      energy: totals.energy * factor,
      protein: totals.protein * factor,
      carbs: totals.carbs * factor,
      fat: totals.fat * factor,
      fiber: totals.fiber * factor,
      sodium: totals.sodium * factor,
    };
  }, [totals, portion]);

  const addSelected = () => {
    const ingredient = ingredients.find((item) => item.id === selectedId);
    if (!ingredient || grams <= 0) return;
    setItems((current) => {
      const existing = current.find((item) => item.id === ingredient.id);
      if (existing) {
        return current.map((item) =>
          item.id === ingredient.id ? { ...item, grams: item.grams + grams } : item,
        );
      }
      return [...current, { ...ingredient, grams }];
    });
    setSelectedId(null);
    setMobilePanel("recipe");
  };

  const saveRecipe = () => {
    if (!items.length || !recipeName.trim()) return;
    const recipe: SavedRecipe = {
      id: crypto.randomUUID(),
      name: recipeName.trim(),
      portion,
      items,
      createdAt: new Date().toISOString(),
    };
    const next = [recipe, ...savedRecipes].slice(0, 20);
    setSavedRecipes(next);
    localStorage.setItem("rotulo-facil-recipes", JSON.stringify(next));
    setNotice("Receita salva neste dispositivo.");
  };

  const loadRecipe = (recipe: SavedRecipe) => {
    setRecipeName(recipe.name);
    setPortion(recipe.portion);
    setItems(recipe.items);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRecipe = (id: string) => {
    const next = savedRecipes.filter((recipe) => recipe.id !== id);
    setSavedRecipes(next);
    localStorage.setItem("rotulo-facil-recipes", JSON.stringify(next));
  };

  const saveCustomIngredient = async () => {
    if (!custom.name.trim()) return;
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custom),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível adicionar o ingrediente.");
      setIngredients((current) => [...current, data]);
      setCustom(emptyIngredient);
      setShowCustom(false);
      setSelectedId(data.id);
      setNotice(`${data.name} foi adicionado à TACO.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Ocorreu um erro inesperado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="Rótulo Fácil, início">
          <span className="brand-mark">RF</span>
          <span>Rótulo Fácil</span>
        </a>
        <div className="header-copy">
          <strong>Calculadora nutricional</strong>
          <span>Dados da Tabela TACO</span>
        </div>
        <button className="ghost-button print-hide" onClick={() => window.print()}>
          Imprimir rótulo
        </button>
      </header>

      {notice && (
        <button className="notice print-hide" onClick={() => setNotice("")} aria-label="Fechar aviso">
          <span>{notice}</span><b>×</b>
        </button>
      )}

      <section className="hero print-hide">
        <div>
          <p className="eyebrow">FORMULE • CALCULE • ROTULE</p>
          <h1>Da receita ao rótulo, sem complicação.</h1>
          <p>Monte sua fórmula com ingredientes da TACO e veja os valores nutricionais por porção em tempo real.</p>
        </div>
        <div className="hero-stat">
          <span>{ingredients.length || "—"}</span>
          <p>alimentos disponíveis</p>
        </div>
      </section>

      <nav className="mobile-tabs print-hide" aria-label="Seções do editor">
        <button className={mobilePanel === "ingredients" ? "active" : ""} onClick={() => setMobilePanel("ingredients")}>1. Ingredientes</button>
        <button className={mobilePanel === "recipe" ? "active" : ""} onClick={() => setMobilePanel("recipe")}>2. Receita</button>
      </nav>

      <section className="workspace">
        <aside className={`ingredient-panel print-hide ${mobilePanel !== "ingredients" ? "mobile-hidden" : ""}`}>
          <div className="section-heading">
            <div><span className="step">1</span><h2>Escolha os ingredientes</h2></div>
            <button className="text-button" onClick={() => setShowCustom(true)}>+ Novo ingrediente</button>
          </div>
          <label className="search">
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque arroz, leite, farinha..." />
          </label>
          <select className="category-select" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoria">
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <div className="ingredient-list">
            {loading ? <p className="empty">Carregando a TACO…</p> : filtered.map((ingredient) => (
              <button
                key={ingredient.id}
                className={`ingredient-row ${selectedId === ingredient.id ? "selected" : ""}`}
                onClick={() => setSelectedId(ingredient.id)}
              >
                <span><strong>{ingredient.name}</strong><small>{ingredient.category}</small></span>
                <b>{format(ingredient.energy, 0)} <small>kcal</small></b>
              </button>
            ))}
            {!loading && !filtered.length && <p className="empty">Nenhum alimento encontrado.</p>}
          </div>
          <div className="add-bar">
            <label>Quantidade <span><input type="number" min="0.1" step="0.1" value={grams} onChange={(event) => setGrams(number(event.target.value))} /> g</span></label>
            <button className="primary-button" disabled={!selectedId || grams <= 0} onClick={addSelected}>Adicionar à receita</button>
          </div>
        </aside>

        <section className={`recipe-panel print-area ${mobilePanel !== "recipe" ? "mobile-hidden" : ""}`}>
          <div className="recipe-editor print-hide">
            <div className="section-heading">
              <div><span className="step">2</span><h2>Monte sua receita</h2></div>
              {items.length > 0 && <button className="text-button danger" onClick={() => setItems([])}>Limpar</button>}
            </div>
            <div className="recipe-fields">
              <label>Nome da receita<input value={recipeName} onChange={(event) => setRecipeName(event.target.value)} /></label>
              <label>Porção<input type="number" min="1" value={portion} onChange={(event) => setPortion(Math.max(1, number(event.target.value)))} /><span>g</span></label>
            </div>
            <div className="recipe-items">
              {!items.length ? (
                <div className="empty-recipe"><b>Sua receita começa aqui</b><p>Selecione um alimento ao lado e informe a quantidade usada.</p></div>
              ) : items.map((item) => (
                <div className="recipe-item" key={item.id}>
                  <span><strong>{item.name}</strong><small>{format(item.energy * item.grams / 100, 0)} kcal</small></span>
                  <label><input type="number" min="0.1" value={item.grams} onChange={(event) => setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, grams: Math.max(0.1, number(event.target.value)) } : currentItem))} /> g</label>
                  <button onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))} aria-label={`Remover ${item.name}`}>×</button>
                </div>
              ))}
            </div>
            <div className="recipe-total"><span>Peso total da receita</span><strong>{format(totals.weight)} g</strong></div>
            <button className="save-button" disabled={!items.length || !recipeName.trim()} onClick={saveRecipe}>Salvar receita</button>
          </div>

          <article className="nutrition-card">
            <div className="label-kicker">INFORMAÇÃO NUTRICIONAL</div>
            <h2>{recipeName || "Sua receita"}</h2>
            <p>Porções por embalagem: {totals.weight && portion ? Math.max(1, Math.floor(totals.weight / portion)) : "—"}</p>
            <p>Porção de {format(portion, 0)} g</p>
            <div className="label-rule thick" />
            <div className="daily-heading">Quantidade por porção <span>%VD*</span></div>
            {nutrientLabels.map(([key, label, unit], index) => (
              <div className={`nutrient-row ${index === 0 ? "energy-row" : ""}`} key={key}>
                <span><b>{label}</b> {format(perPortion[key], key === "sodium" ? 0 : 1)} {unit}</span>
                <b>{key === "energy" ? `${Math.round(perPortion.energy / 20)}%` : "—"}</b>
              </div>
            ))}
            <div className="label-rule thick" />
            <small>*Percentual de valores diários fornecidos pela porção. Valores calculados a partir da composição centesimal da TACO.</small>
          </article>
        </section>
      </section>

      {savedRecipes.length > 0 && (
        <section className="saved-section print-hide">
          <div><p className="eyebrow">SEU CADERNO</p><h2>Receitas salvas</h2></div>
          <div className="saved-grid">
            {savedRecipes.map((recipe) => (
              <article key={recipe.id}>
                <span>{recipe.items.length} ingredientes</span>
                <h3>{recipe.name}</h3>
                <p>Porção de {recipe.portion} g • {new Date(recipe.createdAt).toLocaleDateString("pt-BR")}</p>
                <div><button onClick={() => loadRecipe(recipe)}>Abrir receita</button><button onClick={() => deleteRecipe(recipe.id)} aria-label={`Excluir ${recipe.name}`}>Excluir</button></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {showCustom && (
        <div className="modal-backdrop print-hide" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowCustom(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="custom-title">
            <button className="modal-close" onClick={() => setShowCustom(false)} aria-label="Fechar">×</button>
            <p className="eyebrow">ALIMENTO PERSONALIZADO</p>
            <h2 id="custom-title">Adicionar à tabela TACO</h2>
            <p>Informe os nutrientes encontrados em 100 g do alimento.</p>
            <div className="custom-grid">
              <label className="wide">Nome do alimento<input autoFocus value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} /></label>
              <label className="wide">Categoria<input value={custom.category} onChange={(event) => setCustom({ ...custom, category: event.target.value })} /></label>
              {nutrientLabels.map(([key, label, unit]) => (
                <label key={key}>{label}<span><input type="number" min="0" step="0.01" value={custom[key]} onChange={(event) => setCustom({ ...custom, [key]: event.target.value })} /> {unit}</span></label>
              ))}
            </div>
            <div className="modal-actions"><button className="ghost-button" onClick={() => setShowCustom(false)}>Cancelar</button><button className="primary-button" disabled={!custom.name.trim() || saving} onClick={saveCustomIngredient}>{saving ? "Salvando…" : "Adicionar ingrediente"}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
