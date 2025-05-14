import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(true); // 默認為靜音
  const audioRef = useRef(null);
  const audioSrc = useRef("/music/theme_song_fa.wav");
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  // 初始化音頻元素
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 檢查是否已經存在全局音頻元素
      let audio = document.getElementById('global-audio-player');
      
      if (!audio) {
        audio = new Audio();
        audio.id = 'global-audio-player';
        audio.loop = true;
        audio.src = audioSrc.current;
        document.body.appendChild(audio);
      }
      
      audioRef.current = audio;
      
      // 嘗試從 localStorage 恢復之前的播放狀態
      const savedVolume = localStorage.getItem('audioVolume');
      const savedMuted = localStorage.getItem('audioMuted');
      const savedPlaying = localStorage.getItem('audioPlaying');
      
      if (savedVolume) setVolume(parseInt(savedVolume, 10));
      if (savedMuted) setIsMuted(savedMuted === 'true');
      
      // 設置音量和靜音狀態
      audio.volume = savedVolume ? parseInt(savedVolume, 10) / 100 : 0.5;
      audio.muted = savedMuted ? savedMuted === 'true' : true;
      
      // 設置事件監聽器
      const handleCanPlayThrough = () => {
        setAudioLoaded(true);
        if (savedPlaying === 'true') {
          playAudio();
        }
      };
      
      audio.addEventListener('canplaythrough', handleCanPlayThrough);
      
      // 清理函數
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplaythrough', handleCanPlayThrough);
        }
      };
    }
  }, []);
  
  // 保存狀態到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioVolume', volume.toString());
      localStorage.setItem('audioMuted', isMuted.toString());
      localStorage.setItem('audioPlaying', isPlaying.toString());
    }
  }, [volume, isMuted, isPlaying]);
  
  // 當音量或靜音狀態改變時更新音頻
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);
  
  // 播放音頻的函數
  const playAudio = () => {
    if (audioRef.current && audioLoaded) {
      try {
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch(error => {
            console.error('播放音頻失敗:', error);
            setIsPlaying(false);
          });
        }
      } catch (error) {
        console.error('播放音頻錯誤:', error);
        setIsPlaying(false);
      }
    }
  };
  
  // 暫停音頻的函數
  const pauseAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        setIsPlaying(false);
      } catch (error) {
        console.error('暫停音頻錯誤:', error);
      }
    }
  };
  
  // 切換播放/暫停的函數
  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };
  
  // 切換靜音的函數
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // 設置音量的函數
  const handleVolumeChange = (newVolume) => {
    const volumeValue = parseInt(newVolume, 10);
    setVolume(volumeValue);
    
    // 如果音量大於0且靜音，則取消靜音
    if (volumeValue > 0 && isMuted) {
      setIsMuted(false);
    }
    // 如果音量為0且未靜音，則設置靜音
    else if (volumeValue === 0 && !isMuted) {
      setIsMuted(true);
    }
  };
  
  // 當組件掛載時自動開始播放音頻（靜音狀態）
  useEffect(() => {
    if (audioLoaded && audioRef.current && !isPlaying) {
      playAudio();
    }
  }, [audioLoaded]);
  
  return (
    <AudioContext.Provider 
      value={{
        isPlaying,
        volume,
        isMuted,
        togglePlay,
        toggleMute,
        handleVolumeChange,
        playAudio,
        pauseAudio
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

// 自定義 Hook，方便在組件中使用音頻 Context
export function useAudio() {
  return useContext(AudioContext);
} 