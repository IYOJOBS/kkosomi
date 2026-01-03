console.log("render.js loaded")

function renderAll() {
  const grid = document.getElementById("bingo-grid")
  if (!grid || !window.state) return

  const { cols, rows, cellSize } = window.state.config

  grid.innerHTML = ""
  grid.style.display = "grid"
  grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`
  grid.style.gap = "10px"

  const total = cols * rows

  for (let i = 1; i <= total; i++) {
    const cell = document.createElement("div")
    cell.style.width = cellSize + "px"
    cell.style.height = cellSize + "px"
    cell.style.background = "#fff"
    cell.style.borderRadius = "14px"
    cell.style.display = "flex"
    cell.style.alignItems = "center"
    cell.style.justifyContent = "center"
    cell.style.fontWeight = "700"

    cell.textContent = i
    grid.appendChild(cell)
  }
}
