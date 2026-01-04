console.log("render.js loaded")

let editingCellIndex = null

function openNumberModal(idx) {
  editingCellIndex = idx
  const modal = document.getElementById("num-modal")
  const input = document.getElementById("num-modal-input")
  const board = window.state.boards[window.state.currentIndex]
  input.value = String(board.cells[idx].number ?? "")
  modal.classList.remove("hidden")
  input.focus()
  input.select()
}

function closeNumberModal() {
  const modal = document.getElementById("num-modal")
  modal.classList.add("hidden")
  editingCellIndex = null
}

function bindNumberModalEvents() {
  const saveBtn = document.getElementById("num-modal-save")
  const cancelBtn = document.getElementById("num-modal-cancel")
  const backdrop = document.querySelector("#num-modal .modal-backdrop")
  const input = document.getElementById("num-modal-input")

  if (!saveBtn || saveBtn.dataset.bound) return
  saveBtn.dataset.bound = "1"

  cancelBtn.addEventListener("click", closeNumberModal)
  backdrop.addEventListener("click", closeNumberModal)

  saveBtn.addEventListener("click", async () => {
    if (editingCellIndex === null) return
    const v = Number(input.value)
    if (Number.isNaN(v)) return

    const board = window.state.boards[window.state.currentIndex]
    board.cells[editingCellIndex].number = v

    renderAll()

    const params = new URLSearchParams(location.search)
    const bj = params.get("bj") || "jobs"
    await saveToServer(window.state, bj)
    setSaveIndicator("saved")

    closeNumberModal()
  })

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNumberModal()
    if (e.key === "Enter") saveBtn.click()
  })
}

function renderAll() {
  if (!window.state) return
  bindNumberModalEvents()
  applyBackground()
  applyGridStyle()
  renderBingoGrid()
}

function applyGridStyle() {
  const grid = document.getElementById("bingo-grid")
  const wrap = document.getElementById("bingo-wrap")
  if (!grid || !wrap) return

  const { cols, rows, cellSize, gap } = window.state.config

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
  const url = (window.state.config.backgroundUrl || "").trim()
  bg.style.backgroundImage = url ? `url("${url}")` : "none"
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
    cellEl.dataset.index = String(idx)

    /* 숫자 */
    const num = document.createElement("div")
    num.className = "bingo-number"
    num.textContent = String(cell.number ?? "")
    num.style.fontSize = `${cfg.numberSize}px`
    num.style.color = cfg.numberColor

    /* 미션 래퍼 */
    const missionWrap = document.createElement("div")
    missionWrap.className = "bingo-mission-wrap"

    /* 미션 */
    const mission = document.createElement("div")
    mission.className = "bingo-mission"
    mission.textContent = cell.mission || ""
    mission.style.fontSize = `${cfg.missionSize}px`
    mission.style.color = cfg.missionColor
    if (!mission.textContent) mission.classList.add("placeholder")

    missionWrap.appendChild(mission)

    /* 스탬프 */
    const stamp = document.createElement("div")
    stamp.className = "bingo-stamp"

    const img = document.createElement("img")
    img.src = "/assets/img/stamp-kkosomi.png"
    img.alt = "stamp"
    img.style.width = `${cfg.stampScale}%`
    stamp.appendChild(img)

    /* append 순서 고정 */
    cellEl.appendChild(num)
    cellEl.appendChild(missionWrap)
    cellEl.appendChild(stamp)

    if (isAdmin) {
      /* 숫자 더블클릭 */
      num.addEventListener("dblclick", (e) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        openNumberModal(idx)
      })

      /* 미션 편집 */
      mission.contentEditable = "true"
      mission.spellcheck = false

      mission.addEventListener("focus", () => {
        mission.classList.remove("placeholder")
      })

      mission.addEventListener("blur", () => {
        const v = (mission.textContent || "").trim()
        board.cells[idx].mission = v
        if (!v) mission.classList.add("placeholder")
      })

      mission.addEventListener("keydown", async (e) => {
        if (e.key !== "Enter") return
        e.preventDefault()
        mission.blur()

        const bj = new URLSearchParams(location.search).get("bj") || "jobs"
        await saveToServer(window.state, bj)
        setSaveIndicator("saved")
      })

      /* 셀 클릭 체크 */
      cellEl.addEventListener("click", async (e) => {
        if (e.target.closest(".bingo-number")) return
        if (e.target.closest(".bingo-mission")) return

        board.cells[idx].checked = !board.cells[idx].checked
        renderAll()

        const bj = new URLSearchParams(location.search).get("bj") || "jobs"
        await saveToServer(window.state, bj)
        setSaveIndicator("saved")
      })
    }

    grid.appendChild(cellEl)
  })
}
