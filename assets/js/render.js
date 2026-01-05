// assets/js/render.js
console.log("render.js loaded")

let editingCellIndex = null

function isAdmin() {
  return document.body.classList.contains("admin")
}

function openEditModal(idx) {
  editingCellIndex = idx

  const modal = document.getElementById("edit-modal")
  const numInput = document.getElementById("edit-modal-number")
  const missionInput = document.getElementById("edit-modal-mission")

  const cell = getBoard().cells[idx]

  numInput.value = cell.number ?? ""
  missionInput.value = cell.mission ?? ""

  modal.classList.remove("hidden")
  numInput.focus()
  numInput.select()
}

function closeEditModal() {
  const modal = document.getElementById("edit-modal")
  modal.classList.add("hidden")
  editingCellIndex = null
}

function bindEditModalEvents() {
  const modal = document.getElementById("edit-modal")
  const saveBtn = document.getElementById("edit-modal-save")
  const cancelBtn = document.getElementById("edit-modal-cancel")
  const backdrop = document.querySelector("#edit-modal .modal-backdrop")
  const numInput = document.getElementById("edit-modal-number")
  const missionInput = document.getElementById("edit-modal-mission")

  if (!saveBtn || saveBtn.dataset.bound) return
  saveBtn.dataset.bound = "1"

  cancelBtn.addEventListener("click", closeEditModal)
  backdrop.addEventListener("click", closeEditModal)

  saveBtn.addEventListener("click", async () => {
    if (editingCellIndex === null) return

    const b = getBoard()
    const cell = b.cells[editingCellIndex]

    // 숫자
    const v = String(numInput.value || "").trim()
    cell.number = v === "" ? "" : Number(v)

    // 미션
    cell.mission = String(missionInput.value || "").trim()

    renderAll()

    if (isAdmin()) {
      const bj = getBjFromUrl()
      try {
        await saveToServer(window.state, bj)
      } catch (e) {
        console.error(e)
        setSaveIndicator("error")
      }
    }

    closeEditModal()
  })

  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditModal()
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveBtn.click()
  })
}

function renderAll() {
  if (!window.state) return
  bindEditModalEvents()
  applyBackground()
  applyGridStyle()
  renderBingoGrid()
  if (typeof updateBoardIndicator === "function") updateBoardIndicator()
}

function applyGridStyle() {
  const grid = document.getElementById("bingo-grid")
  const wrap = document.getElementById("bingo-wrap")
  if (!grid || !wrap) return

  const cfg = getBoard().config
  const { cols, rows, cellSize, gap } = cfg

  grid.style.display = "grid"
  grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`
  grid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`
  grid.style.gap = `${gap}px`

  const pad = 18
  const w = cols * cellSize + (cols - 1) * gap + pad * 2
  const h = rows * cellSize + (rows - 1) * gap + pad * 2
  wrap.style.width = `${w}px`
  wrap.style.height = `${h}px`
}

function applyBackground() {
  const bg = document.getElementById("bingo-bg")
  if (!bg) return
  const cfg = getBoard().config
  const url = (cfg.backgroundUrl || "").trim()
  bg.style.backgroundImage = url ? `url("${url}")` : "none"
}

function isBoardComplete(board) {
  return board.cells.length > 0 && board.cells.every((c) => c.checked)
}

function renderBingoGrid() {
  const grid = document.getElementById("bingo-grid")
  if (!grid) return

  const board = window.state.boards[window.state.currentIndex]
  const cfg = window.state.config
  const isAdmin = document.body.classList.contains("admin")

  grid.innerHTML = ""

  board.cells.forEach((cell, idx) => {
    const cellEl = document.createElement("div")
    cellEl.className = "bingo-cell" + (cell.checked ? " checked" : "")

    const inner = document.createElement("div")
    inner.className = "cell-inner"

    // 숫자
    const num = document.createElement("div")
    num.className = "bingo-number"
    num.textContent = cell.number ?? ""
    num.style.fontSize = cfg.numberSize + "px"
    num.style.color = cfg.numberColor

    // 미션 (숫자 아래)
    const mission = document.createElement("div")
    mission.className = "bingo-mission"
    mission.textContent = cell.mission || ""
    mission.style.fontSize = cfg.missionSize + "px"
    mission.style.color = cfg.missionColor
    mission.contentEditable = isAdmin
    mission.spellcheck = false

    // 스탬프 (중앙)
    const stamp = document.createElement("div")
    stamp.className = "bingo-stamp"
    const img = document.createElement("img")
    img.src = "/assets/img/stamp-kkosomi.png"
    img.style.width = cfg.stampScale + "%"
    stamp.appendChild(img)

    inner.appendChild(num)
    inner.appendChild(mission)
    inner.appendChild(stamp)
    cellEl.appendChild(inner)

    if (isAdmin) {
      // 숫자 수정
      num.addEventListener("dblclick", (e) => {
        e.stopPropagation()
        openNumberModal(idx)
      })

      // 미션 저장
      mission.addEventListener("blur", async () => {
        cell.mission = mission.textContent.trim()
        await saveToServer(window.state, getBJ())
      })

      // 체크 토글
      cellEl.addEventListener("click", async () => {
        cell.checked = !cell.checked
        renderAll()
        await saveToServer(window.state, getBJ())
      })
    }

    grid.appendChild(cellEl)
  })
}

