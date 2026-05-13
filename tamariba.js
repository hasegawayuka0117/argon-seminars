const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];

async function loadSchedule() {
  const listEl = document.getElementById("event-list");
  try {
    const res = await fetch(`tamariba.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    render(data);
  } catch (err) {
    listEl.innerHTML = `<p class="error">スケジュールの読み込みに失敗しました。時間をおいて再度お試しください。</p>`;
    console.error(err);
  }
}

function render(data) {
  const yearEl = document.getElementById("year-meta");
  const noteEl = document.getElementById("note-meta");
  const updatedEl = document.getElementById("updated-meta");
  const listEl = document.getElementById("event-list");
  const lineGridEl = document.getElementById("line-groups-grid");

  if (data.year) yearEl.textContent = `${data.year}年`;
  if (data.note) noteEl.textContent = data.note;
  if (data.updated_at) updatedEl.textContent = `最終更新: ${data.updated_at}`;

  const events = Array.isArray(data.events) ? data.events : [];
  const sorted = events
    .filter((e) => e.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    listEl.innerHTML = `<p class="empty">スケジュールは現在準備中です。</p>`;
  } else {
    listEl.innerHTML = sorted.map(renderCard).join("");
  }

  const groups = Array.isArray(data.line_groups) ? data.line_groups : [];
  if (groups.length > 0) {
    lineGridEl.innerHTML = groups.map(renderLineGroup).join("");
  } else {
    document.getElementById("line-groups").style.display = "none";
  }
}

function renderCard(e) {
  const start = new Date(`${e.date}T00:00:00+09:00`);
  const startMonth = start.getMonth() + 1;
  const startDay = start.getDate();
  const startWeekday = WEEKDAY_JP[start.getDay()];

  let dateBlock;
  if (e.end_date) {
    const end = new Date(`${e.end_date}T00:00:00+09:00`);
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();
    const endWeekday = WEEKDAY_JP[end.getDay()];
    const sameMonth = endMonth === startMonth;
    dateBlock = `
      <div class="seminar-date seminar-date--range">
        <div class="seminar-date__month">${startMonth}月</div>
        <div class="seminar-date__range">
          <div class="seminar-date__range-part">
            <span class="seminar-date__day">${startDay}</span>
            <span class="seminar-date__weekday">${startWeekday}</span>
          </div>
          <div class="seminar-date__range-sep" aria-hidden="true">〜</div>
          <div class="seminar-date__range-part">
            ${sameMonth ? "" : `<span class="seminar-date__range-month">${endMonth}月</span>`}
            <span class="seminar-date__day">${endDay}</span>
            <span class="seminar-date__weekday">${endWeekday}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    const time = e.start_time ? `${e.start_time}〜` : "";
    dateBlock = `
      <div class="seminar-date">
        <div class="seminar-date__month">${startMonth}月</div>
        <div class="seminar-date__day">${startDay}</div>
        <div class="seminar-date__weekday">${startWeekday}曜日</div>
        ${time ? `<div class="seminar-date__time">${escapeHtml(time)}</div>` : ""}
      </div>
    `;
  }

  const locationLine = e.location ? `<p class="seminar-body__location">📍 ${escapeHtml(e.location)}</p>` : "";

  let actionBlock = "";
  if (e.signup_url) {
    const label = e.signup_label || "お申込みはこちら";
    actionBlock = `
      <div class="seminar-signup">
        <a class="seminar-signup__btn" href="${escapeAttr(e.signup_url)}" target="_blank" rel="noopener noreferrer">
          <span class="seminar-signup__btn-text">${escapeHtml(label)}</span>
          <span class="seminar-signup__btn-arrow" aria-hidden="true">→</span>
        </a>
        <a class="seminar-signup__hint" href="#line-groups">
          <span class="seminar-signup__hint-text">出席後、各エリアのLINEグループにご参加ください</span>
          <span class="seminar-signup__hint-arrow" aria-hidden="true">↓ ページ下部</span>
        </a>
      </div>
    `;
  } else if (e.signup_note) {
    actionBlock = `
      <div class="seminar-signup seminar-signup--note">
        <p class="seminar-signup__note-only">${escapeHtml(e.signup_note)}</p>
      </div>
    `;
  }

  return `
    <article class="seminar-card">
      ${dateBlock}
      <div class="seminar-body">
        <h2 class="seminar-body__title">${escapeHtml(e.title || "イベント")}</h2>
        ${locationLine}
        ${actionBlock}
      </div>
    </article>
  `;
}

function renderLineGroup(g) {
  return `
    <a class="line-group" href="${escapeAttr(g.url)}" target="_blank" rel="noopener noreferrer">
      <span class="line-group__region">${escapeHtml(g.region)}</span>
      <span class="line-group__action">グループに参加 →</span>
    </a>
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
