let taco = {}
let recipeIngredients = []
let recipes = JSON.parse(localStorage.getItem('recipes') || '[]')

const VD = {
  energia: 2000,
  carbo: 300,
  proteina: 75,
  gordura: 55,
  fibra: 25,
  sodio: 2000
}

function normalize(value) {
  if (value === 'NA' || value === 'Tr' || value === '' || value === null) {
    return 0
  }
  return Number(value)
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
}

fetch('data/taco.json')
  .then(res => res.json())
  .then(data => {
    taco = {}

    data.forEach(item => {
      const key = slugify(item.description)

      taco[key] = {
        name: item.description,

        // BASE PARA O RÓTULO (100g)
        energia: normalize(item.energy_kcal),
        carbo: normalize(item.carbohydrate_g),
        proteina: normalize(item.protein_g),
        gordura: normalize(item.lipid_g),
        fibra: normalize(item.fiber_g),
        sodio: normalize(item.sodium_mg),

        // opcionais (para futuro)
        saturada: normalize(item.saturated_g),
        colesterol: normalize(item.cholesterol_mg)
      }
    })

    // junta ingredientes customizados
    const custom = JSON.parse(localStorage.getItem('customFoods') || '{}')
    taco = { ...taco, ...custom }

    populateIngredients()
    renderRecipes()
  })

function populateIngredients() {
  ingredientSelect.innerHTML = ''
  Object.keys(taco).forEach(k => {
    const opt = document.createElement('option')
    opt.value = k
    opt.textContent = taco[k].name
    ingredientSelect.appendChild(opt)
  })
}

function addIngredient() {
  recipeIngredients.push({
    key: ingredientSelect.value,
    qty: Number(ingredientQty.value)
  })
  renderCurrentIngredients()
}

function renderCurrentIngredients() {
  currentIngredients.innerHTML = ''
  recipeIngredients.forEach(i => {
    const li = document.createElement('li')
    li.textContent = `${taco[i.key].name} - ${i.qty}g`
    currentIngredients.appendChild(li)
  })
}

function generateLabel() {
  const portion = Number(portionSize.value)

  let total = { energia:0, carbo:0, proteina:0, gordura:0, fibra:0, sodio:0 }
  let totalWeight = 0

  recipeIngredients.forEach(i => {
    const f = taco[i.key]
    const factor = i.qty / 100

    total.energia += f.energia * factor
    total.carbo += f.carbo * factor
    total.proteina += f.proteina * factor
    total.gordura += f.gordura * factor
    total.fibra += f.fibra * factor
    total.sodio += f.sodio * factor

    totalWeight += i.qty
  })

  const pf = portion / totalWeight

  recipeIngredients.sort((a,b) => b.qty - a.qty)

  nutritionLabel.innerHTML = `
    <strong>Porção de ${portion} g</strong>
    <table>
      <tr><th>Nutriente</th><th>Qtd.</th><th>%VD*</th></tr>
      ${row('Valor energético', total.energia*pf, 'kcal', VD.energia)}
      ${row('Carboidratos', total.carbo*pf, 'g', VD.carbo)}
      ${row('Proteínas', total.proteina*pf, 'g', VD.proteina)}
      ${row('Gorduras totais', total.gordura*pf, 'g', VD.gordura)}
      ${row('Fibra alimentar', total.fibra*pf, 'g', VD.fibra)}
      ${row('Sódio', total.sodio*pf, 'mg', VD.sodio)}
    </table>
    <p><strong>Ingredientes:</strong> ${
      recipeIngredients.map(i => taco[i.key].name).join(', ')
    }</p>
    <p style="font-size:10px">*Valores diários com base em 2.000 kcal</p>
  `

  const savedRecipe = {
    name: recipeName.value,
    portionSize: portion,
    ingredients: [...recipeIngredients]
    }

    recipes.unshift(savedRecipe)
    localStorage.setItem('recipes', JSON.stringify(recipes))
    renderRecipes()
}

function row(label, value, unit, vd) {
  return `<tr>
    <td>${label}</td>
    <td>${value.toFixed(1)} ${unit}</td>
    <td>${((value/vd)*100).toFixed(0)}%</td>
  </tr>`
}

function renderRecipes() {
  recipeList.innerHTML = ''

  recipes.slice(0, 5).forEach((r, index) => {
    const li = document.createElement('li')
    li.textContent = r.name
    li.style.cursor = 'pointer'

    li.onclick = () => loadRecipe(index)

    recipeList.appendChild(li)
  })
}

function addCustomFood() {
  const key = newName.value.toLowerCase().replace(/\s/g,'_')

  const customFoods = JSON.parse(localStorage.getItem('customFoods') || '{}')

  customFoods[key] = {
    name: newName.value,
    energia: +newEnergy.value,
    carbo: +newCarb.value,
    proteina: +newProtein.value,
    gordura: +newFat.value,
    fibra: +newFiber.value,
    sodio: +newSodium.value
  }

  localStorage.setItem('customFoods', JSON.stringify(customFoods))
  taco[key] = customFoods[key]
  populateIngredients()
}

function restartRecipe() {
  if (!confirm('Deseja reiniciar a receita atual?')) return

  recipeIngredients = []

  recipeName.value = ''
  portionSize.value = ''
  ingredientQty.value = ''

  currentIngredients.innerHTML = ''
  nutritionLabel.innerHTML = ''
}

function loadRecipe(index) {
  const recipe = recipes[index]

  // limpa estado atual
  restartRecipe()

  // restaura dados
  recipeName.value = recipe.name
  portionSize.value = recipe.portionSize
  recipeIngredients = [...recipe.ingredients]

  // atualiza UI
  renderCurrentIngredients()

  // gera novamente a tabela
  generateLabel()
}