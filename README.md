# Seminar Site — 門脇篤志セミナースケジュール

門脇さんのセミナー開催予定を月次で公開する静的サイト。GitHub Pages で配信する想定。

## 構成

```
seminar-site/
├── index.html       # ページ本体
├── styles.css       # デザイン
├── app.js           # seminars.json を読み込んで描画
├── seminars.json    # ← 毎月ここを更新するだけ
└── README.md
```

## 月次更新フロー

1. 長谷川さんが Slack でゼノに「次月のセミナー予定」をテキストで送る
2. ゼノが `seminars.json` を更新（`month` と `updated_at` も同時更新）
3. 公開リポジトリへ push → GitHub Pages が自動デプロイ

### seminars.json の形式

```json
{
  "month": "2026-06",
  "updated_at": "2026-05-12",
  "host": {
    "name": "門脇 篤志",
    "title": "Argonグループ 代表"
  },
  "seminars": [
    {
      "date": "2026-06-01",
      "start_time": "20:00",
      "end_time": "21:30",
      "title": "6月セミナー",
      "description": "オープン前に集客75人・求人応募6人。ノウハウ大公開。",
      "keyword": "6月セミナー"
    }
  ]
}
```

- `keyword`: 顧客がLINEで送信する申込キーワード（カードに表示、タップでコピー可）
- `description` / `end_time` は省略可
- `date` は `YYYY-MM-DD`（JST想定）。表示は `date` 昇順に自動ソート

### 申込フロー（顧客側）

サイトはLINE公式アカウントのリッチメニューから開かれる前提。

1. リッチメニューからサイトを開く
2. セミナーカードの「お申込みキーワード」をタップしてコピー
3. LINEのトーク画面に貼り付けて送信 → 自動応答で申込フォームが届く
4. 申込完了後、Zoom URL等の詳細が送られる（サイトには非掲載）

## ローカルプレビュー

```bash
cd seminar-site
python3 -m http.server 8765
# → http://localhost:8765/
```

## デプロイ（GitHub Pages）

公開用リポジトリの設定で：
- Settings → Pages → Source: `Deploy from a branch`
- Branch: `main` / `(root)` または `/seminar-site`
