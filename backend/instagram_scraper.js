import puppeteer from 'puppeteer';

/**
 * Instagram爬蟲類
 */
class InstagramScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.cache = {
      comments: [],
      likeCount: 0,
      lastUpdate: 0
    };
    this.cacheValidityPeriod = 5 * 60 * 1000; // 5分鐘快取有效期
  }
  
  /**
   * 初始化瀏覽器
   */
  async init() {
    if (this.browser) return;
    
    console.log('啟動瀏覽器...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    this.page = await this.browser.newPage();
    
    // 設置視窗大小
    await this.page.setViewport({ width: 1280, height: 800 });
    
    // 模擬手機設備 (在某些情況下可能更容易爬取)
    await this.page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/85.0.4183.109 Mobile/15E148 Safari/604.1');
    
    // 添加自定義的等待函數
    this.page.waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // 添加自定義XPath函數
    this.page.evalXPath = async (xpath) => {
      return await this.page.evaluate((path) => {
        const elements = [];
        const xpathResult = document.evaluate(
          path, 
          document, 
          null, 
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
          null
        );
        
        for (let i = 0; i < xpathResult.snapshotLength; i++) {
          elements.push(xpathResult.snapshotItem(i));
        }
        return elements.length;
      }, xpath);
    };
    
    // 擴展page對象添加findElementsByText方法，代替:contains選擇器
    this.page.findElementsByText = async (text) => {
      return await this.page.evaluate((searchText) => {
        const elements = [];
        const walk = (node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(searchText)) {
            elements.push(node.parentNode);
          } else {
            for (const child of node.childNodes) {
              walk(child);
            }
          }
        };
        walk(document.body);
        return elements.map(el => el.outerHTML);
      }, text);
    };
  }
  
  /**
   * 登錄Instagram（可選）
   */
  async login(username, password) {
    if (this.isLoggedIn) return;
    if (!username || !password) return;
    
    try {
      await this.init();
      console.log('嘗試登入Instagram...');
      
      await this.page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });
      
      // 處理可能的cookie彈窗
      try {
        await this.page.waitForSelector('button[type="button"]', { timeout: 5000 });
        const buttons = await this.page.$$('button[type="button"]');
        if (buttons.length > 1) {
          await buttons[1].click(); // 通常第二個按鈕是接受cookies
        }
      } catch (e) {
        // 如果沒有cookie彈窗，忽略錯誤
      }
      
      // 輸入用戶名和密碼
      await this.page.waitForSelector('input[name="username"]');
      await this.page.type('input[name="username"]', username);
      await this.page.type('input[name="password"]', password);
      
      // 點擊登錄按鈕
      const loginButton = await this.page.$('button[type="submit"]');
      await loginButton.click();
      
      // 等待導航完成
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // 檢查是否有"稍後再說"按鈕，表示登錄成功
      try {
        await this.page.waitForSelector('button:contains("稍後再說")', { timeout: 5000 });
        await this.page.click('button:contains("稍後再說")');
      } catch (e) {
        // 可能沒有這個提示，忽略錯誤
      }
      
      this.isLoggedIn = true;
      console.log('登入成功！');
    } catch (error) {
      console.error('登入失敗:', error.message);
    }
  }
  
  /**
   * 爬取貼文信息
   * @param {string} postUrl - Instagram貼文URL
   */
  async scrapePost(postUrl) {
    // 檢查快取是否有效
    const now = Date.now();
    if (now - this.cache.lastUpdate < this.cacheValidityPeriod) {
      console.log('使用快取的數據');
      return {
        comments: this.cache.comments,
        likeCount: this.cache.likeCount
      };
    }
    
    try {
      await this.init();
      console.log(`爬取貼文: ${postUrl}`);
      
      // 導航到貼文頁面
      await this.page.goto(postUrl, { waitUntil: 'networkidle2' });
      
      // 等待頁面完全加載
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 獲取按讚數
      let likeCount = 0;
      try {
        // 嘗試不同的選擇器找到按讚數，Instagram的選擇器可能經常變化
        console.log('嘗試獲取按讚數...');
        
        // 先嘗試拍照截圖，看看頁面加載情況
        await this.page.screenshot({ path: 'instagram_screenshot.png' });
        console.log('已保存截圖到 instagram_screenshot.png');
        
        // 使用更通用的選擇器
        const likeElement = await this.page.$('section span span');
        if (likeElement) {
          const likeText = await this.page.evaluate(el => el.textContent, likeElement);
          console.log('發現按讚數文字:', likeText);
          
          // 解析數字，處理格式如 "1,234" 或 "1.2k"
          if (likeText.includes('k')) {
            likeCount = parseFloat(likeText.replace('k', '')) * 1000;
          } else if (likeText.includes('萬')) {
            likeCount = parseFloat(likeText.replace('萬', '')) * 10000;
          } else {
            likeCount = parseInt(likeText.replace(/,/g, ''), 10);
          }
        } else {
          console.log('無法找到按讚數元素，使用備用選擇器');
          
          // 使用更多的選擇器嘗試
          const selectors = [
            'article section span span',
            'span[class*="like"]',
            'section span[aria-label*="like"]',
            'article div[role="button"] span'
          ];
          
          for (const selector of selectors) {
            const el = await this.page.$(selector);
            if (el) {
              const text = await this.page.evaluate(el => el.textContent, el);
              console.log(`使用選擇器 "${selector}" 找到文字: ${text}`);
              
              // 嘗試從文字中提取數字
              const match = text.match(/\d[\d,.]*k?/);
              if (match) {
                const numText = match[0];
                if (numText.includes('k')) {
                  likeCount = parseFloat(numText.replace('k', '')) * 1000;
                } else {
                  likeCount = parseInt(numText.replace(/[,.]/g, ''), 10);
                }
                break;
              }
            }
          }
        }
      } catch (e) {
        console.log('無法獲取按讚數:', e.message);
      }
      
      // 如果無法獲取真實按讚數，返回0而不是模擬數據
      if (isNaN(likeCount) || likeCount === 0) {
        console.log(`無法獲取真實按讚數，返回0`);
        likeCount = 0;
      } else {
        console.log(`獲取到按讚數: ${likeCount}`);
      }
      
      // 獲取評論
      const comments = [];
      try {
        // 嘗試點擊"查看所有評論"按鈕（如果存在）
        try {
          console.log("嘗試點擊查看評論按鈕...");
          
          // 使用evaluate執行JavaScript查找按鈕
          const possibleTexts = ['查看所有評論', '查看全部留言', 'View all comments', '查看全部评论'];
          
          const buttonFound = await this.page.evaluate((textOptions) => {
            for (const text of textOptions) {
              // 使用JavaScript查找包含指定文本的元素
              const elements = Array.from(document.querySelectorAll('button, span, div[role="button"]'))
                .filter(el => el.textContent && el.textContent.includes(text));
              
              if (elements.length > 0) {
                try {
                  elements[0].click();
                  return true;
                } catch (e) {
                  console.log(`點擊'${text}'元素失敗`);
                }
              }
            }
            return false;
          }, possibleTexts);
          
          if (buttonFound) {
            console.log("成功點擊查看評論按鈕");
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            // 如果找不到按鈕，嘗試點擊評論區域
            console.log("找不到查看評論按鈕，嘗試點擊評論區域...");
            
            const commentAreaClicked = await this.page.evaluate(() => {
              const commentTexts = ['評論', 'comment', '留言'];
              for (const text of commentTexts) {
                const elements = Array.from(document.querySelectorAll('span, div, button'))
                  .filter(el => el.textContent && el.textContent.toLowerCase().includes(text.toLowerCase()));
                
                if (elements.length > 0) {
                  try {
                    elements[0].click();
                    return true;
                  } catch (e) {
                    // 忽略錯誤
                  }
                }
              }
              return false;
            });
            
            if (commentAreaClicked) {
              console.log("點擊了評論區域");
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
        } catch (e) {
          console.log("無法點擊查看評論按鈕:", e.message);
        }
        
        console.log("開始滾動頁面獲取評論...");
        // 滾動多次以加載更多評論
        for (let i = 0; i < 5; i++) {
          console.log(`滾動頁面 ${i+1}/5...`);
          await this.page.evaluate(() => {
            window.scrollBy(0, 1000);
          });
          // 使用setTimeout替代waitForTimeout
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 嘗試多種選擇器來獲取評論
        console.log("嘗試獲取評論元素...");
        const selectors = [
          'ul ul div.x9f619 div.xp7jhwk',        // 原始選擇器
          'ul[class*="comments"] li',            // 通用評論列表
          'div[data-testid*="comment"]',         // 測試ID
          'article ul li div[role="button"]',    // 評論按鈕
          'article div[role="presentation"]'     // 評論區域
        ];
        
        let commentElements = [];
        for (const selector of selectors) {
          console.log(`嘗試使用選擇器: ${selector}`);
          const elements = await this.page.$$(selector);
          if (elements.length > 0) {
            commentElements = elements;
            console.log(`使用選擇器 '${selector}' 找到 ${elements.length} 個評論元素`);
            break;
          }
        }
        
        // 如果CSS選擇器無效，嘗試使用自定義評論提取方式
        if (commentElements.length === 0) {
          console.log("CSS選擇器無效，嘗試使用自定義評論提取...");
          
          // 直接使用evaluate執行JavaScript提取評論
          const foundComments = await this.page.evaluate(() => {
            const extractedComments = [];
            
            // 1. 嘗試獲取所有評論相關元素
            const possibleCommentElements = [
              // 1. 所有列表項
              ...Array.from(document.querySelectorAll('article ul li')),
              // 2. 具有comment關鍵字class的元素
              ...Array.from(document.querySelectorAll('div[class*="comment"]')),
              // 3. 所有按鈕元素
              ...Array.from(document.querySelectorAll('article div[role="button"]')),
              // 4. 具有@用戶名的元素
              ...Array.from(document.querySelectorAll('span'))
                .filter(el => el.textContent && el.textContent.includes('@'))
            ];
            
            // 處理每個可能的評論元素
            possibleCommentElements.forEach((el, index) => {
              const text = el.textContent?.trim();
              if (text && text.length > 10) {
                // 嘗試分離用戶名和評論
                const userMatch = text.match(/(@\w+|[\w\s]+:)/);
                if (userMatch) {
                  const user = userMatch[0].replace(':', '').trim();
                  const commentText = text.replace(userMatch[0], '').trim();
                  if (commentText) {
                    extractedComments.push({ 
                      user, 
                      text: commentText,
                      id: `js_extracted_${index}`
                    });
                  }
                } else {
                  // 找不到用戶名，但可能是評論
                  extractedComments.push({ 
                    user: 'unknown', 
                    text,
                    id: `js_unknown_${index}`
                  });
                }
              }
            });
            
            return extractedComments;
          });
          
          if (foundComments.length > 0) {
            console.log(`使用JavaScript提取到 ${foundComments.length} 條可能的評論`);
            foundComments.forEach(comment => {
              comments.push({
                ...comment,
                ts: Date.now()
              });
            });
          }
        }
      } catch (e) {
        console.log('獲取評論時出錯:', e.message);
      }
      
      console.log(`總共獲取到 ${comments.length} 條評論`);
      
      // 不使用模擬數據，直接返回真實爬取的結果，即使為空
      this.cache.comments = comments;
      this.cache.likeCount = likeCount;
      this.cache.lastUpdate = now;
      
      return {
        comments,
        likeCount
      };
    } catch (error) {
      console.error('爬取貼文時發生錯誤:', error.message);
      
      // 發生錯誤時返回空數據，而不是模擬數據
      return {
        comments: [],
        likeCount: 0
      };
    }
  }
  
  /**
   * 生成模擬數據 - 禁用此功能
   */
  generateMockData() {
    console.log('模擬數據功能已禁用，僅返回真實數據');
    return {
      comments: [],
      likeCount: 0
    };
  }
  
  /**
   * 關閉瀏覽器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
    }
  }
}

// 導出scraper實例
const scraper = new InstagramScraper();
export default scraper; 