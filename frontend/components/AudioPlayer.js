import { useState, useEffect, useRef } from 'react';
import { useLanguage } from './LanguageContext';
import { useTranslation } from './Translation';

const AudioPlayer = ({ src, autoPlay = false, muted = false }) => {
  const { language } = useLanguage();
  const { t } = useTranslation('audio');
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(50);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);

  useEffect(() => {
    if (audioRef.current) {
      const handleCanPlayThrough = () => {
        setAudioLoaded(true);
        if (isPlaying) {
          tryPlayAudio();
        }
      };
      
      audioRef.current.addEventListener('canplaythrough', handleCanPlayThrough);
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplaythrough', handleCanPlayThrough);
        }
      };
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && audioLoaded) {
      if (isPlaying) {
        tryPlayAudio();
      } else {
        try {
          audioRef.current.pause();
        } catch (error) {
          console.error(t('playMusicError'), error);
        }
      }
    }
  }, [isPlaying, audioLoaded, t]);

  useEffect(() => {
    if (audioRef.current) {
      try {
        audioRef.current.volume = volume / 100;
      } catch (error) {
        console.error(t('volumeError'), error);
      }
    }
  }, [volume, t]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  const tryPlayAudio = () => {
    if (!audioRef.current) return;
    
    try {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error(t('autoPlayError'), error);
          setIsPlaying(false);
        });
      }
    } catch (error) {
      console.error(t('playMusicError'), error);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    // 如果使用者調整音量，且音量大於0，則自動取消靜音
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-secondary/80 backdrop-blur-md p-2 rounded-lg shadow-lg z-50 flex items-center gap-3">
      <audio 
        ref={audioRef} 
        src={src} 
        loop 
        muted={isMuted}
        onError={(e) => {
          console.error(t('playError'), e);
          setIsPlaying(false);
        }}
      />
      
      <button 
        onClick={togglePlay}
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
        <button onClick={toggleMute} className="h-4 w-4 flex items-center justify-center text-white">
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
          onChange={handleVolumeChange}
          className="w-20 accent-primary"
        />
      </div>
    </div>
  );
};

export default AudioPlayer; 