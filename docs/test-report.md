# 測試報告

測試日期：2026-07-19（Asia/Taipei）
環境：Windows、Python 靜態 HTTP server、Google Chrome（Playwright headless）

## 自動檢查

- `npm.cmd run check`：通過。
- 結果：6 個 HTML 頁面、60 張植物卡、20 張 IMAGE 2.0 PNG 資產。
- 內部 `href`／`src` 檔案存在性：通過。
- 占位文字掃描：通過，未發現 `待補`、`placeholder` 或 `lorem ipsum`。
- HTML 語系、教材頁籤導覽標籤：6 頁皆通過。
- Git：已初始化 `main` 分支；提交前 `git diff --cached --check` 通過。

## 瀏覽器與響應式驗證

測試頁面：`index.html`、`plants.html`、`seeds.html`、`leaves.html`、`game-one.html`、`game-two.html`。

| Viewport | 頁面數 | HTTP 200 | 主控台／頁面錯誤 | 圖片逐頁捲動後載入 | 水平溢出 |
|---|---:|---:|---:|---:|---:|
| 1440×1000 | 6 | 6/6 | 0 | 6/6 | 0 |
| 768×1024 | 6 | 6/6 | 0 | 6/6 | 0 |
| 390×844 | 6 | 6/6 | 0 | 6/6 | 0 |

初次檢查發現瀏覽器自動請求 favicon 造成一次 404；加入空資料 favicon 後，以相同 18 組頁面／viewport 完整重測，HTTP、console 與 page error 均為 0。

本次擴充後以 `scripts/browser-verify.mjs` 再次完整重測；驗證器會強制載入並解碼所有延遲載入圖片，再檢查 60 張卡、12 張植物圖版、圖片載入、標題層級與水平溢出。

## 視覺目視檢查

- 桌機：首頁封面、60 種植物首尾圖版、葉子形態、兩個活動頁與種子頁皆檢查；標題、圖像、提示框、卡片未重疊。
- 平板：導覽改為兩列配置，內容卡改為 1–2 欄；沒有水平溢出。
- 手機：導覽列可水平捲動，首頁文字改為由下方漸層承托；植物卡單欄、圖版 4:3 顯示，未裁切主要構造。
- 生成圖科學修正：茄苳欄位改為清楚的三出複葉；黑板樹果實改為成對細長蓇葖果並保留種毛提示；新增圖版目視確認五欄、無文字偽影，並呈現紅刺露兜樹葉刺、千頭木麻黃灌木型與捲斗櫟環紋殼斗。
- 圖版文字全部放在 HTML，不把生成圖內文字當作教材答案。

證據截圖位於 `docs/screenshots/`，每個頁面各保存 desktop、tablet、mobile 首屏，另保存植物頁尾端三種 viewport，共 21 張。

## 無障礙與列印

- 6 頁各有且只有 1 個 `h1`、1 個 `aria-current="page"`，無重複 ID。
- 所有內容圖片都有非空替代文字。
- 鍵盤第一次 `Tab` 會聚焦「跳到主要內容」。頁籤為原生連結，可用鍵盤操作。
- `prefers-reduced-motion: reduce` 下平滑捲動改為 `auto`，無必要動畫。
- 遊戲（一）與（二）的列印媒體樣式會隱藏導覽與活動大圖，保留可書寫的 A4 紀錄表。

## 工具替代說明

`vercel:agent-browser-verify` 指定的 `agent-browser` CLI 在本機 PATH 不存在；改用同一工作區可用的 Playwright 搭配已安裝 Google Chrome 執行等效的載入、主控台、HTTP、截圖、導航、圖片與響應式檢查。

## GitHub Pages 公開環境

- 提交 `a075f76` 推送至 `main` 後，GitHub Pages 狀態為 `built`。
- 公開網址：`https://prayer168.github.io/Plant-Detective/`；首頁、植物頁、CSS 與 4 張新增圖版均回傳 HTTP 200。
- 公開植物頁實測為 60 張不重複植物卡與 12 張圖版。
- 公開站再次通過 6 頁 × 3 viewport 共 18 組 Playwright 測試，無主控台錯誤、破圖或水平溢出。

## 已知限制

- IMAGE 2.0 圖版是教學比較示意，不可取代實物或正式植物檢索表；同一欄的花、果、成熟葉可能不是同一季節同時出現。
