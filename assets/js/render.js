console.log("render.js loaded")

let editingCellIndex = null

/* =====================
   안전한 config getter
===================== */
function getConfig() {
  const cfg = window.state?.config || {}
  return {
    cols: cfg.cols ?? 4,
    rows: cfg.rows ?? 4,
    cellSize: cfg.cellSize ?? 130,
    gap: cfg.gap ?? 10,

    numberSize: cfg.numberSize ?? 40,
    numberColor: cfg.numberColor ?? "#111",
    missionSize: cfg.missionSize ?? 14,
    missionColor: cfg.missionColor ?? "#333",

    stampScale: cfg.stampScale ?? 85,
    backgroundUrl: cfg.backgroundUrl ?? ""
  }
}

/* =====================
   메인 렌더
===================== */
function renderAll() {
  if (!window.state) return
  applyBackground()
  applyGridStyle()
  renderBingoGrid()
}

/* =====================
   배경
===================== */
function applyBackground() {
  const bg = document.getElementById("bingo-bg")
  if (!bg) return
  const cfg = getConfig()
  bg.style.backgroundImage = cfg.backgroundUrl
    ? `url("${cfg.backgroundUrl}")`
    : "none"
}

/* =====================
   그리드 스타일
===================== */
function applyGridStyle() {
  const grid = document.getElementById("bingo-grid")
  const wrap = document.getElementById("bingo-wrap")
  if (!grid || !wrap) return

  const cfg = getConfig()

  grid.style.display = "grid"
  grid.style.gridTemplateColumns = `repeat(${cfg.cols}, ${cfg.cellSize}px)`
  grid.style.gridTemplateRows = `repeat(${cfg.rows}, ${cfg.cellSize}px)`
  grid.style.gap = `${cfg.gap}px`

  const pad = 20
  wrap.style.width =
    cfg.cols * cfg.cellSize + (cfg.cols - 1) * cfg.gap + pad * 2 + "px"
  wrap.style.height =
    cfg.rows * cfg.cellSize + (cfg.rows - 1) * cfg.gap + pad * 2 + "px"
}

/* =====================
   빙고판
===================== */
function renderBingoGrid() {
  const grid = document.getElementById("bingo-grid")
  if (!grid) return

  const cfg = getConfig()
  const board = window.state.boards[window.state.currentIndex]

  grid.innerHTML = ""

  board.cells.forEach((cell, idx) => {
    const cellEl = document.createElement("div")
    cellEl.className = "bingo-cell" + (cell.checked ? " checked" : "")

    /* 숫자 */
    const num = document.createElement("div")
    num.className = "bingo-number"
    num.textContent = cell.number ?? ""
    num.style.fontSize = cfg.numberSize + "px"
    num.style.color = cfg.numberColor

    /* 미션 */
    const mission = document.createElement("div")
    mission.className = "bingo-mission"
    mission.textContent = cell.mission || ""
    mission.style.fontSize = cfg.missionSize + "px"
    mission.style.color = cfg.missionColor

    /* 스탬프 */
    const stamp = document.createElement("div")
    stamp.className = "bingo-stamp"
    const img = document.createElement("img")
    img.src = "/assets/img/stamp-kkosomi.png"
    img.style.width = cfg.stampScale + "%"
    stamp.appendChild(img)

    cellEl.appendChild(num)
    cellEl.appendChild(mission)
    cellEl.appendChild(stamp)

    /* 클릭 체크 */
    cellEl.addEventListener("click", async () => {
      cell.checked = !cell.checked
      renderAll()

      const bj = new URLSearchParams(location.search).get("bj") || "jobs"
      await saveToServer(window.state, bj)
    })

    /* 숫자 + 미션 수정 */
    num.addEventListener("dblclick", (e) => {
      e.stopPropagation()
      openEditModal(idx)
    })

    grid.appendChild(cellEl)
  })
}

/* =====================
   수정 모달
===================== */
function openEditModal(idx) {
  editingCellIndex = idx
  const board = window.state.boards[window.state.currentIndex]

  document.getElementById("num-modal-input").value =
    board.cells[idx].number ?? ""
  document.getElementById("mission-modal-input").value =
    board.cells[idx].mission ?? ""

  document.getElementById("num-modal").classList.remove("hidden")
}

document.getElementById("num-modal-save")?.addEventListener("click", async () => {
  const board = window.state.boards[window.state.currentIndex]
  const num = Number(document.getElementById("num-modal-input").value)
  const mission = document.getElementById("mission-modal-input").value.trim()

  if (!Number.isNaN(num)) board.cells[editingCellIndex].number = num
  board.cells[editingCellIndex].mission = mission

  document.getElementById("num-modal").classList.add("hidden")
  renderAll()

  const bj = new URLSearchParams(location.search).get("bj") || "jobs"
  await saveToServer(window.state, bj)
})
