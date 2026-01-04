const WORKER_BASE = "https://broken-mode-e7b0.rlaxodus465.workers.dev"

function setSaveIndicator(mode) {
  const el = document.getElementById("save-indicator")
  if (!el) return
  el.classList.remove("idle", "saving", "saved", "error")
  if (mode === "saving") {
    el.classList.add("saving")
    el.textContent = "저장 중"
    return
  }
  if (mode === "saved") {
    el.classList.add("saved")
    el.textContent = "저장 완료"
    return
  }
  if (mode === "error") {
    el.classList.add("error")
    el.textContent = "저장 실패"
    return
  }
  el.classList.add("idle")
  el.textContent = "저장 대기"
}

async function saveToServer(state, bj) {
  try {
    setSaveIndicator("saving")
    const res = await fetch(`${WORKER_BASE}/save?bj=${encodeURIComponent(bj)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    })
    if (!res.ok) throw new Error("save failed")
    return true
  } catch (e) {
    console.log(e)
    setSaveIndicator("error")
    return false
  }
}

async function loadFromServer(bj) {
  try {
    const res = await fetch(`${WORKER_BASE}/load?bj=${encodeURIComponent(bj)}`)
    const data = await res.json().catch(() => null)
    if (!data || data === null) return false
    window.state = normalizeState(data)
    return true
  } catch (e) {
    console.log(e)
    return false
  }
}

function makeDefaultConfig() {
  return {
    cols: 5,
    rows: 5,
    cellSize: 120,
    gap: 12,
    numberSize: 18,
    numberColor: "#111111",
    missionSize: 14,
    missionColor: "#333333",
    backgroundUrl: "",
    stampScale: 85,
  }
}

function makeDefaultState() {
  const config = makeDefaultConfig()
  const total = config.cols * config.rows
  return {
    config,
    boards: [
      {
        cells: Array.from({ length: total }, (_, i) => ({
          number: i + 1,
          mission: "",
          checked: false,
        })),
      },
    ],
    currentIndex: 0,
  }
}

function normalizeState(raw) {
  const cfg = { ...makeDefaultConfig(), ...(raw.config || {}) }
  const cols = Math.max(1, Number(cfg.cols || 5))
  const rows = Math.max(1, Number(cfg.rows || 5))
  cfg.cols = cols
  cfg.rows = rows
  cfg.cellSize = Number(cfg.cellSize || 120)
  cfg.gap = Number(cfg.gap ?? 12)

  const total = cols * rows
  const boards = Array.isArray(raw.boards) && raw.boards.length ? raw.boards : [{ cells: [] }]
  const board0 = boards[0] || { cells: [] }
  const cellsRaw = Array.isArray(board0.cells) ? board0.cells : []

  const cells = Array.from({ length: total }, (_, i) => {
    const c = cellsRaw[i] || {}
    return {
      number: Number(c.number ?? i + 1),
      mission: String(c.mission ?? ""),
      checked: Boolean(c.checked),
    }
  })

  return {
    config: cfg,
    boards: [{ cells }],
    currentIndex: 0,
  }
}

function getBoard() {
  const idx = Number(window.state?.currentIndex || 0)
  return window.state.boards[idx]
}

function syncSettingsUI() {
  const c = window.state.config
  const setVal = (id, v) => {
    const el = document.getElementById(id)
    if (el) el.value = v ?? ""
  }

  setVal("set-cols", c.cols)
  setVal("set-rows", c.rows)
  setVal("set-cell", c.cellSize)
  setVal("set-gap", c.gap)

  setVal("set-num-size", c.numberSize)
  setVal("set-num-color", c.numberColor)
  setVal("set-mission-size", c.missionSize)
  setVal("set-mission-color", c.missionColor)

  setVal("set-bg-url", c.backgroundUrl)
  setVal("set-stamp-scale", c.stampScale)
}

function applySettingsFromUI(rebuildCells) {
  const c = window.state.config
  const getNum = (id, fallback) => {
    const el = document.getElementById(id)
    return el ? Number(el.value) : fallback
  }
  const getStr = (id, fallback) => {
    const el = document.getElementById(id)
    return el ? String(el.value || "") : fallback
  }

  const nextCols = Math.max(1, getNum("set-cols", c.cols))
  const nextRows = Math.max(1, getNum("set-rows", c.rows))
  const nextTotal = nextCols * nextRows

  c.cols = nextCols
  c.rows = nextRows
  c.cellSize = Math.max(60, getNum("set-cell", c.cellSize))
  c.gap = Math.max(0, getNum("set-gap", c.gap))

  c.numberSize = Math.max(10, getNum("set-num-size", c.numberSize))
  c.numberColor = getStr("set-num-color", c.numberColor)

  c.missionSize = Math.max(10, getNum("set-mission-size", c.missionSize))
  c.missionColor = getStr("set-mission-color", c.missionColor)

  c.backgroundUrl = getStr("set-bg-url", c.backgroundUrl).trim()
  c.stampScale = Math.max(30, getNum("set-stamp-scale", c.stampScale))

  if (rebuildCells) {
    const board = getBoard()
    const old = board.cells || []
    board.cells = Array.from({ length: nextTotal }, (_, i) => {
      const prev = old[i]
      return prev
        ? { ...prev }
        : { number: i + 1, mission: "", checked: false }
    })
    window.state.boards = [board]
    window.state.currentIndex = 0
  }
}

function wireLivePreviewInputs() {
  const ids = [
    "set-cols",
    "set-rows",
    "set-cell",
    "set-gap",
    "set-num-size",
    "set-num-color",
    "set-mission-size",
    "set-mission-color",
    "set-bg-url",
    "set-stamp-scale",
  ]

  ids.forEach(id => {
    const el = document.getElementById(id)
    if (!el) return
    el.addEventListener("input", () => {
      applySettingsFromUI(false)
      renderAll()
      setSaveIndicator("idle")
    })
  })
}
