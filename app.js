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

  const signupBlock = s.signup_url ? renderSignup(s.signup_url) : "";

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
        ${signupBlock}
      </div>
    </article>
  `;
}

function renderSignup(url) {
  return `
    <div class="seminar-signup">
      <div class="seminar-signup__label">お申込みはこちら</div>
      <a class="seminar-signup__btn" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">
        <span class="seminar-signup__btn-text">お申込みフォームへ</span>
        <span class="seminar-signup__btn-arrow" aria-hidden="true">→</span>
      </a>
      <p class="seminar-signup__note">上のボタンをタップすると、お申込みフォームが開きます。</p>
    </div>
  `;
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
