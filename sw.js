chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type !== "download_file") return;

      const filename = msg.filename || "green_analyze.csv";
      const mime = msg.mime || "text/csv";
      const data = String(msg.data ?? "");
      const url = msg.isBase64
        ? `data:${mime};base64,${data}`
        : `data:${mime};charset=utf-8,` + encodeURIComponent(data);

      const downloadId = await chrome.downloads.download({
        url,
        filename,
        saveAs: true
      });

      sendResponse({ ok: true, downloadId });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message ?? String(e) });
    }
  })();

  return true; // async
});
