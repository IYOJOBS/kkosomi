console.log("action.js loaded")

async function saveToServer(state) {
  await fetch(
    "https://broken-mode-e7b0.rlaxodus465.workers.dev/save",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    }
  )
}
