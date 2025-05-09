// IG Hashtag 抽獎系統後端
import 'dotenv/config';
import express from 'express';
import Database from 'better-sqlite3';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// 設定 ES Module 中的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 資料庫初始化
const db = new Database(path.join(__dirname, './data/comments.db'));
db.exec(`CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, 
  user TEXT, 
  text TEXT, 
  ts INTEGER
)`);

// Instagram API 常數
const IG_API = `https://graph.facebook.com/v19.0`;
const { IG_TOKEN, IG_POST_ID, PORT = 3001 } = process.env;

// 同步 Instagram 評論的函數
async function syncComments() {
  try {
    console.log('正在同步 Instagram 評論...');
    
    // 模擬 API 或使用真實 API
    // 在實際情況下，這將使用 IG_TOKEN 和 IG_POST_ID 從 Instagram API 獲取數據
    const useRealAPI = IG_TOKEN && IG_TOKEN !== 'your_instagram_token_here';
    
    if (useRealAPI) {
      // 使用真實 Instagram API
      const url = `${IG_API}/${IG_POST_ID}/comments?fields=id,text,username,timestamp&limit=100&access_token=${IG_TOKEN}`;
      let next = url;
      
      while (next) {
        const response = await fetch(next);
        const { data, paging } = await response.json();
        
        const stmt = db.prepare(`INSERT OR IGNORE INTO comments VALUES (?,?,?,?)`);
        data.forEach(c => {
          stmt.run(c.id, c.username, c.text, Date.parse(c.timestamp));
        });
        
        next = paging?.next;
      }
    } else {
      // 使用模擬數據進行開發/演示
      const mockComments = [
        { id: 'comment1', user: 'user1', text: '好漂亮的瓶子 #P', ts: Date.now() },
        { id: 'comment2', user: 'user2', text: '支持環保 #S', ts: Date.now() },
        { id: 'comment3', user: 'user3', text: '鯨魚很可愛 #K', ts: Date.now() },
        { id: 'comment4', user: 'user4', text: '我想要參加 #p', ts: Date.now() },
        { id: 'comment5', user: 'user5', text: '讚！ #s #k', ts: Date.now() },
        { id: 'comment6', user: 'user6', text: '希望能中獎 #P #S', ts: Date.now() },
        { id: 'comment7', user: 'user7', text: '支持海洋保育', ts: Date.now() },
        { id: 'comment8', user: 'user8', text: '#k 鯨豚保育很重要', ts: Date.now() },
        { id: 'comment9', user: 'user9', text: '讚讚！ #P', ts: Date.now() },
        { id: 'comment10', user: 'user10', text: '希望能抽中 #S', ts: Date.now() },
        // 新增更多模擬數據以確保有足夠的獲獎者
        { id: 'comment11', user: 'user11', text: '好想要 #P', ts: Date.now() },
        { id: 'comment12', user: 'user12', text: '支持 #S', ts: Date.now() },
        { id: 'comment13', user: 'user13', text: '鯨魚保育 #K', ts: Date.now() },
        { id: 'comment14', user: 'user14', text: '參加抽獎 #p', ts: Date.now() },
        { id: 'comment15', user: 'user15', text: '環保很重要 #s', ts: Date.now() },
        { id: 'comment16', user: 'user16', text: '海豚好可愛 #k', ts: Date.now() },
        { id: 'comment17', user: 'user17', text: '喜歡這活動 #P', ts: Date.now() },
        { id: 'comment18', user: 'user18', text: '支持海洋保育 #S', ts: Date.now() },
        { id: 'comment19', user: 'user19', text: '鯨魚是我的最愛 #K', ts: Date.now() },
        { id: 'comment20', user: 'user20', text: '想要贏 #p', ts: Date.now() },
        { id: 'comment21', user: 'user21', text: '支持 #s #k', ts: Date.now() },
        { id: 'comment22', user: 'user22', text: '參加 #P #S', ts: Date.now() },
        { id: 'comment23', user: 'user23', text: '鯨魚寶寶 #K', ts: Date.now() },
        { id: 'comment24', user: 'user24', text: '抽獎 #p', ts: Date.now() },
        { id: 'comment25', user: 'user25', text: '環保 #s', ts: Date.now() }
      ];
      
      const stmt = db.prepare(`INSERT OR IGNORE INTO comments VALUES (?,?,?,?)`);
      mockComments.forEach(c => {
        stmt.run(c.id, c.user, c.text, c.ts);
      });
    }
    
    console.log('評論同步完成');
  } catch (error) {
    console.error('同步評論時出錯:', error);
  }
}

// 啟動時同步一次評論
syncComments();

// 設定定期同步 (每分鐘)
setInterval(syncComments, 60000);

// 設定 Express 伺服器
const app = express();
app.use(cors());
app.use(express.json());

// API 路由：獲取按讚數
app.get('/likes', async (req, res) => {
  try {
    const useRealAPI = IG_TOKEN && IG_TOKEN !== 'your_instagram_token_here';
    
    if (useRealAPI) {
      // 使用真實 Instagram API
      const response = await fetch(
        `${IG_API}/${IG_POST_ID}?fields=like_count&access_token=${IG_TOKEN}`
      );
      const data = await response.json();
      res.json({ like_count: data.like_count });
    } else {
      // 使用模擬數據
      // 模擬不斷增加的按讚數 (模擬開始時間為現在)
      const startTime = new Date("2023-07-01").getTime();
      const now = new Date().getTime();
      const elapsedHours = Math.max(1, (now - startTime) / (1000 * 60 * 60));
      
      // 每小時約增加 5-15 個讚 (帶有一些隨機變化)
      const baseCount = 100; // 起始讚數
      const hourlyRate = 10; // 平均每小時增加的讚數
      const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 到 1.25 之間的隨機因子
      
      const likeCount = Math.floor(baseCount + (elapsedHours * hourlyRate * randomFactor));
      res.json({ like_count: likeCount });
    }
  } catch (error) {
    console.error('獲取按讚數時出錯:', error);
    res.status(500).json({ error: '無法獲取按讚數' });
  }
});

// API 路由：獲取所有評論 (用於測試)
app.get('/comments', (req, res) => {
  try {
    const comments = db.prepare('SELECT * FROM comments').all();
    res.json(comments);
  } catch (error) {
    console.error('獲取評論時出錯:', error);
    res.status(500).json({ error: '無法獲取評論' });
  }
});

// API 路由：獲取有效評論計數
app.get('/stats', (req, res) => {
  try {
    const HASHTAG = /#\s*(p|s|k)\b/i;
    const allComments = db.prepare('SELECT DISTINCT user, text FROM comments').all();
    const validComments = allComments.filter(c => HASHTAG.test(c.text));
    
    const hashtags = {
      p: 0,
      s: 0,
      k: 0,
      total: validComments.length
    };
    
    validComments.forEach(comment => {
      if (/#\s*p\b/i.test(comment.text)) hashtags.p++;
      if (/#\s*s\b/i.test(comment.text)) hashtags.s++;
      if (/#\s*k\b/i.test(comment.text)) hashtags.k++;
    });
    
    res.json(hashtags);
  } catch (error) {
    console.error('獲取統計數據時出錯:', error);
    res.status(500).json({ error: '無法獲取統計數據' });
  }
});

// 設定獎項
const prizes = [
  { rank: 1,  name: "灣臥海景頂級房＋輕盈美肌組", value: 10797 },
  { rank: 2,  name: "環保海龜飲料杯套＋輕盈美肌組", value: 1789 },
  { rank: 3,  name: "環保海龜飲料杯套＋美肌清潔明星組", value: 1740 },
  { rank: 4,  name: "環保海龜飲料杯套＋輕盈美肌組", value: 1789 },
  { rank: 5,  name: "ONE+ 虎鯨鑰匙圈＋美肌清潔明星組", value: 669 },
  { rank: 6,  name: "ONE+ 鯨魚鑰匙圈＋毛孔淨化組", value: 634 },
  { rank: 7,  name: "ONE+ 虎鯨鑰匙圈＋毛孔淨化組", value: 669 },
  { rank: 8,  name: "ONE+ 鯨魚鑰匙圈＋溫和洗卸組", value: 634 },
  { rank: 9,  name: "輕盈美肌組", value: 0 },
  { rank: 10, name: "輕盈美肌組", value: 0 },
  { rank: 11, name: "輕盈美肌組", value: 0 },
  { rank: 12, name: "美肌清潔明星組", value: 0 },
  { rank: 13, name: "毛孔淨化組", value: 0 },
  { rank: 14, name: "毛孔淨化組", value: 0 },
  { rank: 15, name: "溫和洗卸組", value: 0 },
  { rank: 16, name: "美肌清潔明星組", value: 0 },
  { rank: 17, name: "溫和洗卸組", value: 0 },
  { rank: 18, name: "溫和洗卸組", value: 0 },
  { rank: 19, name: "毛孔淨化組", value: 0 },
  { rank: 20, name: "毛孔淨化組", value: 0 }
];

// API 路由：獲取獎項列表
app.get('/prizes', (req, res) => {
  res.json(prizes);
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`後端服務已啟動，運行在端口 ${PORT}`);
}); 