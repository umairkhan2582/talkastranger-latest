import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RefreshCcw } from 'lucide-react';
import professionalVideoSrc from '../assets/high-quality/tas-demo-final.mp4';
import videoThumbnail from '../assets/high-quality/video-thumbnail.jpg';

interface DemoVideoProps {
  title: string;
  description?: string;
}

const DemoVideo: React.FC<DemoVideoProps> = ({ title, description }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Sync audio with video when video plays/pauses
    const handleVideoPlay = () => {
      if (audioRef.current && videoRef.current) {
        audioRef.current.currentTime = videoRef.current.currentTime;
        audioRef.current.play().catch(err => console.error("Error playing audio:", err));
      }
    };

    const handleVideoPause = () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('play', handleVideoPlay);
      video.addEventListener('pause', handleVideoPause);
    }

    return () => {
      if (video) {
        video.removeEventListener('play', handleVideoPlay);
        video.removeEventListener('pause', handleVideoPause);
      }
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          setHasError(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current && audioRef.current) {
      videoRef.current.muted = !isMuted;
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Keep audio in sync with video
      if (audioRef.current && Math.abs(audioRef.current.currentTime - videoRef.current.currentTime) > 0.3) {
        audioRef.current.currentTime = videoRef.current.currentTime;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden bg-black shadow-xl">
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        )}
        
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
            <div className="text-red-500 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p className="text-white text-center mb-3">Video could not be loaded</p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Try Again
            </button>
          </div>
        )}
        
        {/* Actual video element */}
        <video
          ref={videoRef}
          className="w-full aspect-video object-cover"
          poster={videoThumbnail}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
        >
          <source src={professionalVideoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* We don't need a separate audio element since it's embedded in the video */}
        <audio
          ref={audioRef}
          hidden
          onError={(e) => console.error("Audio error:", e)}
        >
          <source src={professionalVideoSrc} type="video/mp4" />
        </audio>
        
        {/* Video controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={togglePlay}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-100"
              disabled={isLoading || hasError}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            
            <div className="text-white text-xs">
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </div>
            
            <div className="flex-grow">
              <input 
                type="range" 
                min="0" 
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 accent-green-500 cursor-pointer"
                disabled={isLoading || hasError}
              />
            </div>
            
            <button 
              onClick={toggleMute}
              className="text-white hover:text-green-400"
              disabled={isLoading || hasError}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      
      {description && (
        <div className="bg-slate-800 p-4">
          <h3 className="text-white font-medium mb-1">{title}</h3>
          <p className="text-slate-300 text-sm">{description}</p>
          <div className="mt-2 flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-green-300">Professional voice-over included</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoVideo;