// IG 抽獎腳本 - 從符合 hashtag 的評論中隨機選擇獲獎者
import path from 'path';
import { fileURLToPath } from 'url';
import { argv } from 'node:process';
import fetch from 'node-fetch';
import 'dotenv/config';

// 設定 ES Module 中的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 獎項清單
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

// 主函數
async function main() {
  try {
    // 獲取獎項數量
    const numWinners = Number(argv[2] || prizes.length);
    console.log(`將選出 ${numWinners} 位得獎者`);
    
    // 從API獲取得獎者
    const PORT = process.env.PORT || 10000;
    const apiUrl = `http://localhost:${PORT}/winners?count=${numWinners}`;
    console.log(`從 ${apiUrl} 獲取得獎者資料...`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
    }
    
    const { success, winners } = await response.json();
    if (!success || !winners || !Array.isArray(winners)) {
      throw new Error('獲取得獎者資料格式不正確');
    }
    
    if (winners.length === 0) {
      console.log('沒有符合抽獎條件的參與者。');
      return;
    }
    
    // 輸出得獎名單
    console.log('\n恭喜以下得獎者：');
    winners.forEach((winner, idx) => {
      const prize = idx < prizes.length ? prizes[idx] : { rank: idx + 1, name: '安慰獎', value: 0 };
      console.log(`第 ${prize.rank} 名: ${winner.user} (評論: ${winner.text})\n獎品: ${prize.name}${prize.value ? ` (價值: NT$${prize.value})` : ''}\n`);
    });
    
    // 輸出 JSON 格式結果
    const result = winners.map((winner, idx) => {
      const prize = idx < prizes.length ? prizes[idx] : { rank: idx + 1, name: '安慰獎', value: 0 };
      return {
        rank: prize.rank,
        user: winner.user,
        comment: winner.text,
        prize: prize.name,
        value: prize.value
      };
    });
    
    console.log('\nJSON 格式結果:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('抽獎時發生錯誤:', error);
    console.log('\n請確保後端服務已啟動，可通過以下命令啟動：');
    console.log('cd ../backend && npm start');
  }
}

main(); 