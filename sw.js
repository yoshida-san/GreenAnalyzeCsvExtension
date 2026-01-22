chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type !== "download_csv") return;

      const filename = msg.filename || "green_analyze.csv";
      const csv = String(msg.csv ?? "");

      // data URLでダウンロード（service worker内で完結）
      const url = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);

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
