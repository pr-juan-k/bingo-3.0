class BingoApp {
  constructor() {
    this.cartones = JSON.parse(localStorage.getItem("bingoCartones")) || []
    this.currentRange = 0 // 0: 0-19, 1: 20-39, 2: 40-59, 3: 60-79, 4: 80-99
    this.selectedNumbers = new Set()
    this.activeCarton = null
    this.cartonPrice = 2000 // Precio cambiado a $2000

    this.cartones.forEach((carton) => {
      carton.numbers.forEach((num) => this.selectedNumbers.add(num))
    })

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.renderNumberTable()
    this.updateDisplay()
    this.renderCartones()
    this.updateJugarButton() // Mostrar botón de jugar si hay cartones completos
  }

  setupEventListeners() {
    // Comprar cartón
    document.getElementById("buyCarton").addEventListener("click", () => {
      this.buyCarton()
    })

    // Navegación de rangos
    document.getElementById("prevRange").addEventListener("click", () => {
      this.changeRange(-1)
    })

    document.getElementById("nextRange").addEventListener("click", () => {
      this.changeRange(1)
    })
  }

  buyCarton() {
    const newCarton = {
      id: Date.now(), // Usar timestamp para ID único
      numbers: [],
      isComplete: false,
    }

    this.cartones.push(newCarton)
    this.activeCarton = newCarton.id
    this.saveCartones() // Guardar en localStorage
    this.updateDisplay()
    this.renderCartones()
    this.updateJugarButton() // Actualizar botón de jugar

    // Scroll hacia los cartones
    document.querySelector(".cartones-section").scrollIntoView({
      behavior: "smooth",
    })
  }

  saveCartones() {
    localStorage.setItem("bingoCartones", JSON.stringify(this.cartones))
  }

  changeRange(direction) {
    const newRange = this.currentRange + direction

    if (newRange >= 0 && newRange <= 4) {
      this.currentRange = newRange
      this.renderNumberTable()
      this.updateNavigationButtons()
    }
  }

  renderNumberTable() {
    const table = document.getElementById("numberTable")
    const startNum = this.currentRange * 20

    table.innerHTML = ""

    // Primera fila: números del 0-9 (o equivalente en el rango)
    for (let i = 0; i < 10; i++) {
      const number = startNum + i
      const cell = this.createNumberCell(number)
      table.appendChild(cell)
    }

    // Segunda fila: números del 10-19 (o equivalente en el rango)
    for (let i = 10; i < 20; i++) {
      const number = startNum + i
      const cell = this.createNumberCell(number)
      table.appendChild(cell)
    }

    this.updateRangeDisplay()
    this.updateNavigationButtons()
  }

  createNumberCell(number) {
    const cell = document.createElement("div")
    cell.className = "number-cell"
    cell.textContent = number
    cell.dataset.number = number

    // Verificar si el número ya está seleccionado
    if (this.selectedNumbers.has(number)) {
      cell.classList.add("selected")
    }

    // Verificar si se puede seleccionar
    if (!this.canSelectNumber()) {
      cell.classList.add("disabled")
    }

    cell.addEventListener("click", () => {
      this.selectNumber(number, cell)
    })

    return cell
  }

  selectNumber(number, cell) {
    if (!this.canSelectNumber() || this.selectedNumbers.has(number)) {
      return
    }

    if (!this.activeCarton) {
      alert("¡Primero debes comprar un cartón!")
      return
    }

    const carton = this.cartones.find((c) => c.id === this.activeCarton)

    if (carton.numbers.length >= 3) {
      alert("Este cartón ya tiene 3 números. Compra otro cartón o selecciona uno diferente.")
      return
    }

    // Agregar número al cartón activo
    carton.numbers.push(number)
    this.selectedNumbers.add(number)

    // Verificar si el cartón está completo
    if (carton.numbers.length === 3) {
      carton.isComplete = true
      this.findNextIncompleteCarton()
    }

    this.saveCartones() // Guardar cambios

    // Actualizar visualización
    cell.classList.add("selected")
    this.renderCartones()
    this.renderNumberTable() // Re-renderizar para actualizar estados
    this.updateJugarButton() // Actualizar botón de jugar
  }

  canSelectNumber() {
    return this.activeCarton && this.cartones.find((c) => c.id === this.activeCarton)?.numbers.length < 3
  }

  findNextIncompleteCarton() {
    const incompleteCarton = this.cartones.find((c) => !c.isComplete)
    this.activeCarton = incompleteCarton ? incompleteCarton.id : null
  }

  updateRangeDisplay() {
    const startNum = this.currentRange * 20
    const endNum = startNum + 19
    document.getElementById("rangeDisplay").textContent = `${startNum} - ${endNum}`
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById("prevRange")
    const nextBtn = document.getElementById("nextRange")

    prevBtn.disabled = this.currentRange === 0
    nextBtn.disabled = this.currentRange === 4
  }

  updateDisplay() {
    document.getElementById("cartonCount").textContent = this.cartones.length
    document.getElementById("totalCost").textContent = (this.cartones.length * this.cartonPrice).toLocaleString()
  }

  updateJugarButton() {
    const jugarSection = document.getElementById("jugarSection")
    const cartonesCompletos = this.cartones.filter((c) => c.isComplete).length

    if (cartonesCompletos > 0) {
      jugarSection.style.display = "block"
    } else {
      jugarSection.style.display = "none"
    }
  }

  renderCartones() {
    const container = document.getElementById("cartonesContainer")

    if (this.cartones.length === 0) {
      container.innerHTML = `
                <div class="no-cartones">
                    <p>🎫 No tienes cartones aún. ¡Compra tu primer cartón!</p>
                </div>
            `
      return
    }

    container.innerHTML = ""

    this.cartones.forEach((carton, index) => {
      const cartonElement = this.createCartonElement(carton, index + 1)
      container.appendChild(cartonElement)
    })
  }

  createCartonElement(carton, displayIndex) {
    const div = document.createElement("div")
    div.className = `carton ${carton.id === this.activeCarton ? "active" : ""}`

    const statusClass = carton.isComplete ? "status-complete" : "status-incomplete"
    const statusText = carton.isComplete ? "Completo" : `${carton.numbers.length}/3`

    div.innerHTML = `
            <div class="carton-header">
                <span class="carton-title">Cartón #${displayIndex}</span>
                <span class="carton-status ${statusClass}">${statusText}</span>
                <div class="carton-actions">
                    ${!carton.isComplete ? `<button class="btn-edit" onclick="app.editCarton(${carton.id})">✏️</button>` : ""}
                    <button class="btn-delete" onclick="app.deleteCarton(${carton.id})">🗑️</button>
                </div>
            </div>
            <div class="carton-numbers">
                ${this.renderCartonNumbers(carton)}
            </div>
        `

    // Hacer clickeable para activar solo si no está completo
    if (!carton.isComplete) {
      div.addEventListener("click", (e) => {
        // No activar si se hizo click en los botones de acción
        if (!e.target.closest(".carton-actions")) {
          this.activeCarton = carton.id
          this.renderCartones()
          this.renderNumberTable()
        }
      })
      div.style.cursor = "pointer"
    }

    return div
  }

  renderCartonNumbers(carton) {
    let html = ""

    for (let i = 0; i < 3; i++) {
      const number = carton.numbers[i]
      const filled = number !== undefined

      html += `
                <div class="carton-number ${filled ? "filled" : ""}">
                    ${filled ? number : "?"}
                </div>
            `
    }

    return html
  }

  editCarton(cartonId) {
    const carton = this.cartones.find((c) => c.id === cartonId)
    if (!carton || carton.isComplete) return

    // Remover números del cartón de la selección global
    carton.numbers.forEach((num) => this.selectedNumbers.delete(num))

    // Limpiar números del cartón
    carton.numbers = []
    carton.isComplete = false

    // Activar este cartón para edición
    this.activeCarton = cartonId

    this.saveCartones()
    this.renderCartones()
    this.renderNumberTable()
    this.updateJugarButton()

    alert("Cartón listo para editar. Selecciona nuevos números.")
  }

  deleteCarton(cartonId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este cartón?")) return

    const carton = this.cartones.find((c) => c.id === cartonId)
    if (carton) {
      // Remover números del cartón de la selección global
      carton.numbers.forEach((num) => this.selectedNumbers.delete(num))
    }

    // Eliminar cartón del array
    this.cartones = this.cartones.filter((c) => c.id !== cartonId)

    // Si era el cartón activo, buscar otro incompleto
    if (this.activeCarton === cartonId) {
      this.findNextIncompleteCarton()
    }

    this.saveCartones()
    this.updateDisplay()
    this.renderCartones()
    this.renderNumberTable()
    this.updateJugarButton()
  }
}

let app
document.addEventListener("DOMContentLoaded", () => {
  app = new BingoApp()
})
