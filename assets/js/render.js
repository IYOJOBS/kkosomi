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
    cell.dataset.index = i - 1
    cell.style.width = cellSize + "px"
    cell.style.height = cellSize + "px"

    const num = document.createElement("div")
    num.className = "bingo-number"
    num.textContent = i

    const mission = document.createElement("div")
    mission.className = "bingo-mission"
    mission.textContent = ""

    const stamp = document.createElement("div")
    stamp.className = "bingo-stamp"

    const img = document.createElement("img")
    img.src = "/assets/img/stamp-kkosomi.png"
    img.alt = "stamp"

    stamp.appendChild(img)

    cell.appendChild(num)
    cell.appendChild(mission)
    cell.appendChild(stamp)

    grid.appendChild(cell)
  }
}
