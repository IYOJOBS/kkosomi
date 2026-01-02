async function saveToServer(state, bj) {
  await fetch(
    `https://broken-mode-e7b0.rlaxodus465.workers.dev/save?bj=${bj}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    }
  )
}
