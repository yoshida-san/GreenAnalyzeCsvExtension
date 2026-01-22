function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normalizeText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function cellText(cell) {
  const tips = cell.querySelectorAll(".tips-area");
  if (tips.length === 0) return normalizeText(cell.textContent);
  const clone = cell.cloneNode(true);
  clone.querySelectorAll(".tips-area").forEach(node => node.remove());
  return normalizeText(clone.textContent);
}

function tableTo2D(table) {
  const rows = [...table.querySelectorAll("tr")];
  return rows.map(tr =>
    [...tr.querySelectorAll("th,td")].map(td => cellText(td))
  );
}

function pickAnalyzeTable() {
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
      reject(new Error("テーブルが見つかりません。表示してから再度お試しください。"));
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
  if (!table) throw new Error("テーブルが見つかりません。表示してから再度お試しください。");

  const data2d = tableTo2D(table);
  const excludeSummary = options.excludeSummary === true;
  const summaryLabels = new Set(["合計", "平均", "平均利用率"]);
  const filtered2d = excludeSummary
    ? data2d.filter((row, idx) => {
        if (idx === 0) return true; // header
        const label = (row?.[0] ?? "").trim();
        return !summaryLabels.has(label);
      })
    : data2d;
  const { from, to, jobType, activeTab } = getMeta();

  const includeMeta = options.excludeMeta !== true;
  const metaLines = [
    ["# period_from", from],
    ["# period_to", to],
    ["# job_type", jobType],
    ["# tab", activeTab]
  ].map(cols => cols.map(csvEscape).join(","));

  const csvLines = filtered2d.map(row => row.map(csvEscape).join(","));
  return includeMeta ? [...metaLines, ...csvLines].join("\n") : csvLines.join("\n");
}

function buildXlsx(options = {}) {
  if (typeof XLSX === "undefined") throw new Error("XLSXライブラリが読み込まれていません。");
  const table = pickAnalyzeTable();
  if (!table) throw new Error("テーブルが見つかりません。表示してから再度お試しください。");

  const data2d = tableTo2D(table);
  const excludeSummary = options.excludeSummary === true;
  const summaryLabels = new Set(["合計", "平均", "平均利用率"]);
  const filtered2d = excludeSummary
    ? data2d.filter((row, idx) => {
        if (idx === 0) return true; // header
        const label = (row?.[0] ?? "").trim();
        return !summaryLabels.has(label);
      })
    : data2d;
  const { from, to, jobType, activeTab } = getMeta();
  const includeMeta = options.excludeMeta !== true;
  const rows = includeMeta
    ? [
        ["# period_from", from],
        ["# period_to", to],
        ["# job_type", jobType],
        ["# tab", activeTab],
        ...filtered2d
      ]
    : filtered2d;

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Analyze");
  return XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
}

function buildFilename(extension) {
  const { from, to, activeTab } = getMeta();
  const tabKey = activeTab.includes("求職者からのアプローチ") ? "approach_from_jobseeker"
               : activeTab.includes("貴社からのアプローチ") ? "approach_from_company"
               : activeTab.includes("応募") ? "apply"
               : activeTab.includes("アプローチ") ? "approach"
               : "analyze";
  const f = (from || "").replaceAll("/", "");
  const t = (to || "").replaceAll("/", "");
  return `green_${tabKey}_${f}-${t}.${extension}`;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.action !== "download") {
        sendResponse({ ok: false, error: "unknown action" });
        return;
      }

      await waitForTable();
      const format = msg?.options?.format === "xlsx" ? "xlsx" : "csv";
      const filename = buildFilename(format);
      const res =
        format === "xlsx"
          ? await chrome.runtime.sendMessage({
              type: "download_file",
              filename,
              mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              data: buildXlsx(msg?.options ?? {}),
              isBase64: true
            })
          : await chrome.runtime.sendMessage({
              type: "download_file",
              filename,
              mime: "text/csv",
              data: buildCsv(msg?.options ?? {}),
              isBase64: false
            });

      if (!res?.ok) throw new Error(res?.error ?? "ダウンロードに失敗しました。");

      sendResponse({ ok: true, filename });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message ?? String(e) });
    }
  })();

  return true; // async
});
