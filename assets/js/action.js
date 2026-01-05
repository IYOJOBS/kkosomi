// assets/js/action.js
// 서버(worker) 저장/로드 + 관리자 UI 동작 유틸

// 너 worker 주소로 바꿔도 됨
// 예: https://broken-mode-e7b0.rlaxodus465.workers.dev
window.WORKER_BASE =
  window.WORKER_BASE ||
  "https://broken-mode-e7b0.rlaxodus465.workers.dev"

function getBjFromUrl() {
  const params = new URLSearchParams(location.search)
  return params.get("bj") || "jobs"
}

function setSaveIndicator(mode) {
  const el = document.getElementById("save-indicator")
  if (!el) return
  el.classList.remove("idle", "saving", "saved", "error")
  if (mode === "saving") {
    el.textContent = "저장 중"
    el.classList.add("saving")
  } else if (mode === "saved") {
    el.textContent = "저장 완료"
    el.classList.add("saved")
  } else if (mode === "error") {
    el.textContent = "저장 실패"
    el.classList.add("error")
  } else {
    el.textContent = "저장 대기"
    el.classList.add("idle")
  }
}

function makeDefaultConfig() {
  return {
    cols: 4,
    rows: 4,
    cellSize: 130,
    gap: 10,

    numberSize: 40,
    numberColor: "#111111",

    missionSize: 10,
    missionColor: "#333333",

    backgroundUrl: "",

    stampScale: 85
  }
}

function makeNewBoard(config) {
  const total = (config.cols || 4) * (config.rows || 4)
  return {
    config: structuredClone(config),
    cells: Array.from({ length: total }, (_, i) => ({
      number: i + 1,
      mission: "",
      checked: false
    }))
  }
}

function makeDefaultState() {
  const cfg = makeDefaultConfig()
  return {
    currentIndex: 0,
    boards: [makeNewBoard(cfg)]
  }
}

function getBoard() {
  return window.state.boards[window.state.currentIndex]
}

// 현재 보드의 크기 변경 시 cells를 파괴하지 않고 늘리거나 줄이기
function resizeCells(board, total) {
  const cur = board.cells.length

  if (cur < total) {
    for (let i = cur; i < total; i++) {
      board.cells.push({
        number: i + 1, // 기본은 순번
        mission: "",
        checked: false
      })
    }
  } else if (cur > total) {
    board.cells.length = total
  }
}

async function saveToServer(state, bj) {
  setSaveIndicator("saving")
  const url = `${window.WORKER_BASE}/save?bj=${encodeURIComponent(bj)}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state)
  })
  if (!res.ok) throw new Error("save failed " + res.status)
  setSaveIndicator("saved")
  return await res.json().catch(() => ({}))
}

async function loadFromServer(bj) {
  const url = `${window.WORKER_BASE}/load?bj=${encodeURIComponent(bj)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("load failed " + res.status)
  return await res.json()
}

// ===== 관리자 UI 동기화 =====

function syncSettingsUI() {
  const b = getBoard()
  const cfg = b.config

  const $ = (id) => document.getElementById(id)

  if ($("set-cols")) $("set-cols").value = cfg.cols
  if ($("set-rows")) $("set-rows").value = cfg.rows
  if ($("set-cell")) $("set-cell").value = cfg.cellSize
  if ($("set-gap")) $("set-gap").value = cfg.gap

  if ($("set-num-size")) $("set-num-size").value = cfg.numberSize
  if ($("set-num-color")) $("set-num-color").value = cfg.numberColor

  if ($("set-mission-size")) $("set-mission-size").value = cfg.missionSize
  if ($("set-mission-color")) $("set-mission-color").value = cfg.missionColor

  if ($("set-bg-url")) $("set-bg-url").value = cfg.backgroundUrl || ""
  if ($("set-stamp-scale")) $("set-stamp-scale").value = cfg.stampScale

  updateBoardIndicator()
}

function applySettingsFromUI() {
  const b = getBoard()
  const cfg = b.config

  const num = (id, fallback) => {
    const el = document.getElementById(id)
    const v = Number(el?.value)
    return Number.isFinite(v) ? v : fallback
  }
  const str = (id) => (document.getElementById(id)?.value || "").trim()

  cfg.cols = Math.max(1, Math.min(12, num("set-cols", cfg.cols)))
  cfg.rows = Math.max(1, Math.min(12, num("set-rows", cfg.rows)))
  cfg.cellSize = Math.max(60, Math.min(220, num("set-cell", cfg.cellSize)))
  cfg.gap = Math.max(0, Math.min(40, num("set-gap", cfg.gap)))

  cfg.numberSize = Math.max(10, Math.min(60, num("set-num-size", cfg.numberSize)))
  cfg.numberColor = document.getElementById("set-num-color")?.value || cfg.numberColor

  cfg.missionSize = Math.max(8, Math.min(40, num("set-mission-size", cfg.missionSize)))
  cfg.missionColor = document.getElementById("set-mission-color")?.value || cfg.missionColor

  cfg.backgroundUrl = str("set-bg-url")
  cfg.stampScale = Math.max(30, Math.min(140, num("set-stamp-scale", cfg.stampScale)))

  // 셀 개수 맞추기 (기존 데이터 유지)
  const total = cfg.cols * cfg.rows
  resizeCells(b, total)
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
    "set-stamp-scale"
  ]

  ids.forEach((id) => {
    const el = document.getElementById(id)
    if (!el) return
    el.addEventListener("input", () => {
      applySettingsFromUI()
      // 저장은 안 하고 프리뷰만
      renderAll()
      setSaveIndicator("idle")
    })
  })
}

function updateBoardIndicator() {
  const el = document.getElementById("board-indicator")
  if (!el) return
  el.textContent = `${window.state.currentIndex + 1} / ${window.state.boards.length}`
}

// 보드 이동/추가
function goPrevBoard() {
  if (window.state.currentIndex <= 0) return
  window.state.currentIndex--
  syncSettingsUI()
  renderAll()
}

function goNextBoard() {
  if (window.state.currentIndex >= window.state.boards.length - 1) return
  window.state.currentIndex++
  syncSettingsUI()
  renderAll()
}

function addNewBoard() {
  const curCfg = getBoard().config
  window.state.boards.push(makeNewBoard(curCfg))
  window.state.currentIndex = window.state.boards.length - 1
  syncSettingsUI()
  renderAll()
}

function resetCheckOnly() {
  const b = getBoard()
  b.cells.forEach((c) => (c.checked = false))
  renderAll()
}

function resetAllBoards() {
  const cfg = getBoard().config
  window.state = {
    currentIndex: 0,
    boards: [makeNewBoard(cfg)]
  }
  syncSettingsUI()
  renderAll()
}
