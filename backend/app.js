// IG Hashtag 抽獎系統後端
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// 引入數據庫連接和模型
import connectDB from './models/db.js';
import Comment from './models/Comment.js';
import LikeRecord from './models/LikeRecord.js';

// 連接到MongoDB
connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 環境變數 - 使用提供的令牌和ID
const FB_API = `https://graph.facebook.com/v19.0`;
// 使用新的長期令牌，有效期至 7/8/2025
const IG_TOKEN = process.env.IG_TOKEN || "EAAZABZBFyTPjUBO81GfrzZBLej4EhHFZAL2a996JziCFuybnEehqSKMJnee7aRcBJE0j2saqWZCQb22ydzx6ysul8dyaJ0sh6sTV0SC10PhDHh7FVqNyMkjfYAaDyOncZAPsiqX7aqhacRvKZAuJb4w5YjIvwgvy7wdSqbouJtecOkSdZBCKPuywEx51cI93qPvKkrZBdJOZBZA";
const IG_USER_ID = process.env.IG_USER_ID || "17841474086492936"; // 正確的Instagram帳號ID
const IG_POST_ID = process.env.IG_POST_ID || "18079076146744868"; // 正確的Instagram貼文ID
const PORT = process.env.PORT || 10000; // 支援Render環境變數

// 同步 Instagram 評論
async function syncComments() {
  console.log('開始同步 Instagram 評論...');
  try {
    if (!IG_TOKEN) {
      console.log('警告: 未設定 IG_TOKEN 環境變數');
      return;
    }

    if (!IG_POST_ID) {
      console.log('警告: 未找到有效的貼文ID');
      return;
    }

    const url = `${FB_API}/${IG_POST_ID}/comments?fields=id,text,username,timestamp,from&limit=100&access_token=${IG_TOKEN}`;
    console.log(`正在從 ${url} 獲取評論...`);
    let next = url;
    let count = 0;

    while (next) {
      const response = await fetch(next);
      
      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
      }
      
      const { data, paging } = await response.json();
      
      if (!data || !Array.isArray(data)) {
        console.log('警告: 無法獲取評論資料', data);
        break;
      }

      // 將新評論添加到MongoDB中
      for (const c of data) {
        try {
          await Comment.findOneAndUpdate(
            { id: c.id }, 
            {
              id: c.id,
              user: c.username || c.from?.name || 'unknown',
              text: c.text,
              ts: Date.parse(c.timestamp)
            },
            { upsert: true, new: true }
          );
          count++;
        } catch (error) {
          console.error(`儲存評論 ${c.id} 時出錯:`, error);
        }
      }
      
      next = paging?.next;
    }
    
    console.log(`同步完成! 已處理 ${count} 則評論`);
    
  } catch (error) {
    console.error('同步評論時發生錯誤:', error);
  }
}

// 同步 Instagram 讚數並記錄變化
async function syncLikes() {
  console.log('開始同步 Instagram 按讚數...');
  try {
    if (!IG_TOKEN) {
      console.log('警告: 未設定 IG_TOKEN 環境變數');
      return;
    }

    if (!IG_POST_ID) {
      console.log('警告: 未找到有效的貼文ID');
      return;
    }

    const url = `${FB_API}/${IG_POST_ID}?fields=like_count&access_token=${IG_TOKEN}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const currentLikeCount = data.like_count || 0;
    const currentTime = new Date();
    const dateString = `${currentTime.getMonth() + 1}/${currentTime.getDate()}`;
    
    // 檢查是否有前一筆記錄
    const previousRecord = await LikeRecord.findOne({ postId: IG_POST_ID }).sort({ timestamp: -1 });
    
    // 只有當讚數增加時才記錄
    if (!previousRecord || currentLikeCount > previousRecord.count) {
      const newLikes = previousRecord ? currentLikeCount - previousRecord.count : currentLikeCount;
      
      // 將新的讚數變化和時間加入歷史記錄
      await LikeRecord.create({
        count: currentLikeCount,
        newLikes: newLikes,
        date: dateString,
        timestamp: currentTime,
        postId: IG_POST_ID
      });
      
      console.log(`讚數更新: ${currentLikeCount} (新增 ${newLikes} 個讚), 時間: ${currentTime.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('同步讚數時發生錯誤:', error);
  }
}

// 定期同步評論
setInterval(syncComments, 60000); // 每分鐘同步一次
syncComments(); // 初始同步

// 定期同步讚數
setInterval(syncLikes, 60000); // 每分鐘同步一次
syncLikes(); // 初始同步

// 設定 Express
const app = express();
// 加強 CORS 配置，解決前端跨域問題
app.use(cors({
  origin: '*', // 允許所有來源訪問
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept',
    'Origin',
    'Cache-Control',
    'X-Auth-Token',
    'Access-Control-Allow-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json());

// API 端點
app.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.find({});
    res.json({ success: true, comments });
  } catch (error) {
    console.error('獲取評論時發生錯誤:', error);
    res.status(500).json({ success: false, error: '伺服器內部錯誤' });
  }
});

app.get('/likes', async (req, res) => {
  try {
    let likeCount = 0;
    
    // 直接從指定的貼文ID獲取按讚數
    if (IG_POST_ID) {
      const response = await fetch(`${FB_API}/${IG_POST_ID}?fields=like_count&access_token=${IG_TOKEN}`);
      
      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      likeCount = data.like_count || 0;
    }

    res.json({ success: true, like_count: likeCount });
  } catch (error) {
    console.error('獲取按讚數時發生錯誤:', error);
    res.json({ success: true, like_count: 0 });
  }
});

// 提供每日捐款數據的 API 端點 - 使用真實Instagram數據和記錄的讚數變化
app.get('/api/daily-donations', async (req, res) => {
  try {
    // 獲取最新的讚數
    let likeCount = 0;
    const latestRecord = await LikeRecord.findOne({ postId: IG_POST_ID }).sort({ timestamp: -1 });
    
    if (latestRecord) {
      likeCount = latestRecord.count;
    } else {
      // 如果還沒有歷史記錄，嘗試直接從API獲取
      try {
        const likeResponse = await fetch(`${FB_API}/${IG_POST_ID}?fields=like_count&access_token=${IG_TOKEN}`);
        
        if (!likeResponse.ok) {
          throw new Error(`API 錯誤: ${likeResponse.status} ${likeResponse.statusText}`);
        }
        
        const likeData = await likeResponse.json();
        likeCount = likeData.like_count || 0;
        console.log('獲取到真實按讚數:', likeCount);
      } catch (error) {
        console.error('獲取按讚數時發生錯誤:', error);
        return res.status(500).json({ success: false, error: '無法獲取Instagram數據' });
      }
    }
    
    // 根據實際記錄的數據生成每日數據
    const today = new Date();
    const dailyData = [];
    
    // 嘗試從MongoDB中獲取所有讚數歷史記錄
    const likeRecords = await LikeRecord.find({ postId: IG_POST_ID }).sort({ timestamp: 1 });
    
    if (likeRecords.length > 0) {
      // 使用記錄的歷史數據構建日期分佈
      // 先按日期分組，合併同一天的讚數
      const groupedByDate = {};
      
      for (const record of likeRecords) {
        if (!groupedByDate[record.date]) {
          groupedByDate[record.date] = 0;
        }
        groupedByDate[record.date] += record.newLikes;
      }
      
      // 轉換成數組形式
      for (const date in groupedByDate) {
        dailyData.push({
          date: date,
          amount: groupedByDate[date]
        });
      }
      
      // 如果歷史記錄不足14天，補充前面的日期
      const recordedDays = Object.keys(groupedByDate).length;
      if (recordedDays < 14) {
        // 計算要補充的天數
        const daysToAdd = 14 - recordedDays;
        const earliestDate = new Date(today);
        earliestDate.setDate(today.getDate() - 13); // 14天前
        
        // 補充缺失的日期
        for (let i = 0; i < daysToAdd; i++) {
          const date = new Date(earliestDate);
          date.setDate(earliestDate.getDate() + i);
          
          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
          
          // 檢查這個日期是否已存在於數據中
          if (!groupedByDate[formattedDate]) {
            dailyData.push({
              date: formattedDate,
              amount: 0
            });
          }
        }
      }
      
      // 按日期排序
      dailyData.sort((a, b) => {
        const [aMonth, aDay] = a.date.split('/').map(Number);
        const [bMonth, bDay] = b.date.split('/').map(Number);
        
        if (aMonth !== bMonth) {
          return aMonth - bMonth;
        }
        return aDay - bDay;
      });
      
    } else {
      // 如果沒有歷史記錄，則使用生成的數據
      // 確保總和等於真實按讚數
      const dailyAverage = Math.ceil(likeCount / 14); // 平均每日的按讚數
      let remaining = likeCount;
      
      // 生成過去13天和今天的數據
      for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // 格式化日期為 MM/DD 格式
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        
        let amount = 0;
        
        if (i === 0) {
          // 今天的數值是剩餘的所有按讚數，確保至少有1個
          amount = Math.max(1, remaining);
        } else {
          // 數值呈現成長趨勢，但確保今天有按讚數
          const growth = 1 + ((13 - i) / 13); // 成長係數，從1到2
          amount = Math.min(Math.floor(dailyAverage * growth * 0.4), remaining);
          remaining -= amount;
        }
        
        dailyData.push({
          date: formattedDate,
          amount: amount
        });
      }
    }
    
    // 計算累計總額
    let cumulativeTotal = 0;
    const cumulativeData = dailyData.map(day => {
      cumulativeTotal += day.amount;
      return {
        ...day,
        total: cumulativeTotal
      };
    });
    
    res.json({ 
      success: true, 
      totalLikes: likeCount,
      dailyData: cumulativeData 
    });
  } catch (error) {
    console.error('獲取每日捐款數據時發生錯誤:', error);
    res.status(500).json({ success: false, error: '伺服器內部錯誤' });
  }
});

// 獲取讚數歷史記錄的API端點
app.get('/api/likes-history', async (req, res) => {
  try {
    const history = await LikeRecord.find({ postId: IG_POST_ID }).sort({ timestamp: 1 });
    res.json({ 
      success: true, 
      history 
    });
  } catch (error) {
    console.error('獲取讚數歷史記錄時發生錯誤:', error);
    res.status(500).json({ success: false, error: '伺服器內部錯誤' });
  }
});

// 兼容舊路徑的捐款數據API
app.get('/daily-donations', async (req, res) => {
  try {
    // 轉發到新API端點
    const response = await new Promise((resolve) => {
      app._router.handle({ 
        url: '/api/daily-donations', 
        method: 'GET' 
      }, {
        json: resolve,
        status: () => ({ json: resolve })
      }, () => {});
    });
    
    res.json(response);
  } catch (error) {
    console.error('獲取每日捐款數據時發生錯誤:', error);
    res.status(500).json({ success: false, error: '伺服器內部錯誤' });
  }
});

app.get('/winners', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;
    // 更新正則表達式以匹配帶空格和不區分大小寫的標籤
    const HASHTAG = /\s*#\s*[psk]\b/i;
    
    // 從MongoDB獲取所有評論
    const allComments = await Comment.find({});
    
    const uniqueUsers = new Map();
    allComments.forEach(comment => {
      if (HASHTAG.test(comment.text) && !uniqueUsers.has(comment.user)) {
        uniqueUsers.set(comment.user, comment);
      }
    });

    const validComments = Array.from(uniqueUsers.values());
    
    const winners = [];
    const tempComments = [...validComments]; // 複製陣列以便修改
    
    while (winners.length < count && tempComments.length) {
      const idx = Math.floor(Math.random() * tempComments.length);
      winners.push(tempComments.splice(idx, 1)[0]);
    }
    
    res.json({ success: true, winners });
  } catch (error) {
    console.error('選擇得獎者時發生錯誤:', error);
    res.status(500).json({ success: false, error: '伺服器內部錯誤' });
  }
});

// 手動刷新數據端點
app.get('/refresh', async (req, res) => {
  try {
    await syncComments();
    await syncLikes();
    res.json({ success: true, message: '數據已更新' });
  } catch (error) {
    console.error('手動刷新時發生錯誤:', error);
    res.status(500).json({ success: false, error: '伺服器內部錯誤' });
  }
});

// 獲取Instagram資訊端點
app.get('/instagram-info', async (req, res) => {
  try {
    // 獲取媒體列表
    const mediaUrl = `${FB_API}/${IG_USER_ID}/media?fields=id,caption,permalink,like_count,comments_count&access_token=${IG_TOKEN}`;
    const mediaResponse = await fetch(mediaUrl);
    
    if (!mediaResponse.ok) {
      throw new Error(`媒體列表API錯誤: ${mediaResponse.status}`);
    }
    
    const mediaData = await mediaResponse.json();
    
    // 尋找目標貼文
    let targetPost = null;
    if (mediaData.data && mediaData.data.length > 0) {
      for (const post of mediaData.data) {
        if (post.id === IG_POST_ID) {
          targetPost = post;
          break;
        }
      }
    }
    
    res.json({ 
      success: true, 
      instagramAccount: IG_USER_ID,
      mediaCount: mediaData.data?.length || 0,
      targetPost
    });
  } catch (error) {
    console.error('獲取Instagram資訊時發生錯誤:', error);
    res.status(500).json({ success: false, error: '伺服器內部錯誤' });
  }
});

// 狀態檢查端點
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 如果指定了靜態資源目錄，提供靜態文件
const STATIC_DIR = path.join(__dirname, '../frontend/out');
app.use(express.static(STATIC_DIR));

// 新增路由：獲取所有帶有hashtag的評論
app.get('/comments', async (req, res) => {
  try {
    // 從MongoDB獲取所有評論
    const allComments = await Comment.find({});
    
    // 篩選出帶有hashtag的評論
    const hashtagComments = allComments.filter(comment => {
      const text = comment.text.toLowerCase();
      return /\s*#\s*p\b/i.test(text) || /\s*#\s*s\b/i.test(text) || /\s*#\s*k\b/i.test(text);
    }).map(comment => ({
      id: comment.id,
      user: comment.user,
      username: comment.user.replace(/\s+/g, '').toLowerCase(), // 從用戶名生成username，去除空格並轉小寫
      text: comment.text,
      timestamp: comment.ts,
      verified: comment.verified || false
    }));
    
    res.json({ 
      comments: hashtagComments,
      total: hashtagComments.length
    });
  } catch (error) {
    console.error('獲取評論時出錯:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
});

// 更新評論驗證狀態
app.post('/comments/verify', async (req, res) => {
  try {
    const { commentId, verified } = req.body;
    
    if (!commentId) {
      return res.status(400).json({ error: '缺少評論ID' });
    }
    
    const comment = await Comment.findOne({ id: commentId });
    
    if (!comment) {
      return res.status(404).json({ error: '找不到指定評論' });
    }
    
    comment.verified = !!verified;
    await comment.save();
    
    res.json({ success: true, comment });
  } catch (error) {
    console.error('更新評論驗證狀態時出錯:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
});

// 新增路由：從特定用戶ID列表中抽獎
app.post('/winners-custom', async (req, res) => {
  try {
    const { count = 18, verifiedUserIds = [] } = req.body;
    
    // 驗證請求參數
    if (!Array.isArray(verifiedUserIds) || verifiedUserIds.length === 0) {
      return res.status(400).json({ error: '未提供有效的用戶ID列表' });
    }
    
    // 從MongoDB獲取所有評論
    const allComments = await Comment.find({ id: { $in: verifiedUserIds } });
    
    // 過濾出有hashtag的評論
    const verifiedComments = allComments.filter(comment => 
      /\s*#\s*p\b/i.test(comment.text.toLowerCase()) || 
      /\s*#\s*s\b/i.test(comment.text.toLowerCase()) || 
      /\s*#\s*k\b/i.test(comment.text.toLowerCase())
    );
    
    // 確認有足夠的評論可供抽獎
    if (verifiedComments.length < count) {
      return res.status(400).json({ 
        error: `合格的用戶不足，需要 ${count} 人但只有 ${verifiedComments.length} 人符合條件` 
      });
    }
    
    // 隨機抽取獲獎者
    const shuffled = [...verifiedComments].sort(() => 0.5 - Math.random());
    const selectedWinners = shuffled.slice(0, count);
    
    // 格式化回傳結果
    const winners = selectedWinners.map(comment => ({
      id: comment.id,
      user: comment.user,
      text: comment.text,
      timestamp: comment.ts
    }));
    
    res.json({ winners });
  } catch (error) {
    console.error('執行自定義抽獎時出錯:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
});

// 啟動服務
app.listen(PORT, () => {
  console.log(`伺服器已啟動在 http://localhost:${PORT}`);
  console.log(`Instagram 用戶 ID: ${IG_USER_ID}`);
  console.log(`Instagram 貼文 ID: ${IG_POST_ID}`);
}); 