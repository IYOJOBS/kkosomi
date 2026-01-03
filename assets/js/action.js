console.log("action.js loaded")

document.addEventListener("click", async (e) => {
  const cell = e.target.closest(".bingo-cell")
  if (!cell) return

  // 송출 화면에서는 클릭 막고 싶으면 나중에 분리
  const idx = Number(cell.dataset.index)

  const board = window.state.boards[window.state.currentIndex]
  const cellData = board.cells[idx]

  // 체크 토글
  cellData.checked = !cellData.checked

  // 서버 저장
  const bj =
    new URLSearchParams(location.search).get("bj") || "jobs"

  await fetch(
    `https://broken-mode-e7b0.rlaxodus465.workers.dev/save?bj=${bj}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(window.state)
    }
  )

  // 다시 그리기
  renderAll()
})
