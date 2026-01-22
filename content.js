function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normalizeText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function tableTo2D(table) {
  const rows = [...table.querySelectorAll("tr")];
  return rows.map(tr =>
    [...tr.querySelectorAll("th,td")].map(td => normalizeText(td.textContent))
  );
}

function pickAnalyzeTable() {
  // 両タブ対応（求職者/貴社）
  return (
    document.querySelector("table.analyze-table-apply") ||
    document.querySelector("table.analyze-table-approach") ||
    document.querySelector("#js-analyze-container table")
  );
}

function getMeta() {
  const from = document.querySelector("#analyze_date_from")?.value ?? "";
  const to = document.querySelector("#analyze_date_to")?.value ?? "";
  const jobType =
    document.querySelector("#js-analyze_job_type")?.selectedOptions?.[0]?.textContent?.trim() ?? "";
  const activeTab =
    document.querySelector(".analyze-box-tab .active-tab")?.textContent?.trim() ?? "";
  return { from, to, jobType, activeTab };
}

async function waitForTable(timeoutMs = 8000) {
  const existing = pickAnalyzeTable();
  if (existing) return existing;

  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      obs.disconnect();
      reject(new Error("テーブルが見つかりません。先に『計算する』を押して表示してください。"));
    }, timeoutMs);

    const obs = new MutationObserver(() => {
      const t = pickAnalyzeTable();
      if (t) {
        clearTimeout(timer);
        obs.disconnect();
        resolve(t);
      }
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });
  });
}

function buildCsv(options = {}) {
  const table = pickAnalyzeTable();
  if (!table) throw new Error("テーブルが見つかりません。");

  const data2d = tableTo2D(table);
  const excludeSummary = options.excludeSummary === true;
  const summaryLabels = new Set(["合計", "平均", "採用成功求人平均"]);
  const filtered2d = excludeSummary
    ? data2d.filter((row, idx) => {
        if (idx === 0) return true; // header
        const label = (row?.[0] ?? "").trim();
        return !summaryLabels.has(label);
      })
    : data2d;
  const { from, to, jobType, activeTab } = getMeta();

  // 先頭にメタ情報（不要なら削除してOK）
  const metaLines = [
    ["# period_from", from],
    ["# period_to", to],
    ["# job_type", jobType],
    ["# tab", activeTab]
  ].map(cols => cols.map(csvEscape).join(","));

  const csvLines = filtered2d.map(row => row.map(csvEscape).join(","));
  return [...metaLines, ...csvLines].join("\n");
}

function buildFilename() {
  const { from, to, activeTab } = getMeta();
  const tabKey = activeTab.includes("求職者") ? "apply"
               : activeTab.includes("貴社") ? "approach"
               : "analyze";
  const f = (from || "").replaceAll("/", "");
  const t = (to || "").replaceAll("/", "");
  return `green_${tabKey}_${f}-${t}.csv`;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.action !== "download") {
        sendResponse({ ok: false, error: "unknown action" });
        return;
      }

      await waitForTable();
      const csv = buildCsv(msg?.options ?? {});
      const filename = buildFilename();

      // service workerへ渡してdownloads APIでsaveAs=trueダウンロード
      const res = await chrome.runtime.sendMessage({
        type: "download_csv",
        filename,
        csv
      });

      if (!res?.ok) throw new Error(res?.error ?? "ダウンロードに失敗しました。");

      sendResponse({ ok: true, filename });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message ?? String(e) });
    }
  })();

  return true; // async
});
