import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TacoRecord = {
  id: number;
  description: string;
  category: string;
  energy_kcal?: number | string;
  protein_g?: number | string;
  carbohydrate_g?: number | string;
  lipid_g?: number | string;
  fiber_g?: number | string;
  sodium_mg?: number | string;
  [key: string]: number | string | undefined;
};

const tacoPath = path.join(process.cwd(), "data", "TACO.json");

const numeric = (value: unknown) => {
  const parsed = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toIngredient = (record: TacoRecord) => ({
  id: record.id,
  name: record.description,
  category: record.category,
  energy: numeric(record.energy_kcal),
  protein: numeric(record.protein_g),
  carbs: numeric(record.carbohydrate_g),
  fat: numeric(record.lipid_g),
  fiber: numeric(record.fiber_g),
  sodium: numeric(record.sodium_mg),
});

async function readTaco() {
  const contents = await fs.readFile(tacoPath, "utf8");
  return JSON.parse(contents) as TacoRecord[];
}

export async function GET() {
  try {
    const records = await readTaco();
    return NextResponse.json(records.map(toIngredient));
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o arquivo TACO.json." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "Alimentos adicionados").trim();

    if (!name) {
      return NextResponse.json({ error: "Informe o nome do alimento." }, { status: 422 });
    }

    const records = await readTaco();
    const duplicate = records.some(
      (record) => record.description.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
    );
    if (duplicate) {
      return NextResponse.json({ error: "Este alimento já existe na tabela." }, { status: 409 });
    }

    const nextId = records.reduce((largest, record) => Math.max(largest, numeric(record.id)), 0) + 1;
    const record: TacoRecord = {
      id: nextId,
      description: name,
      category: category || "Alimentos adicionados",
      energy_kcal: Math.max(0, numeric(body.energy)),
      protein_g: Math.max(0, numeric(body.protein)),
      carbohydrate_g: Math.max(0, numeric(body.carbs)),
      lipid_g: Math.max(0, numeric(body.fat)),
      fiber_g: Math.max(0, numeric(body.fiber)),
      sodium_mg: Math.max(0, numeric(body.sodium)),
    };

    records.push(record);
    const temporaryPath = `${tacoPath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    await fs.rename(temporaryPath, tacoPath);

    return NextResponse.json(toIngredient(record), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar o arquivo TACO.json. Verifique a permissão de escrita." },
      { status: 500 },
    );
  }
}
