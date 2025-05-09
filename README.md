# 鯨豚協會捐款系統

這是為台灣鯨豚協會設計的Instagram捐款儀表板和抽獎系統。系統根據特定Instagram貼文的按讚數量計算捐款金額（1讚 = 1元新台幣），並從帶有特定hashtag的評論中抽取獲獎者。

## 功能特點

- 即時顯示Instagram貼文按讚數和對應捐款金額
- 捐款趨勢圖表顯示
- 從標記#P/#S/#K的評論中隨機抽選18名獲獎者
- 管理員可確認用戶是否追蹤官方帳號
- 支援大小寫不敏感的hashtag檢測

## 技術架構

- 前端：Next.js + React + Tailwind CSS + Framer Motion
- 後端：Node.js + Express
- API：Facebook Graph API (Instagram)
- 部署：Render

## 本地開發

### 後端

```bash
cd backend
npm install
node app.js
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 部署

本專案使用Render進行部署，render.yaml文件已配置好服務定義。

## 授權

MIT License 