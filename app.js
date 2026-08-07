const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];
const MONTH_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const BRANDS = {
  tamariba: { label: "サロンのたまり場", logo: "assets/tamariba-logo.png" }
};

async function loadSchedule() {
  const listEl = document.getElementById("seminar-list");
  try {
    const res = await fetch(`seminars.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // たまり場は年間スケジュール（tamariba.json）が正。今月分だけ取り込んで一緒に並べる。
    // 読み込めなくても月次ページは表示できるようにする。
    let tamariba = null;
    try {
      const tRes = await fetch(`tamariba.json?v=${Date.now()}`, { cache: "no-store" });
      if (tRes.ok) tamariba = await tRes.json();
    } catch (e) {
      console.warn("tamariba.json を読み込めませんでした", e);
    }
    render(data, tamariba);
  } catch (err) {
    listEl.innerHTML = `<p class="error">スケジュールの読み込みに失敗しました。時間をおいて再度お試しください。</p>`;
    console.error(err);
  }
}

let SITE_DATA = {};

function render(data, tamariba) {
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

  const seminars = (Array.isArray(data.seminars) ? data.seminars : []).filter((s) => s.date);
  const upcoming = mergeTamariba(seminars, tamariba, data.month)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    const msg = data.empty_message || "今月の開催予定は現在準備中です。決まり次第こちらに掲載します。";
    listEl.innerHTML = `<p class="empty">${escapeHtml(msg)}</p>`;
    return;
  }

  listEl.innerHTML = upcoming.map(renderCard).join("");
}

// 同じイベントが seminars.json にも書かれている場合の重複よけ
function eventKey(e) {
  return e.signup_url ? `url:${e.signup_url}` : `dt:${e.date}|${e.title || ""}`;
}

function mergeTamariba(seminars, tamariba, month) {
  if (!month || !tamariba || !Array.isArray(tamariba.events)) return seminars;

  const seen = new Set(seminars.map(eventKey));
  const sameDateBrandTamariba = new Set(
    seminars.filter((s) => s.brand === "tamariba").map((s) => s.date)
  );

  const monthly = tamariba.events
    .filter((e) => e.date && e.date.startsWith(month))
    .map((e) => ({ ...e, brand: "tamariba" }))
    .filter((e) => !seen.has(eventKey(e)) && !sameDateBrandTamariba.has(e.date));

  return seminars.concat(monthly);
}

function renderCard(s) {
  const start = new Date(`${s.date}T00:00:00+09:00`);
  const startMonth = start.getMonth() + 1;
  const startDay = start.getDate();
  const startWeekday = WEEKDAY_JP[start.getDay()];

  let dateBlock;
  if (s.end_date) {
    const end = new Date(`${s.end_date}T00:00:00+09:00`);
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
    let time = "";
    if (s.start_time && s.end_time) time = `${s.start_time}–${s.end_time}`;
    else if (s.start_time) time = `${s.start_time}〜`;
    dateBlock = `
      <div class="seminar-date">
        <div class="seminar-date__month">${startMonth}月</div>
        <div class="seminar-date__day">${startDay}</div>
        <div class="seminar-date__weekday">${startWeekday}曜日</div>
        ${time ? `<div class="seminar-date__time">${escapeHtml(time)}</div>` : ""}
      </div>
    `;
  }

  const brand = BRANDS[s.brand];
  const brandBadge = brand
    ? `<span class="seminar-brand">
         <img class="seminar-brand__logo" src="${escapeAttr(brand.logo)}" alt="" aria-hidden="true" />
         <span class="seminar-brand__text">${escapeHtml(brand.label)}</span>
       </span>`
    : "";

  const locationLine = s.location ? `<p class="seminar-body__location">📍 ${escapeHtml(s.location)}</p>` : "";
  const desc = s.description ? `<p class="seminar-body__desc">${escapeHtml(s.description)}</p>` : "";

  let actionBlock = "";
  if (s.signup_url) {
    actionBlock = renderSignup(s.signup_url, s.signup_label);
  } else if (s.signup_note) {
    actionBlock = `
      <div class="seminar-signup seminar-signup--note">
        <p class="seminar-signup__note-only">${escapeHtml(s.signup_note)}</p>
      </div>
    `;
  }

  return `
    <article class="seminar-card">
      ${dateBlock}
      <div class="seminar-body">
        ${brandBadge}
        <h2 class="seminar-body__title">${escapeHtml(s.title || "イベント")}</h2>
        ${locationLine}
        ${desc}
        ${actionBlock}
      </div>
    </article>
  `;
}

function renderSignup(url, label) {
  const btnText = label || "お申込みフォームへ";
  return `
    <div class="seminar-signup">
      <div class="seminar-signup__label">お申込みはこちら</div>
      <a class="seminar-signup__btn" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">
        <span class="seminar-signup__btn-text">${escapeHtml(btnText)}</span>
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
