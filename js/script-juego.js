class BingoJuego {
  constructor() {
    this.cartones = JSON.parse(localStorage.getItem("bingoCartones")) || []
    this.numerosSorteados = []
    this.juegoEnCurso = false
    this.cartonesGanadores = []
    this.totalGastado = this.cartones.length * 2000
    this.totalGanado = 0

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

    // Si es el primer número, limpiar el contenedor
    if (this.numerosSorteados.length === 1) {
      container.innerHTML = ""
    }

    // Obtener el último número sorteado
    const ultimoNumero = this.numerosSorteados[this.numerosSorteados.length - 1]
    const posicion = this.numerosSorteados.length - 1

    // Calcular fila y columna (empezando desde abajo izquierda)
    const fila = Math.floor(posicion / 5)
    const columna = posicion % 5

    // Crear elemento del número
    const elemento = document.createElement("div")
    elemento.className = "numero-sorteado recien-sorteado cayendo"
    elemento.dataset.numero = ultimoNumero
    elemento.textContent = ultimoNumero

    elemento.style.gridRow = `${10 - fila}` // Invertir para que empiece desde abajo
    elemento.style.gridColumn = `${columna + 1}`

    container.appendChild(elemento)

    setTimeout(() => {
      elemento.classList.remove("cayendo")
    }, 600)

    setTimeout(() => {
      this.manejarScrollInteligente()
    }, 100)
  }

  manejarScrollInteligente() {
    // Solo se ejecuta si el juego está en curso
    if (this.juegoEnCurso) {
        // Obtenemos el contenedor de los números sorteados
        const container = document.getElementById("numerosSorteados").parentElement;

        // Buscamos el último número sorteado (el que tiene la clase 'recien-sorteado')
        const ultimoNumeroElemento = container.querySelector('.recien-sorteado');
        
        // Si encontramos el elemento, hacemos scroll hacia él
        if (ultimoNumeroElemento) {
            ultimoNumeroElemento.scrollIntoView({
                behavior: 'smooth', // Hace que el scroll sea animado y suave
                block: 'end'         // Alinea la parte inferior del elemento con el borde inferior del contenedor
            });
        }
    }
}

  async jugar() {
    if (this.juegoEnCurso) return

    this.juegoEnCurso = true
    const btnJugar = document.getElementById("btnJugar")
    btnJugar.textContent = "Sorteando..."
    btnJugar.disabled = true

    const container = document.getElementById("numerosSorteados").parentElement
    container.scrollTop = container.scrollHeight

    for (let i = 0; i < 50; i++) {
      // Obtener números disponibles
      const numerosDisponibles = []
      for (let j = 0; j <= 99; j++) {
        if (!this.numerosSorteados.includes(j)) {
          numerosDisponibles.push(j)
        }
      }

      if (numerosDisponibles.length === 0) {
        break // No hay más números disponibles
      }

      // Sortear número aleatorio
      const numeroSorteado = numerosDisponibles[Math.floor(Math.random() * numerosDisponibles.length)]
      this.numerosSorteados.push(numeroSorteado)

      // Actualizar contador en el botón
      btnJugar.textContent = `Sorteando... ${i + 1}/50`

      await this.animarNumeroSorteado(numeroSorteado)

      // Actualizar visualización
      this.renderNumerosDisponibles()
      this.renderNumerosSorteados()
      this.verificarGanadores()
      this.renderCartones()

      setTimeout(() => {
        this.cambiarColorNumeroReciente()
      }, 500) // Reducido de 1000ms a 500ms

      await new Promise((resolve) => setTimeout(resolve, 600))
    }

    this.juegoEnCurso = false
    btnJugar.textContent = "🎲 JUGAR"
    btnJugar.disabled = false
  }

  cambiarColorNumeroReciente() {
    const numerosContainer = document.getElementById("numerosSorteados")
    const numeroReciente = numerosContainer.querySelector(".recien-sorteado")
    if (numeroReciente) {
      numeroReciente.classList.remove("recien-sorteado")
      // Pequeña animación de transición
      numeroReciente.style.transform = "scale(1.1)"
      setTimeout(() => {
        numeroReciente.style.transform = "scale(1)"
      }, 200)
    }
  }

  async animarNumeroSorteado(numero) {
    return new Promise((resolve) => {
      // Solo renderizar, la animación se maneja en CSS
      this.renderNumerosSorteados()
      setTimeout(resolve, 300) // Tiempo reducido ya que la animación es más fluida
    })
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
}

// Inicializar el juego cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  new BingoJuego()
})
