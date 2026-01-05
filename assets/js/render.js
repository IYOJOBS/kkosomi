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

  const board = getBoard()
  const cfg = board.config

  grid.innerHTML = ""

  board.cells.forEach((cell, idx) => {
    const cellEl = document.createElement("div")
    cellEl.className = "bingo-cell" + (cell.checked ? " checked" : "")
    cellEl.dataset.index = String(idx)

    // 숫자
    const num = document.createElement("div")
    num.className = "bingo-number"
    num.textContent = cell.number === undefined || cell.number === null ? "" : String(cell.number)
    num.style.fontSize = `${cfg.numberSize}px`
    num.style.color = cfg.numberColor

    // 미션
    const mission = document.createElement("div")
    mission.className = "bingo-mission"
    mission.textContent = (cell.mission || "").trim()
    mission.style.fontSize = `${cfg.missionSize}px`
    mission.style.color = cfg.missionColor

    // 미션 비어있으면 아예 숨김 (요구사항)
    if (!mission.textContent) {
      mission.style.display = "none"
    }

    // 스탬프 (항상 최상단, 클릭 방해 x)
    const stamp = document.createElement("div")
    stamp.className = "bingo-stamp"
    stamp.style.pointerEvents = "none"
    stamp.style.position = "absolute"
    stamp.style.inset = "0"
    stamp.style.display = cell.checked ? "grid" : "none"
    stamp.style.placeItems = "center"
    stamp.style.zIndex = "10"

    const img = document.createElement("img")
    img.src = "/assets/img/stamp-kkosomi.png"
    img.alt = "stamp"
    img.style.width = `${cfg.stampScale}%`
    img.style.height = "auto"
    stamp.appendChild(img)

    // 셀 내부 레이아웃 안정화
    cellEl.style.position = "relative"
    cellEl.style.display = "grid"
    cellEl.style.gridTemplateRows = "1fr auto"
    cellEl.style.alignItems = "center"
    cellEl.style.justifyItems = "center"
    cellEl.style.padding = "10px"
    cellEl.style.boxSizing = "border-box"

    // 숫자 중앙 고정
    num.style.display = "grid"
    num.style.placeItems = "center"
    num.style.lineHeight = "1"
    num.style.width = "100%"
    num.style.userSelect = "none"
    num.style.zIndex = "2"

    // 미션은 아래 쪽에만
    mission.style.width = "100%"
    mission.style.textAlign = "center"
    mission.style.marginTop = "6px"
    mission.style.wordBreak = "break-word"
    mission.style.zIndex = "2"

    cellEl.appendChild(num)
    cellEl.appendChild(mission)
    cellEl.appendChild(stamp)

    // 관리자에서만 편집/체크 가능 (OBS view는 표시용)
    if (isAdmin()) {
      // 클릭 = 체크 토글 (해제도 됨)
      cellEl.addEventListener("click", async () => {
        cell.checked = !cell.checked
        renderAll()

        // 다 채우면 새 보드 자동 생성
        if (isBoardComplete(board)) {
          window.state.boards.push(makeNewBoard(board.config))
          window.state.currentIndex = window.state.boards.length - 1
          syncSettingsUI()
          renderAll()
        }

        const bj = getBjFromUrl()
        try {
          await saveToServer(window.state, bj)
        } catch (e) {
          console.error(e)
          setSaveIndicator("error")
        }
      })

      // 더블클릭 = 숫자+미션 편집 모달
      cellEl.addEventListener("dblclick", (e) => {
        e.preventDefault()
        e.stopPropagation()
        openEditModal(idx)
      })
    }

    grid.appendChild(cellEl)
  })
}
