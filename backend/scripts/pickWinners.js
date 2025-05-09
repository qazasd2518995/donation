// IG 抽獎腳本 - 從符合 hashtag 的評論中隨機選擇獲獎者
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// 設定 ES Module 中的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 獲取命令行參數 (獲獎人數)
const args = process.argv.slice(2);
const numWinners = parseInt(args[0]) || 20; // 預設為 20 個獲獎者

// 連接到資料庫
const db = new Database(path.join(__dirname, '../data/comments.db'), { readonly: true });

// 從資料庫中獲取所有有效評論
const HASHTAG = /#\s*(p|s|k)\b/i;
const allComments = db.prepare(`SELECT DISTINCT user, text FROM comments`).all();
const validComments = allComments.filter(c => HASHTAG.test(c.text));

console.log(`找到 ${validComments.length} 條有效評論 (含有標籤 #P, #S 或 #K)`);
console.log(`從中隨機選擇 ${numWinners} 名獲獎者...\n`);

// 檢查是否有足夠的評論
if (validComments.length < numWinners) {
  console.warn(`警告：有效評論數 (${validComments.length}) 少於請求的獲獎者數量 (${numWinners})`);
  console.warn(`將使用所有有效評論作為獲獎者。\n`);
}

// 隨機選擇獲獎者
const winners = [];
const validPool = [...validComments]; // 複製一份，這樣可以從中移除已選的評論

while (winners.length < numWinners && validPool.length > 0) {
  const randomIndex = Math.floor(Math.random() * validPool.length);
  const winner = validPool.splice(randomIndex, 1)[0];
  winners.push(winner);
}

// 獲取獎項列表
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

// 輸出結果
console.log('🎉 獲獎名單 🎉');
console.log('========================');

winners.forEach((winner, index) => {
  if (index < prizes.length) {
    const prize = prizes[index];
    const hashtags = [];
    if (/#\s*p\b/i.test(winner.text)) hashtags.push('#P');
    if (/#\s*s\b/i.test(winner.text)) hashtags.push('#S');
    if (/#\s*k\b/i.test(winner.text)) hashtags.push('#K');
    
    console.log(`第 ${prize.rank} 名: ${winner.user}`);
    console.log(`評論: ${winner.text}`);
    console.log(`標籤: ${hashtags.join(', ')}`);
    console.log(`獎品: ${prize.name}`);
    if (prize.value > 0) {
      console.log(`價值: NT$ ${prize.value}`);
    }
    console.log('------------------------');
  }
});

// 輸出 JSON 格式的結果 (可用於其他程式)
const result = winners.map((winner, index) => {
  const hashtags = [];
  if (/#\s*p\b/i.test(winner.text)) hashtags.push('#P');
  if (/#\s*s\b/i.test(winner.text)) hashtags.push('#S');
  if (/#\s*k\b/i.test(winner.text)) hashtags.push('#K');
  
  return {
    rank: index + 1,
    user: winner.user,
    text: winner.text,
    hashtags,
    prize: index < prizes.length ? prizes[index].name : null,
    value: index < prizes.length ? prizes[index].value : 0
  };
});

// 輸出 JSON 格式 (可以重定向到檔案 > winners.json)
// console.log(JSON.stringify(result, null, 2));

// 關閉資料庫連接
db.close(); 