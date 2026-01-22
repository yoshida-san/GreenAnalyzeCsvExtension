async function send(payload) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return await chrome.tabs.sendMessage(tab.id, payload);
}

const msgEl = document.getElementById("msg");

document.getElementById("download").addEventListener("click", async () => {
  msgEl.textContent = "";
  const excludeSummary = document.getElementById("excludeSummary")?.checked ?? true;

  try {
    const res = await send({ action: "download", options: { excludeSummary } });
    if (res?.ok) msgEl.textContent = `開始しました\nファイル名: ${res.filename}`;
    else msgEl.textContent = res?.error ?? "失敗しました";
  } catch (e) {
    msgEl.textContent = String(e);
  }
});
