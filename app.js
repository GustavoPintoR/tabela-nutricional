let taco = {}
let recipeIngredients = []
let recipes = JSON.parse(localStorage.getItem('recipes') || '[]')

const recipeName = document.getElementById('recipeName')
const portionSize = document.getElementById('portionSize')
const ingredientSelect = document.getElementById('ingredientSelect')
const ingredientQty = document.getElementById('ingredientQty')
const currentIngredients = document.getElementById('currentIngredients')
const nutritionLabel = document.getElementById('nutritionLabel')
const recipeList = document.getElementById('recipeList')
const newName = document.getElementById('newName')
const newEnergy = document.getElementById('newEnergy')
const newCarb = document.getElementById('newCarb')
const newProtein = document.getElementById('newProtein')
const newFat = document.getElementById('newFat')
const newFiber = document.getElementById('newFiber')
const newSodium = document.getElementById('newSodium')

const VD = {
  energia: 2000,
  carbo: 300,
  proteina: 75,
  gordura: 55,
  fibra: 25,
  sodio: 2000
}

function normalize(value) {
  if (value === 'NA' || value === 'Tr' || value === '' || value === null || value === undefined) {
    return 0
  }
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
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

  const placeholder = document.createElement('option')
  placeholder.value = ''
  placeholder.textContent = 'Selecione um ingrediente'
  placeholder.selected = true
  placeholder.disabled = true
  ingredientSelect.appendChild(placeholder)

  Object.keys(taco).forEach(k => {
    const opt = document.createElement('option')
    opt.value = k
    opt.textContent = taco[k].name
    ingredientSelect.appendChild(opt)
  })
}

function addIngredient() {
  const key = ingredientSelect.value
  const qty = Number(ingredientQty.value)

  if (!key) {
    alert('Selecione um ingrediente.')
    return
  }

  if (!qty || qty <= 0) {
    alert('Informe uma quantidade válida em gramas.')
    return
  }

  recipeIngredients.push({ key, qty })
  renderCurrentIngredients()
  ingredientQty.value = ''
}

function renderCurrentIngredients() {
  currentIngredients.innerHTML = ''
  recipeIngredients.forEach((i, index) => {
    const li = document.createElement('li')
    li.className = 'ingredient-row'

    const label = document.createElement('span')
    label.textContent = `${taco[i.key]?.name || 'Ingrediente desconhecido'} - ${i.qty}g`

    const removeButton = document.createElement('button')
    removeButton.type = 'button'
    removeButton.textContent = 'Remover'
    removeButton.onclick = () => removeIngredient(index)

    li.appendChild(label)
    li.appendChild(removeButton)
    currentIngredients.appendChild(li)
  })
}

function removeIngredient(index) {
  recipeIngredients.splice(index, 1)
  renderCurrentIngredients()
}

function calculateTotals() {
  const total = { energia:0, carbo:0, proteina:0, gordura:0, fibra:0, sodio:0 }
  let totalWeight = 0

  recipeIngredients.forEach(i => {
    const f = taco[i.key]
    if (!f) return
    const factor = i.qty / 100

    total.energia += f.energia * factor
    total.carbo += f.carbo * factor
    total.proteina += f.proteina * factor
    total.gordura += f.gordura * factor
    total.fibra += f.fibra * factor
    total.sodio += f.sodio * factor

    totalWeight += i.qty
  })

  return { total, totalWeight }
}

function saveRecipeData(recipe) {
  recipes.unshift(recipe)
  localStorage.setItem('recipes', JSON.stringify(recipes))
  renderRecipes()
}

function generateLabel(saveRecipe = true) {
  const name = recipeName.value.trim()
  const portion = Number(portionSize.value)

  if (!name) {
    alert('Informe o nome da receita.')
    return
  }

  if (!portion || portion <= 0) {
    alert('Informe o tamanho da porção em gramas.')
    return
  }

  if (!recipeIngredients.length) {
    alert('Adicione pelo menos um ingrediente à receita.')
    return
  }

  const { total, totalWeight } = calculateTotals()

  if (totalWeight <= 0) {
    alert('O peso total da receita deve ser maior que zero.')
    return
  }

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
      recipeIngredients.map(i => taco[i.key]?.name || 'Ingrediente desconhecido').join(', ')
    }</p>
    <p style="font-size:10px">*Valores diários com base em 2.000 kcal</p>
  `

  if (saveRecipe) {
    const savedRecipe = {
      name,
      portionSize: portion,
      ingredients: [...recipeIngredients]
    }
    saveRecipeData(savedRecipe)
  }
}

function row(label, value, unit, vd) {
  const percentage = vd ? `${((value / vd) * 100).toFixed(0)}%` : '—'
  return `<tr>
    <td>${label}</td>
    <td>${value.toFixed(1)} ${unit}</td>
    <td>${percentage}</td>
  </tr>`
}

function renderRecipes() {
  recipeList.innerHTML = ''

  if (!recipes.length) {
    const placeholder = document.createElement('li')
    placeholder.textContent = 'Nenhuma receita salva.'
    recipeList.appendChild(placeholder)
    return
  }

  recipes.slice(0, 5).forEach((r, index) => {
    const li = document.createElement('li')
    li.textContent = r.name
    li.style.cursor = 'pointer'

    li.onclick = () => loadRecipe(index)

    recipeList.appendChild(li)
  })
}

function addCustomFood() {
  const name = newName.value.trim()
  const energy = Number(newEnergy.value)
  const carb = Number(newCarb.value)
  const protein = Number(newProtein.value)
  const fat = Number(newFat.value)
  const fiber = Number(newFiber.value)
  const sodium = Number(newSodium.value)

  if (!name || !Number.isFinite(energy) || !Number.isFinite(carb) || !Number.isFinite(protein) || !Number.isFinite(fat) || !Number.isFinite(fiber) || !Number.isFinite(sodium)) {
    alert('Preencha todos os campos de ingrediente com valores numéricos válidos.')
    return
  }

  const key = name.toLowerCase().replace(/\s+/g,'_')
  const customFoods = JSON.parse(localStorage.getItem('customFoods') || '{}')

  customFoods[key] = {
    name,
    energia: energy,
    carbo: carb,
    proteina: protein,
    gordura: fat,
    fibra: fiber,
    sodio: sodium
  }

  localStorage.setItem('customFoods', JSON.stringify(customFoods))
  taco[key] = customFoods[key]
  populateIngredients()

  newName.value = ''
  newEnergy.value = ''
  newCarb.value = ''
  newProtein.value = ''
  newFat.value = ''
  newFiber.value = ''
  newSodium.value = ''
}

function clearRecipeState() {
  recipeIngredients = []
  recipeName.value = ''
  portionSize.value = ''
  ingredientQty.value = ''
  currentIngredients.innerHTML = ''
  nutritionLabel.innerHTML = ''
}

function restartRecipe() {
  if (!confirm('Deseja reiniciar a receita atual?')) return
  clearRecipeState()
}

function loadRecipe(index) {
  const recipe = recipes[index]

  // limpa estado atual
  clearRecipeState()

  // restaura dados
  recipeName.value = recipe.name
  portionSize.value = recipe.portionSize
  recipeIngredients = [...recipe.ingredients]

  // atualiza UI
  renderCurrentIngredients()

  // gera novamente a tabela
  generateLabel(false)
}