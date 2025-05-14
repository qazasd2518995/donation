import { useAudio } from './AudioContext';
import { useState, useEffect } from 'react';

const AudioControls = () => {
  const { isPlaying, volume, isMuted, togglePlay, toggleMute, handleVolumeChange, isIOS } = useAudio();
  const [showTip, setShowTip] = useState(false);

  // 對於 iOS 設備，在首次加載時顯示提示
  useEffect(() => {
    if (isIOS) {
      setShowTip(true);
      const timer = setTimeout(() => {
        setShowTip(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isIOS]);

  // 處理音頻播放按鈕點擊
  const handlePlayClick = () => {
    // 記錄用戶交互並調用音頻切換
    togglePlay();
    
    // 在 iOS 設備上，顯示一個短暫的提示
    if (isIOS && !isPlaying) {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 3000);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 bg-secondary/80 backdrop-blur-md p-2 rounded-lg shadow-lg z-50 flex items-center gap-3">
        <button 
          onClick={handlePlayClick}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary hover:bg-primary/80 text-white transition-colors"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleMute} 
            className="h-4 w-4 flex items-center justify-center text-white"
            aria-label={isMuted ? "取消靜音" : "靜音"}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15.465a5 5 0 001.897-7.72m-3.732 9.9a9 9 0 010-12.728M19.513 8.293l-4.95 4.95M14.563 13.243l4.95-4.95" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 001.897-7.72m-3.732 9.9a9 9 0 010-12.728" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(e.target.value)}
            className="w-20 accent-primary"
            aria-label="音量調整"
          />
        </div>
      </div>
      
      {/* iOS 播放提示 */}
      {showTip && isIOS && (
        <div className="fixed bottom-20 right-4 bg-primary text-white p-3 rounded-lg shadow-lg max-w-xs text-sm z-50 animate-pulse">
          點擊播放按鈕來啟用音樂。iOS設備需要直接用戶操作才能播放音頻。
        </div>
      )}
    </>
  );
};

export default AudioControls; 