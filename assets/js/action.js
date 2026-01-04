async function saveToServer(state, bj) {
  const res = await fetch(
    `https://broken-mode-e7b0.rlaxodus465.workers.dev/save?bj=${bj}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    }
  )

  if (!res.ok) {
    alert("서버 저장 실패")
    return
  }

  console.log("✅ 서버 저장 완료", bj)
}
