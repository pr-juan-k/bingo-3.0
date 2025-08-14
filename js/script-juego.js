class BingoJuego {
  constructor() {
    this.cartones = JSON.parse(localStorage.getItem("bingoCartones")) || []
    this.numerosSorteados = []
    this.juegoEnCurso = false
    this.cartonesGanadores = []
    this.totalGastado = this.cartones.length * 2000
    this.totalGanado = 0
    this.faseJuego = 1 // 1 = primeros 25 números, 2 = siguientes 25 números, 3 = finalizado

    this.init()
  }

  init() {
    this.renderNumerosDisponibles()
    this.renderCartones()
    this.actualizarStats()
    this.setupEventListeners()
  }

  setupEventListeners() {
    document.getElementById("btnJugar").addEventListener("click", () => this.jugar())
    document.getElementById("btnReiniciar").addEventListener("click", () => this.reiniciarPartida())
    document.getElementById("btnLimpiar").addEventListener("click", () => this.limpiarTodo())
    document.getElementById("cerrarModal").addEventListener("click", () => this.cerrarModal())
  }

  renderNumerosDisponibles() {
    const grid = document.getElementById("numerosGrid")
    grid.innerHTML = ""

    for (let i = 0; i <= 99; i++) {
      const elemento = document.createElement("div")
      elemento.className = "numero-circulo"
      elemento.textContent = i
      elemento.dataset.numero = i

      if (this.numerosSorteados.includes(i)) {
        elemento.classList.add("sorteado")
      }

      grid.appendChild(elemento)
    }
  }

  renderCartones() {
    const container = document.getElementById("cartonesJuegoContainer")
    container.innerHTML = ""

    this.cartones.forEach((carton, index) => {
      if (carton.numbers && carton.numbers.length === 3) {
        const cartonElement = document.createElement("div")
        const esGanador = this.cartonesGanadores.includes(carton.id)
        cartonElement.className = `carton-juego ${esGanador ? "ganador" : ""}`

        const numerosHtml = carton.numbers
          .map((numero) => {
            const acertado = this.numerosSorteados.includes(numero)
            return `<div class="carton-numero ${acertado ? "acertado" : ""}">${numero}</div>`
          })
          .join("")

        cartonElement.innerHTML = `
                    <div class="carton-header">
                        <strong>Cartón ${index + 1} ${esGanador ? "🏆" : ""}</strong>
                        <span>${carton.numbers.filter((n) => this.numerosSorteados.includes(n)).length}/3</span>
                    </div>
                    <div class="carton-numeros">${numerosHtml}</div>
                `

        container.appendChild(cartonElement)
      }
    })
  }

  renderNumerosSorteados() {
    const container = document.getElementById("numerosSorteados")

    if (this.numerosSorteados.length === 0) {
      container.innerHTML = ""
      return
    }

    if (this.numerosSorteados.length === 26 && this.faseJuego === 1) {
      container.innerHTML = ""
      this.faseJuego = 2
    }

    if (this.numerosSorteados.length === 1 || this.numerosSorteados.length === 26) {
      container.innerHTML = ""
    }

    const numeroAnterior = container.querySelector(".recien-sorteado")
    if (numeroAnterior) {
      numeroAnterior.classList.remove("recien-sorteado")
    }

    const ultimoNumero = this.numerosSorteados[this.numerosSorteados.length - 1]
    let posicion
    if (this.faseJuego === 1) {
      posicion = this.numerosSorteados.length - 1
    } else if (this.faseJuego === 2) {
      posicion = this.numerosSorteados.length - 26
    } else {
      this.mostrarTodosLosNumeros()
      return
    }

    const fila = Math.floor(posicion / 5)
    const columna = posicion % 5

    const elemento = document.createElement("div")
    elemento.className = "numero-sorteado recien-sorteado cayendo"
    elemento.dataset.numero = ultimoNumero
    elemento.textContent = ultimoNumero

    elemento.style.gridRow = `${5 - fila}`
    elemento.style.gridColumn = `${columna + 1}`

    container.appendChild(elemento)

    setTimeout(() => {
      elemento.classList.remove("cayendo")
    }, 600)
  }

  mostrarTodosLosNumeros() {
    const container = document.getElementById("numerosSorteados")
    container.innerHTML = ""

    this.numerosSorteados.forEach((numero, index) => {
      const fila = Math.floor(index / 5)
      const columna = index % 5

      const elemento = document.createElement("div")
      elemento.className = "numero-sorteado"
      elemento.dataset.numero = numero
      elemento.textContent = numero

      elemento.style.gridRow = `${10 - fila}`
      elemento.style.gridColumn = `${columna + 1}`

      container.appendChild(elemento)
    })
  }

  manejarScrollInteligente() {
    const container = document.getElementById("numerosSorteados").parentElement

    if (this.juegoEnCurso) {
      container.scrollTop = container.scrollHeight

      setTimeout(() => {
        container.scrollTop = container.scrollHeight
      }, 50)

      setTimeout(() => {
        container.scrollTop = container.scrollHeight
      }, 200)
    }
  }

  async jugar() {
    if (this.juegoEnCurso) return

    this.juegoEnCurso = true
    this.faseJuego = 1
    const btnJugar = document.getElementById("btnJugar")
    btnJugar.textContent = "Sorteando..."
    btnJugar.disabled = true

    const container = document.getElementById("numerosSorteados").parentElement
    container.style.overflowY = "hidden"
    container.style.pointerEvents = "none"

    for (let i = 0; i < 50; i++) {
      const numerosDisponibles = []
      for (let j = 0; j <= 99; j++) {
        if (!this.numerosSorteados.includes(j)) {
          numerosDisponibles.push(j)
        }
      }

      if (numerosDisponibles.length === 0) {
        break
      }

      const numeroSorteado = numerosDisponibles[Math.floor(Math.random() * numerosDisponibles.length)]
      this.numerosSorteados.push(numeroSorteado)

      btnJugar.textContent = `Sorteando... ${i + 1}/50`

      await this.animarNumeroSorteado(numeroSorteado)

      this.renderNumerosDisponibles()
      this.verificarGanadores()
      this.renderCartones()

      await new Promise((resolve) => setTimeout(resolve, 600))
    }

    this.faseJuego = 3
    this.mostrarTodosLosNumeros()

    container.style.overflowY = "auto"
    container.style.pointerEvents = "auto"

    this.juegoEnCurso = false
    btnJugar.textContent = "🎲 JUGAR"
    btnJugar.disabled = false
  }

  verificarGanadores() {
    const nuevosGanadores = []

    this.cartones.forEach((carton) => {
      if (carton.numbers && carton.numbers.length === 3 && !this.cartonesGanadores.includes(carton.id)) {
        const numerosAcertados = carton.numbers.filter((numero) => this.numerosSorteados.includes(numero))

        if (numerosAcertados.length === 3) {
          nuevosGanadores.push(carton.id)
          this.cartonesGanadores.push(carton.id)
        }
      }
    })

    if (nuevosGanadores.length > 0) {
      this.totalGanado += nuevosGanadores.length * 20000
      this.actualizarStats()
      this.mostrarModalVictoria(nuevosGanadores.length)
    }
  }

  mostrarModalVictoria(cartonesGanados) {
    const modal = document.getElementById("modalVictoria")
    const mensaje = document.getElementById("mensajeVictoria")

    const gananciaTotal = cartonesGanados * 20000

    mensaje.innerHTML = `
            <p style="font-size: 1.3rem; margin-bottom: 15px;">
                ¡Has ganado con <strong>${cartonesGanados}</strong> cartón${cartonesGanados > 1 ? "es" : ""}!
            </p>
            <div style="background: linear-gradient(45deg, #f0fff4, #c6f6d5); padding: 20px; border-radius: 10px; margin: 15px 0;">
                <p style="font-size: 1.1rem; margin-bottom: 10px;">
                    💰 Ganancia: <strong style="color: #48bb78;">$${gananciaTotal.toLocaleString()}</strong>
                </p>
                <p style="font-size: 1rem; color: #4a5568;">
                    (${cartonesGanados} cartón${cartonesGanados > 1 ? "es" : ""} × $20,000 c/u)
                </p>
            </div>
            <p style="font-size: 1rem; color: #718096;">
                Balance total: $${(this.totalGanado - this.totalGastado).toLocaleString()}
            </p>
        `

    modal.style.display = "block"
  }

  cerrarModal() {
    document.getElementById("modalVictoria").style.display = "none"
  }

  reiniciarPartida() {
    if (confirm("¿Estás seguro de que quieres reiniciar la partida? Se perderán los números sorteados.")) {
      this.numerosSorteados = []
      this.cartonesGanadores = []
      this.totalGanado = 0
      this.faseJuego = 1

      this.renderNumerosDisponibles()
      this.renderNumerosSorteados()
      this.renderCartones()
      this.actualizarStats()
    }
  }

  limpiarTodo() {
    if (confirm("¿Estás seguro de que quieres limpiar todo? Se perderán todos los cartones y el progreso.")) {
      localStorage.removeItem("bingoCartones")
      this.cartones = []
      this.numerosSorteados = []
      this.cartonesGanadores = []
      this.totalGastado = 0
      this.totalGanado = 0

      this.renderNumerosDisponibles()
      this.renderNumerosSorteados()
      this.renderCartones()
      this.actualizarStats()
    }
  }

  actualizarStats() {
    const cartonesCompletos = this.cartones.filter((c) => c.numbers && c.numbers.length === 3).length
    document.getElementById("cartonesJuego").textContent = cartonesCompletos
    document.getElementById("gastadoJuego").textContent = this.totalGastado.toLocaleString()
    document.getElementById("ganadoJuego").textContent = this.totalGanado.toLocaleString()
  }

  async animarNumeroSorteado(numero) {
    return new Promise((resolve) => {
      this.renderNumerosSorteados()
      setTimeout(resolve, 300)
    })
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new BingoJuego()
})
