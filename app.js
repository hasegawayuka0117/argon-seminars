const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];
const MONTH_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

async function loadSchedule() {
  const listEl = document.getElementById("seminar-list");
  try {
    const res = await fetch(`seminars.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    render(data);
  } catch (err) {
    listEl.innerHTML = `<p class="error">スケジュールの読み込みに失敗しました。時間をおいて再度お試しください。</p>`;
    console.error(err);
  }
}

let SITE_DATA = {};

function render(data) {
  SITE_DATA = data;
  const hostEl = document.getElementById("host-meta");
  const monthEl = document.getElementById("month-meta");
  const updatedEl = document.getElementById("updated-meta");
  const listEl = document.getElementById("seminar-list");

  if (data.host?.name) {
    const title = data.host.title ? `${data.host.title} ` : "";
    hostEl.textContent = `${title}${data.host.name}`;
  }

  if (data.month) {
    const [yyyy, mm] = data.month.split("-");
    const monthIdx = parseInt(mm, 10) - 1;
    if (!Number.isNaN(monthIdx)) {
      monthEl.textContent = `${MONTH_EN[monthIdx]} ${yyyy}`;
    }
  }

  if (data.updated_at) {
    updatedEl.textContent = `最終更新: ${data.updated_at}`;
  }

  const seminars = Array.isArray(data.seminars) ? data.seminars : [];
  const upcoming = seminars
    .filter((s) => s.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    listEl.innerHTML = `<p class="empty">今月の開催予定は現在準備中です。決まり次第こちらに掲載します。</p>`;
    return;
  }

  listEl.innerHTML = upcoming.map(renderCard).join("");
}

function renderCard(s) {
  const date = new Date(`${s.date}T00:00:00+09:00`);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const weekday = WEEKDAY_JP[date.getDay()];
  const time = [s.start_time, s.end_time].filter(Boolean).join("–");

  const desc = s.description ? `<p class="seminar-body__desc">${escapeHtml(s.description)}</p>` : "";

  const keywordBlock = s.keyword ? renderKeyword(s.keyword) : "";

  return `
    <article class="seminar-card">
      <div class="seminar-date">
        <div class="seminar-date__month">${month}月</div>
        <div class="seminar-date__day">${day}</div>
        <div class="seminar-date__weekday">${weekday}曜日</div>
        ${time ? `<div class="seminar-date__time">${escapeHtml(time)}</div>` : ""}
      </div>
      <div class="seminar-body">
        <h2 class="seminar-body__title">${escapeHtml(s.title || "セミナー")}</h2>
        ${desc}
        ${keywordBlock}
      </div>
    </article>
  `;
}

function renderKeyword(keyword) {
  return `
    <div class="seminar-keyword">
      <div class="seminar-keyword__label">お申込みキーワード</div>
      <button type="button" class="seminar-keyword__value" data-copy="${escapeAttr(keyword)}" title="タップでコピー">
        <span class="seminar-keyword__value-text">${escapeHtml(keyword)}</span>
        <span class="seminar-keyword__copy">タップでコピー</span>
      </button>
      <p class="seminar-keyword__note">上のキーワードをコピーし、LINEのトーク画面に送信してください。申込フォームのご案内が届きます。</p>
    </div>
  `;
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-copy]");
  if (!btn) return;
  const text = btn.getAttribute("data-copy");
  try {
    await navigator.clipboard.writeText(text);
    flashCopyState(btn, "コピーしました");
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      flashCopyState(btn, "コピーしました");
    } catch {
      flashCopyState(btn, "コピーできませんでした");
    }
    document.body.removeChild(ta);
  }
});

function flashCopyState(btn, msg) {
  const note = btn.querySelector(".seminar-keyword__copy");
  if (!note) return;
  const original = note.textContent;
  note.textContent = msg;
  btn.classList.add("is-copied");
  setTimeout(() => {
    note.textContent = original;
    btn.classList.remove("is-copied");
  }, 1600);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}

loadSchedule();
