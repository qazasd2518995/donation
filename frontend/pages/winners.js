import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../components/LanguageContext';
import { useTranslation } from '../components/Translation';
import LanguageToggle from '../components/LanguageToggle';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

// 獎項清單
const prizes = [
  { rank: 1,  name: "大獎", detail: "墾丁旅宿灣臥海景頂級房住宿券一晚＋PSK海洋友善保養禮盒＋台灣鯨豚協會紀念品組合", value: 10797 },
  { rank: 2,  name: "二獎", detail: "環保海龜飲料杯套＋PSK海洋系列保養組＋台灣鯨豚協會明信片組", value: 2200 },
  { rank: 3,  name: "二獎", detail: "環保海龜飲料杯套＋PSK海洋系列保養組＋台灣鯨豚協會明信片組", value: 2200 },
  { rank: 4,  name: "二獎", detail: "環保海龜飲料杯套＋PSK海洋系列保養組＋台灣鯨豚協會明信片組", value: 2200 },
  { rank: 5,  name: "三獎", detail: "ONE+ 虎鯨鑰匙圈＋PSK海洋深層保濕精華＋台灣鯨豚生態介紹手冊", value: 1580 },
  { rank: 6,  name: "三獎", detail: "ONE+ 鯨魚鑰匙圈＋PSK海洋深層保濕精華＋台灣鯨豚生態介紹手冊", value: 1580 },
  { rank: 7,  name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 8,  name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 9,  name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 10, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 11, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 12, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 13, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 14, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 15, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 16, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 17, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 18, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
];

// 確保所有獎品描述也能支持當前語言，可以在 prizes 陣列中添加多語言支持
const getPrizeNameByLanguage = (prize, language) => {
  if (!prize) return '';
  
  if (language === 'zh') {
    return prize.name;
  } else {
    // 英文版獎項名稱映射
    const nameMap = {
      "大獎": "Grand Prize",
      "二獎": "Second Prize",
      "三獎": "Third Prize",
      "四獎": "Fourth Prize"
    };
    return nameMap[prize.name] || prize.name;
  }
};

const getPrizeDetailByLanguage = (prize, language) => {
  if (!prize) return '';
  
  if (language === 'zh') {
    return prize.detail;
  } else {
    // 英文版獎項詳情映射
    if (prize.rank === 1) {
      return "One night stay at Kenting Wandering Walls premium sea view room + PSK ocean-friendly skincare gift box + Taiwan Cetacean Society souvenir set";
    } else if (prize.rank >= 2 && prize.rank <= 4) {
      return "Eco-friendly sea turtle cup sleeve + PSK ocean series skincare set + Taiwan Cetacean Society postcard set";
    } else if (prize.rank >= 5 && prize.rank <= 6) {
      return "ONE+ orca/whale keychain + PSK deep ocean moisturizing essence + Taiwan cetacean ecology guidebook";
    } else {
      return "PSK value gift pack + Marine conservation digital resource pack";
    }
  }
};

export default function WinnerPage() {
  // 添加語言支持
  const { language } = useLanguage();
  const { t } = useTranslation('draw');
  
  // 判斷留言是否包含hashtag
  const hasHashtag = (text, tag = 'all') => {
    // 轉換為小寫以避免大小寫問題
    const lowerText = text.toLowerCase();
    
    if (tag === 'all') {
      // 使用正則表達式匹配，允許 hashtag 前後有空格
      return /\s*#\s*p\b/i.test(lowerText) || 
             /\s*#\s*s\b/i.test(lowerText) || 
             /\s*#\s*k\b/i.test(lowerText);
    }
    // 使用正則表達式匹配特定標籤，允許標籤前後有空格
    const regex = new RegExp(`\\s*#\\s*${tag.toLowerCase()}\\b`, 'i');
    return regex.test(lowerText);
  };
  
  const [winners, setWinners] = useState([]);
  const [prevWinnersCount, setPrevWinnersCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count] = useState(18); // 固定抽獎人數為18人
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [followingUsers, setFollowingUsers] = useState({});
  const [activeTab, setActiveTab] = useState('winners'); // 'winners' 或 'verify'
  const [filterHashtag, setFilterHashtag] = useState('all'); // 'all', 'P', 'S', 'K'
  const [prizeList, setPrizeList] = useState([]);
  const [selectAll, setSelectAll] = useState(false); // 添加全選狀態
  const [showCelebration, setShowCelebration] = useState(false);
  const drawSoundRef = useRef(null);

  const [currentScrollY, setCurrentScrollY] = useState(0);
  // SCROLL_THRESHOLD will be set in useEffect after window is available
  const [scrollThreshold, setScrollThreshold] = useState(0);
  
  // 過濾出符合條件的留言
  const filteredComments = comments.filter(comment => 
    hasHashtag(comment.text, filterHashtag)
  );
  
  // 簡單密碼驗證函數
  const handleLogin = () => {
    // 這裡使用簡單密碼，實際應用應更安全
    if (password === 'psk2024') {
      setIsAdmin(true);
      localStorage.setItem('drawAdmin', 'true');
      setShowLoginForm(false);
    } else {
      alert(language === 'zh' ? '密碼錯誤' : 'Incorrect password');
    }
  };
  
  // 登出功能
  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('drawAdmin');
  };
  
  async function fetchComments() {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // 防止緩存問題
      });
      if (!response.ok) {
        throw new Error(`HTTP錯誤! 狀態碼: ${response.status}`);
      }
      const data = await response.json();
      console.log('評論數據:', data);
      setComments(data.comments || []);
      
      // 從localStorage恢復已確認的追蹤狀態
      const savedFollowingUsers = localStorage.getItem('followingUsers');
      if (savedFollowingUsers) {
        setFollowingUsers(JSON.parse(savedFollowingUsers));
      }
      
      setError(null);
    } catch (err) {
      console.error('獲取留言資料時出錯:', err);
      setError(`無法連接到服務器或獲取留言資料: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  // 添加抽獎音效播放
  const playDrawSound = () => {
    if (drawSoundRef.current) {
      try {
        drawSoundRef.current.currentTime = 0;
        const playPromise = drawSoundRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.log('播放抽獎音效被瀏覽器阻止或檔案問題:', e);
            // 不處理錯誤，只記錄
          });
        }
      } catch (e) {
        console.log('播放抽獎音效失敗:', e);
      }
    }
  };
  
  // 執行限定追蹤用戶的抽獎
  const drawFromVerifiedUsers = async () => {
    try {
      setLoading(true);
      
      // 獲取所有已確認追蹤且有hashtag的用戶
      const verifiedUserIds = Object.keys(followingUsers).filter(id => followingUsers[id]);
      
      // 確保有足夠的合格用戶
      if (verifiedUserIds.length < count) {
        alert(language === 'zh' 
          ? `合格的用戶不足 ${count} 人，目前只有 ${verifiedUserIds.length} 人確認追蹤且留有hashtag`
          : `Not enough qualified users (${verifiedUserIds.length}/${count}). Users must be verified as following and have included a hashtag.`
        );
        setLoading(false);
        return;
      }
      
      // 記錄之前的獲獎者數量
      setPrevWinnersCount(winners.length);
      
      // 發送給後端執行抽獎，限定從已確認追蹤的用戶中抽
      const response = await fetch(`${API_BASE_URL}/api/winners-custom`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          count: count,
          verifiedUserIds: verifiedUserIds
        })
      });
      
      if (!response.ok) {
        throw new Error(language === 'zh' ? '抽獎請求失敗' : 'Draw request failed');
      }
      
      const data = await response.json();
      setWinners(data.winners || []);
      setError(null);
      setActiveTab('winners'); // 切換回抽獎結果頁
      
      // 顯示慶祝動畫
      setShowCelebration(true);
      
      // 播放抽獎音效
      playDrawSound();
      
      // 5秒後隱藏慶祝動畫
      setTimeout(() => {
        setShowCelebration(false);
      }, 5000);
      
    } catch (err) {
      console.error(language === 'zh' ? '執行抽獎時出錯:' : 'Error during draw:', err);
      setError(language === 'zh' ? '執行抽獎失敗: ' + err.message : 'Draw failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  async function fetchWinners() {
    try {
      setLoading(true);
      setPrevWinnersCount(winners.length);
      
      const response = await fetch(`${API_BASE_URL}/api/winners?count=${count}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache', // 防止緩存問題
        // 添加時間戳參數以避免緩存
        signal: AbortSignal.timeout(10000) // 添加10秒超時
      });
      if (!response.ok) {
        throw new Error(`HTTP錯誤! 狀態碼: ${response.status}`);
      }
      const data = await response.json();
      console.log('抽獎結果:', data);
      
      // 如果有抽獎結果，顯示獲獎者
      if (data.winners && data.winners.length > 0) {
        const newWinnersCount = data.winners.length;
        setWinners(data.winners);
        
        // 如果有新增的中獎者，顯示慶祝動畫
        if (newWinnersCount > prevWinnersCount && prevWinnersCount > 0) {
          setShowCelebration(true);
          playDrawSound();
          setTimeout(() => {
            setShowCelebration(false);
          }, 5000);
        }
      } else {
        // 如果沒有抽獎結果，只顯示符合條件的評論
        setWinners([]);
      }
      setError(null);
    } catch (err) {
      console.error('獲取抽獎結果時出錯:', err);
      setError(`無法連接到服務器或獲取抽獎結果: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchPrizes() {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/prizes`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // 防止緩存問題
      });
      if (!response.ok) {
        throw new Error(`HTTP錯誤! 狀態碼: ${response.status}`);
      }
      const data = await response.json();
      console.log('獎品列表:', data);
      setPrizeList(data.prizes || []);
      setError(null);
    } catch (err) {
      console.error('獲取獎品列表時出錯:', err);
      // 使用默認獎品列表作為備用
      setPrizeList(prizes);
    } finally {
      setLoading(false);
    }
  }
  
  // 更新追蹤狀態
  const toggleFollowing = (userId) => {
    const newFollowingUsers = {
      ...followingUsers,
      [userId]: !followingUsers[userId]
    };
    setFollowingUsers(newFollowingUsers);
    localStorage.setItem('followingUsers', JSON.stringify(newFollowingUsers));
  };
  
  // 清空抽獎結果
  const clearWinners = async () => {
    // 先進行確認
    if (!window.confirm('確定要清空當前抽獎結果嗎？此操作不可恢復！')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('正在嘗試清空抽獎結果...');
      console.log('呼叫端點:', `${API_BASE_URL}/api/winners/clear`);
      
      const response = await fetch(`${API_BASE_URL}/api/winners/clear`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('清空抽獎結果失敗，狀態碼:', response.status);
        throw new Error(`HTTP錯誤! 狀態碼: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('清空抽獎結果回應:', data);
      
      if (data.success) {
        // 清空本地抽獎結果
        setWinners([]);
        setError(null);
        // 顯示成功訊息
        alert('抽獎結果已清空，您可以重新抽獎了');
      } else {
        throw new Error(data.message || '清空抽獎結果失敗');
      }
    } catch (err) {
      console.error('清空抽獎結果時出錯:', err);
      setError('清空抽獎結果失敗: ' + err.message);
      alert('清空抽獎結果失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 全選或取消全選所有用戶
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    // 創建一個新的狀態對象
    const newFollowingUsers = {};
    
    // 根據全選狀態設置所有過濾後的評論
    filteredComments.forEach(comment => {
      newFollowingUsers[comment.id] = newSelectAll;
    });
    
    // 合併現有的狀態（保留不在過濾結果中的用戶狀態）
    const mergedFollowingUsers = {
      ...followingUsers,
      ...newFollowingUsers
    };
    
    setFollowingUsers(mergedFollowingUsers);
    localStorage.setItem('followingUsers', JSON.stringify(mergedFollowingUsers));
  };

  useEffect(() => {
    fetchWinners();
    fetchComments();
    fetchPrizes();
    
    // Set initial scroll threshold based on window height
    setScrollThreshold(window.innerHeight * 0.5);

    const adminStatus = localStorage.getItem('drawAdmin');
    if (adminStatus === 'true') {
      setIsAdmin(true);
    }
    
    const handleScroll = () => {
      setCurrentScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const intervalId = setInterval(() => {
      fetchComments();
    }, 30000);
    
    // Debounce or throttle resize listener if performance becomes an issue
    const handleResize = () => {
      setScrollThreshold(window.innerHeight * 0.5);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
    };
  }, []);

  // 增加偵錯日誌函數
  const logDebugInfo = () => {
    console.log('當前評論數據:', comments);
    console.log('有效評論數量:', filteredComments.length);
    console.log('已確認追蹤用戶:', Object.keys(followingUsers).filter(id => followingUsers[id]).length);
    console.log('當前追蹤狀態:', followingUsers);
  };

  const dynamicTextColorClass = currentScrollY > scrollThreshold ? 'text-black' : 'text-white';
  
  return (
    <>
      <Head>
        <title>{t('title')}</title>
        <meta name="description" content={t('title')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className={`min-h-screen bg-gradient-to-b from-primary to-primary-dark ${currentScrollY > scrollThreshold ? '' : 'text-white'} transition-colors duration-300 ease-in-out`}>
        {/* Apply transition-colors to main container to affect all children inheriting text color */}
        <audio ref={drawSoundRef} src="/music/draw_sound.mp3" preload="auto"></audio>
        
        <AnimatePresence>
          {showCelebration && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
              <motion.div 
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10 }}
                className="bg-gradient-to-br from-secondary to-primary p-8 rounded-xl shadow-2xl relative z-10 text-center"
              >
                <h2 className="text-3xl font-bold mb-2 text-white">{t('congratulations')}</h2>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <LanguageToggle />
        
        {showLoginForm && !isAdmin && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-primary-dark p-6 rounded-xl shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-white">{t('adminLogin')}</h3>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder={t('password')}
                className="w-full bg-white/10 text-white p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-secondary placeholder-gray-400"
              />
              <div className="flex justify-between">
                <button 
                  onClick={() => {
                    setShowLoginForm(false);
                    setPassword('');
                  }}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleLogin}
                  className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-opacity-80 transition-colors"
                >
                  {t('login')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className={`container mx-auto px-4 py-10 text-current`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold mb-2">{t('pageTitle')}</h1>
              <p className="text-xl opacity-80">{t('thankYouMessage')}</p>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="bg-secondary rounded-full p-1 inline-flex">
                <button 
                  onClick={() => setActiveTab('winners')}
                  className={`px-4 py-2 rounded-full transition-colors duration-300 ease-in-out ${activeTab === 'winners' ? 'bg-primary-dark text-white' : `hover:bg-primary-dark/50 ${dynamicTextColorClass}`}`}
                >
                  {t('resultsTab')}
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => setActiveTab('verify')}
                    className={`px-4 py-2 rounded-full transition-colors duration-300 ease-in-out ${activeTab === 'verify' ? 'bg-primary-dark text-white' : `hover:bg-primary-dark/50 ${dynamicTextColorClass}`}`}
                  >
                    {t('verifyTab')}
                  </button>
                )}
              </div>
            </div>
            
            {activeTab === 'winners' ? (
              <div className="bg-white/10 rounded-xl p-6 mb-8">
                <div className="flex flex-wrap items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{isAdmin ? t('drawManagement') : t('luckyWinners')}</h2>
                  
                  {isAdmin ? (
                    <div className="flex items-center flex-wrap gap-4 mt-4 md:mt-0">
                      <div className="flex items-center gap-2">
                        <span className="text-secondary font-medium">
                          {t('fixedWinners', { count })}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (Object.keys(followingUsers).filter(id => followingUsers[id]).length > 0) {
                            drawFromVerifiedUsers();
                          } else {
                            alert(language === 'zh' ? '請先確認有追蹤帳號的用戶！' : 'Please verify users who are following the account first!');
                            setActiveTab('verify');
                          }
                        }}
                        disabled={loading}
                        className={`px-4 py-2 bg-secondary rounded-lg hover:bg-opacity-80 transition-colors duration-300 ease-in-out disabled:opacity-50 text-white`}
                      >
                        {t('drawVerified')}
                      </button>
                      
                      <button
                        onClick={clearWinners}
                        disabled={loading || winners.length === 0}
                        className={`px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-opacity-80 transition-colors duration-300 ease-in-out disabled:opacity-50`}
                      >
                        {t('clearResults')}
                      </button>
                      
                      <button
                        onClick={() => fetchWinners()}
                        disabled={loading}
                        className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-opacity-80 transition-colors duration-300 ease-in-out disabled:opacity-50`}
                      >
                        {t('testAPI')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        isAdmin ? handleLogout() : setShowLoginForm(true);
                      }}
                      className={`px-4 py-2 bg-secondary text-white rounded-lg hover:bg-opacity-80 transition-colors duration-300 ease-in-out`}
                    >
                      {isAdmin ? t('logout') : t('adminLogin')}
                    </button>
                  )}
                </div>
                
                <div className={`text-center text-sm mb-6 text-current ${currentScrollY <= scrollThreshold ? 'opacity-70' : 'opacity-100'} transition-opacity duration-300 ease-in-out`}>
                  {winners.length > 0 && (
                    <p>
                      {t('totalWinners', { count: winners.length })}
                    </p>
                  )}
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className={`bg-red-500/20 text-center p-4 rounded-lg ${currentScrollY > scrollThreshold ? 'text-red-700' : 'text-red-300'} transition-colors duration-300 ease-in-out`}> 
                    {error}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {winners.map((winner, index) => {
                        const prize = index < prizeList.length ? prizeList[index] : null;
                        return (
                          <motion.div
                            key={winner.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/10 p-4 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-bold truncate text-current">{winner.user}</div>
                              {prize && (
                                <div className="bg-secondary/80 text-xs px-2 py-1 rounded-full text-white">
                                  {getPrizeNameByLanguage(prize, language)}
                                </div>
                              )}
                            </div>
                            <div className={`text-sm mt-2 line-clamp-2 text-current ${currentScrollY <= scrollThreshold ? 'opacity-70' : 'opacity-90'} transition-opacity duration-300 ease-in-out`}>{winner.text}</div>
                            {prize && (
                              <div className="mt-3 bg-white/10 p-2 rounded text-sm">
                                <div className={`font-bold text-secondary`}>{getPrizeNameByLanguage(prize, language)}</div>
                                <div className="text-current">{getPrizeDetailByLanguage(prize, language)}</div>
                                {prize.value > 0 && (
                                  <div className={`text-xs mt-1 text-current ${currentScrollY <= scrollThreshold ? 'opacity-70' : 'opacity-90'} transition-opacity duration-300 ease-in-out`}>
                                    {language === 'zh' ? `價值: NT$ ${prize.value.toLocaleString()}` : `Value: NT$ ${prize.value.toLocaleString()}`}
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/10 rounded-xl p-6 mb-8">
                <div className="flex flex-wrap items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{t('verifyUsers')}</h2>
                  
                  <div className="flex items-center flex-wrap mt-4 md:mt-0 gap-2">
                    <span className="text-current">{t('filter')}</span>
                    <select 
                      value={filterHashtag} 
                      onChange={(e) => setFilterHashtag(e.target.value)}
                      className={`bg-white/20 rounded px-2 py-1 text-current focus:text-black transition-colors duration-300 ease-in-out`}
                    >
                      <option value="all">{t('allHashtags')}</option>
                      <option value="P">#P</option>
                      <option value="S">#S</option>
                      <option value="K">#K</option>
                    </select>
                    
                    <button
                      onClick={toggleSelectAll}
                      className={`ml-2 px-3 py-1 bg-secondary text-white rounded-lg hover:bg-opacity-80 transition-colors duration-300 ease-in-out`}
                    >
                      {selectAll ? t('deselectAll') : t('selectAll')}
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={logDebugInfo}
                        className={`ml-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-opacity-80 transition-colors duration-300 ease-in-out`}
                      >
                        {t('debug')}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className={`bg-black/20 rounded-lg p-4 mb-6 text-current`}>
                  <h3 className={`font-bold text-secondary mb-2`}>{t('verificationInstructions')}</h3>
                  <p className={`text-sm mb-2 ${currentScrollY <= scrollThreshold ? 'opacity-80' : 'opacity-100'} transition-opacity duration-300 ease-in-out`}>{t('verificationDetails')}</p>
                  <p className={`text-sm font-bold ${currentScrollY <= scrollThreshold ? 'opacity-80' : 'opacity-100'} transition-opacity duration-300 ease-in-out`}>{t('onlyVerified')}</p>
                  <br />
                  <span className={`${currentScrollY <= scrollThreshold ? 'opacity-80' : 'opacity-100'} transition-opacity duration-300 ease-in-out`}>
                    {t('qualifiedComments', { count: filteredComments.length })} 
                    | {t('verifiedFollowing', { count: Object.values(followingUsers).filter(Boolean).length })}
                  </span>
                </div>
                
                <div className={`text-center text-sm mb-4 text-current ${currentScrollY <= scrollThreshold ? 'opacity-70' : 'opacity-100'} transition-opacity duration-300 ease-in-out`}>
                  {t('qualifiedComments', { count: filteredComments.length })} 
                  | {t('verifiedFollowing', { count: Object.values(followingUsers).filter(Boolean).length })}
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className={`bg-red-500/20 text-center p-4 rounded-lg ${currentScrollY > scrollThreshold ? 'text-red-700' : 'text-red-300'} transition-colors duration-300 ease-in-out`}>
                    {error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredComments.map((comment) => (
                      <div key={comment.id} className="bg-white/10 p-4 rounded-lg flex items-start justify-between">
                        <div className="flex-1">
                          <a 
                            href={`https://www.instagram.com/${comment.username}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`font-bold hover:text-secondary text-current`}
                          >
                            {comment.user}
                          </a>
                          <div className={`text-sm mt-2 text-current ${currentScrollY <= scrollThreshold ? 'opacity-70' : 'opacity-100'} transition-opacity duration-300 ease-in-out`}>{comment.text}</div>
                        </div>
                        <div className="ml-4 flex items-center">
                          <label className={`flex items-center space-x-2 cursor-pointer text-current`}>
                            <input 
                              type="checkbox" 
                              checked={!!followingUsers[comment.id]} 
                              onChange={() => toggleFollowing(comment.id)}
                              className="w-4 h-4 accent-secondary"
                            />
                            <span>{t('following')}</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setActiveTab('winners')}
                    className={`px-4 py-2 bg-secondary text-white rounded-lg hover:bg-opacity-80 transition-colors duration-300 ease-in-out`}
                  >
                    {t('backToResults')}
                  </button>
                </div>
              </div>
            )}
            
            <div className={`bg-white/10 rounded-xl p-6 text-current`}>
              <h2 className={`text-2xl font-bold mb-4`}>{t('eventRules')}</h2>
              <div className={`space-y-4 text-sm ${currentScrollY <= scrollThreshold ? 'opacity-80' : 'opacity-100'} transition-opacity duration-300 ease-in-out`}>
                <p className={`text-xl font-bold text-secondary`}>{t('projectTitle')}</p>
                <p>
                  {t('projectDescription')}
                </p>
                
                <div>
                  <p className={`font-bold text-lg text-secondary mb-2`}>📝 {language === 'zh' ? '參與方式' : 'How to Participate'}</p>
                  {language === 'zh' ? (
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>追蹤 PSK 的官方 Instagram 帳號 <span className="text-secondary">@psk_skincare_makeup</span></li>
                      <li>按讚本篇貼文，<strong>PSK 即為您捐出新台幣 1 元</strong>給台灣鯨豚協會</li>
                      <li>在貼文下方留言，分享您的「愛海宣言」或「對鯨豚與 PSK 的想法」</li>
                      <li>在留言中加入以下任一標籤，即可參加對應獎項抽獎：
                        <ul className="list-disc pl-5 mt-1">
                          <li><span className="text-secondary font-bold">#P</span> - {t('pValue').substring(3)}</li>
                          <li><span className="text-secondary font-bold">#S</span> - {t('sValue').substring(3)}</li>
                          <li><span className="text-secondary font-bold">#K</span> - {t('kValue').substring(3)}</li>
                        </ul>
                      </li>
                    </ol>
                  ) : (
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Follow PSK's official Instagram account <span className="text-secondary">@psk_skincare_makeup</span></li>
                      <li>Like this post, and <strong>PSK will donate NT$1</strong> to the Taiwan Cetacean Society on your behalf</li>
                      <li>Comment below the post, share your "ocean protection pledge" or "thoughts about cetaceans and PSK"</li>
                      <li>Add one of the following hashtags in your comment to participate in the lucky draw:
                        <ul className="list-disc pl-5 mt-1">
                          <li><span className="text-secondary font-bold">#P</span> - {t('pValue').substring(3)}</li>
                          <li><span className="text-secondary font-bold">#S</span> - {t('sValue').substring(3)}</li>
                          <li><span className="text-secondary font-bold">#K</span> - {t('kValue').substring(3)}</li>
                        </ul>
                      </li>
                    </ol>
                  )}
                  
                  {language === 'zh' ? (
                    <div>
                      <p className="mt-2 italic">範例留言:</p>
                      <ul className="pl-5 italic text-secondary">
                        <li>「#P普及海洋守護 每天都希望海洋能更乾淨，鯨豚能自在遨遊！」</li>
                        <li>「#S聲浪共鳴傳唱 謝謝PSK支持海洋保育，讓美麗與永續共存！」</li>
                        <li>「#K刻不容緩行動 承諾減少一次性塑膠使用，為鯨豚創造更好的家！」</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <p className="mt-2 italic">Example comments:</p>
                      <ul className="pl-5 italic text-secondary">
                        <li>"#P Ocean Awareness I hope the ocean gets cleaner every day and cetaceans can swim freely!"</li>
                        <li>"#S Voice Resonance Thank you PSK for supporting marine conservation, allowing beauty and sustainability to coexist!"</li>
                        <li>"#K Urgent Action I pledge to reduce single-use plastic to create a better home for cetaceans!"</li>
                      </ul>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className={`font-bold text-lg text-secondary mb-2`}>{t('eventInfoTitle')}</p>
                  {language === 'zh' ? (
                    <ul className="list-decimal pl-5 space-y-1">
                      <li>{t('eventPeriod')}</li>
                      <li>{t('drawDate')}</li>
                      <li>{t('commentLimit')}</li>
                      <li>{t('winnerNotice')}</li>
                      <li>{t('organizerRights')}</li>
                    </ul>
                  ) : (
                    <ul className="list-decimal pl-5 space-y-1">
                      <li>{t('eventPeriod')}</li>
                      <li>{t('drawDate')}</li>
                      <li>{t('commentLimit')}</li>
                      <li>{t('winnerNotice')}</li>
                      <li>{t('organizerRights')}</li>
                    </ul>
                  )}
                </div>
                
                <div>
                  <p className={`font-bold text-lg text-secondary mb-2`}>{t('prizesTitle')}</p>
                  <div className="space-y-3">
                    <div>
                      <p className={`font-bold`}>{t('grandPrizeTitle')}</p>
                      <p className="pl-4">• {t('grandPrize1')}</p>
                      <p className="pl-4">• {t('grandPrize2')}</p>
                      <p className="pl-4">• {t('grandPrize3')}</p>
                    </div>
                    
                    <div>
                      <p className={`font-bold`}>{t('guardianPrizeTitle')}</p>
                      <p className="pl-4">• {t('guardianPrize1')}</p>
                      <p className="pl-4">• {t('guardianPrize2')}</p>
                      <p className="pl-4">• {t('guardianPrize3')}</p>
                    </div>
                    
                    {language === 'zh' ? (
                      <div>
                        <p className={`font-bold`}>🐳 鯨豚之友獎（2名）:</p>
                        <p className="pl-4">• ONE+ 虎鯨/鯨魚鑰匙圈</p>
                        <p className="pl-4">• PSK海洋深層保濕精華（價值NT$1,580）</p>
                        <p className="pl-4">• 台灣鯨豚生態介紹手冊</p>
                      </div>
                    ) : (
                      <div>
                        <p className={`font-bold`}>🐳 Cetacean Friend Prize (2 winners):</p>
                        <p className="pl-4">• ONE+ orca/whale keychain</p>
                        <p className="pl-4">• PSK deep ocean moisturizing essence (value NT$1,580)</p>
                        <p className="pl-4">• Taiwan cetacean ecology guidebook</p>
                      </div>
                    )}
                    
                    {language === 'zh' ? (
                      <div>
                        <p className={`font-bold`}>💆🏻‍♀️ PSK美肌獎（12名）:</p>
                        <p className="pl-4">• PSK超值漂漂禮包（內含熱銷明星商品）</p>
                        <p className="pl-4">• 海洋保育電子資源包</p>
                      </div>
                    ) : (
                      <div>
                        <p className={`font-bold`}>💆🏻‍♀️ PSK Beauty Prize (12 winners):</p>
                        <p className="pl-4">• PSK value gift pack (containing bestselling products)</p>
                        <p className="pl-4">• Marine conservation digital resource pack</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className={`font-bold text-lg text-secondary mb-2`}>{language === 'zh' ? '🌊 關於PSK與海洋保育' : '🌊 About PSK and Ocean Conservation'}</p>
                  {language === 'zh' ? (
                    <div>
                      <p>
                        PSK 是創立於台灣、深耕50年的保養品牌，致力於從肌膚問題的根源出發，找出最有效、最溫和的解決方式。多年來與海洋萃取技術聞名全球的法國BIOTECH MARINE公司合作，強調回歸健康肌底、降低負擔，將PSK打造成一個倡導肌膚健康與永續海洋美學的保養品牌。
                      </p>
                      <p className="mt-2">
                        本次與台灣鯨豚協會合作，PSK承諾將依據貼文的按讚數量進行捐款，共同為台灣周邊海域的鯨豚保育工作盡一份心力。您的每一個互動，都是對海洋生態的實質支持！
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>
                        PSK is a skincare brand founded in Taiwan with 50 years of history, dedicated to addressing skin issues from their root causes to find the most effective and gentle solutions. Having collaborated with the globally renowned French company BIOTECH MARINE for many years, PSK emphasizes restoring healthy skin foundation and reducing burden, establishing itself as a skincare brand that advocates for both skin health and sustainable ocean aesthetics.
                      </p>
                      <p className="mt-2">
                        In this collaboration with the Taiwan Cetacean Society, PSK pledges to make donations based on the number of likes on the post, jointly contributing to cetacean conservation efforts in the waters around Taiwan. Your every interaction is substantial support for marine ecosystems!
                      </p>
                    </div>
                  )}
                </div>
                
                <p className={`text-center font-bold text-secondary`}>
                  {language === 'zh' ? '一起成為海洋守護戰士，讓愛與保護延續！' : 'Let\'s become ocean guardian warriors together, continuing love and protection!'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <a href="/" className={`text-secondary hover:underline`}>
              {t('returnToDashboard')}
            </a>
          </div>
        </div>
      </main>
    </>
  );
} 