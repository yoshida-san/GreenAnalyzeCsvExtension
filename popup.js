async function send(payload) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return await chrome.tabs.sendMessage(tab.id, payload);
}

const msgEl = document.getElementById("msg");

document.getElementById("download").addEventListener("click", async () => {
  msgEl.textContent = "";
  const excludeSummary = document.getElementById("excludeSummary")?.checked ?? true;
  const excludeMeta = document.getElementById("excludeMeta")?.checked ?? false;
  const format =
    document.querySelector('input[name="format"]:checked')?.value === "xlsx"
      ? "xlsx"
      : "csv";

  try {
    const res = await send({ action: "download", options: { excludeSummary, excludeMeta, format } });
    if (res?.ok) msgEl.textContent = `完了しました\nファイル名: ${res.filename}`;
    else msgEl.textContent = res?.error ?? "失敗しました";
  } catch (e) {
    msgEl.textContent = String(e);
  }
});
