console.log("render.js loaded")

function renderAll() {
  const grid = document.getElementById("bingo-grid")
  if (!grid || !window.state) return

  const { cols, rows, cellSize } = window.state.config

  grid.innerHTML = ""
  grid.style.display = "grid"
  grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`
  grid.style.gap = "12px"

  const total = cols * rows

  for (let i = 1; i <= total; i++) {
    const cell = document.createElement("div")
    cell.className = "bingo-cell"
    cell.style.width = cellSize + "px"
    cell.style.height = cellSize + "px"

    const num = document.createElement("div")
    num.className = "bingo-number"
    num.textContent = i

    const mission = document.createElement("div")
    mission.className = "bingo-mission"
    mission.textContent = ""   // 다음 단계에서 사용

    cell.appendChild(num)
    cell.appendChild(mission)
    grid.appendChild(cell)
  }
}
