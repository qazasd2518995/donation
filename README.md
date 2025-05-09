# 鯨豚協會捐款系統

這是為台灣鯨豚協會設計的Instagram捐款儀表板和抽獎系統。系統根據特定Instagram貼文的按讚數量計算捐款金額（1讚 = 1元新台幣），並從帶有特定hashtag的評論中抽取獲獎者。

## 功能特點

- 即時顯示Instagram貼文按讚數和對應捐款金額
- 捐款趨勢圖表顯示
- 從標記#P/#S/#K的評論中隨機抽選18名獲獎者
- 管理員可確認用戶是否追蹤官方帳號
- 支援大小寫不敏感的hashtag檢測
- 使用MongoDB持久化存儲評論和按讚記錄

## 技術架構

- 前端：Next.js + React + Tailwind CSS + Framer Motion
- 後端：Node.js + Express
- 數據庫：MongoDB Atlas
- API：Facebook Graph API (Instagram)
- 部署：Render

## 設置說明

### MongoDB Atlas設置

1. 在 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 創建免費帳號
2. 建立新集群
3. 創建數據庫用戶並設置密碼
4. 在"Network Access"中添加IP地址(0.0.0.0/0允許所有IP訪問)
5. 獲取連接字符串，格式如：`mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority`
6. 將連接字符串添加到後端的`.env`文件中的`MONGODB_URI`變數

### 環境變數

後端需要以下環境變數:

```
# Instagram API設定
IG_TOKEN=<您的Instagram長期存取令牌>
IG_USER_ID=<您的Instagram用戶ID>
IG_POST_ID=<您要追蹤的貼文ID>

# 服務設定
PORT=10000

# MongoDB設定
MONGODB_URI=<您的MongoDB連接字符串>
```

## 本地開發

### 後端

```bash
cd backend
npm install
# 確保先設置.env文件
node app.js
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 部署

本專案使用Render進行部署，render.yaml文件已配置好服務定義。請確保在Render環境中設置所有必要的環境變數。

## 授權

MIT License 