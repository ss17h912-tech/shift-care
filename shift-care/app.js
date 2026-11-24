const STORAGE_KEY = "shift_care_reports_v2";

const reportForm = document.getElementById("reportForm");
const reportList = document.getElementById("reportList");
const filterAlertBtn = document.getElementById("filterAlertBtn");
const searchInput = document.getElementById("searchInput");
const targetDateInput = document.getElementById("targetDate");
const loadSampleBtn = document.getElementById("loadSampleBtn");

let showOnlyAlert = false;

window.addEventListener("DOMContentLoaded", () => {
  targetDateInput.value = getTodayStr();
  renderAll();
});

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getReports() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

reportForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const staffName = document.getElementById("staffName").value.trim();
  const targetDate = targetDateInput.value;
  const condition = document.getElementById("condition").value;
  const shiftRequest = document.getElementById("shiftRequest").value.trim();

  if (!staffName || !targetDate) return;

  const newReport = {
    id: Date.now().toString(),
    staffName,
    targetDate,
    condition,
    shiftRequest: shiftRequest || "特記事項なし",
    createdAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
  };

  const reports = getReports();
  reports.unshift(newReport);
  saveReports(reports);

  reportForm.reset();
  targetDateInput.value = targetDate;
  renderAll();
});

loadSampleBtn.addEventListener("click", () => {
  const today = getTodayStr();
  const samples = [
    { id: "s1", staffName: "田中 美咲", targetDate: today, condition: "良好", shiftRequest: "10:00〜16:00 勤務希望", createdAt: "08:30" },
    { id: "s2", staffName: "鈴木 健一", targetDate: today, condition: "要相談", shiftRequest: "朝から微熱あり。本日のシフト交代相談希望", createdAt: "08:45" },
    { id: "s3", staffName: "高橋 翔太", targetDate: today, condition: "やや不調", shiftRequest: "少し睡眠不足のためバックヤード作業希望", createdAt: "09:05" }
  ];
  const current = getReports();
  saveReports([...samples, ...current]);
  renderAll();
});

filterAlertBtn.addEventListener("click", () => {
  showOnlyAlert = !showOnlyAlert;
  filterAlertBtn.classList.toggle("active", showOnlyAlert);
  filterAlertBtn.textContent = showOnlyAlert ? "すべて表示に戻す" : "要確認のみ表示";
  renderAll();
});

searchInput.addEventListener("input", () => {
  renderAll();
});

function renderAll() {
  const reports = getReports();
  updateSummary(reports);
  renderList(reports);
}

function updateSummary(reports) {
  document.getElementById("countTotal").textContent = reports.length;
  document.getElementById("countGood").textContent = reports.filter(r => r.condition === "良好").length;
  document.getElementById("countCaution").textContent = reports.filter(r => r.condition === "やや不調").length;
  document.getElementById("countAlert").textContent = reports.filter(r => r.condition === "要相談").length;
}

function renderList(reports) {
  const keyword = searchInput.value.trim().toLowerCase();

  const filtered = reports.filter((item) => {
    const matchAlert = showOnlyAlert ? item.condition !== "良好" : true;
    const matchKeyword =
      !keyword ||
      item.staffName.toLowerCase().includes(keyword) ||
      item.shiftRequest.toLowerCase().includes(keyword);
    return matchAlert && matchKeyword;
  });

  if (filtered.length === 0) {
    reportList.innerHTML = `<p style="color:#64748b; font-size:0.9rem;">該当する報告データがありません。</p>`;
    return;
  }

  reportList.innerHTML = filtered
    .map((item) => {
      let statusClass = "good";
      if (item.condition === "要相談") statusClass = "alert";
      if (item.condition === "やや不調") statusClass = "caution";

      return `
        <div class="report-item ${statusClass}">
          <div>
            <div class="report-meta">${item.targetDate}（提出 ${item.createdAt}）｜体調：<strong>${item.condition}</strong></div>
            <div class="report-name">${escapeHtml(item.staffName)}</div>
            <div class="report-memo">${escapeHtml(item.shiftRequest)}</div>
          </div>
          <button type="button" class="btn-delete" onclick="deleteReport('${item.id}')">削除</button>
        </div>
      `;
    })
    .join("");
}

function deleteReport(id) {
  const reports = getReports().filter((item) => item.id !== id);
  saveReports(reports);
  renderAll();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}