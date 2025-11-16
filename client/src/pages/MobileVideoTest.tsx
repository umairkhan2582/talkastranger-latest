import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function MobileVideoTest() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const startVideo = async () => {
    try {
      console.log('[MOBILE TEST] Starting video');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.autoplay = true;
        localVideoRef.current.playsInline = true;
        localVideoRef.current.controls = true;
        
        // Force CSS
        localVideoRef.current.style.cssText = `
          display: block !important;
          width: 100% !important;
          height: 200px !important;
          object-fit: cover !important;
          background: black !important;
          border: 2px solid green !important;
        `;
      }
      
      // Simulate remote stream (mirror local for testing)
      setRemoteStream(stream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.muted = false; // For audio
        remoteVideoRef.current.autoplay = true;
        remoteVideoRef.current.playsInline = true;
        remoteVideoRef.current.controls = true;
        
        // Force CSS
        remoteVideoRef.current.style.cssText = `
          display: block !important;
          width: 100% !important;
          height: 200px !important;
          object-fit: cover !important;
          background: black !important;
          border: 2px solid red !important;
        `;
      }
      
      setIsConnected(true);
      console.log('[MOBILE TEST] Video setup complete');
      
    } catch (error) {
      console.error('[MOBILE TEST] Error:', error);
    }
  };

  const stopVideo = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsConnected(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Mobile Video Test</h1>
      
      <div className="space-y-2">
        <Button onClick={startVideo} disabled={isConnected}>
          Start Video Test
        </Button>
        <Button onClick={stopVideo} disabled={!isConnected} variant="destructive">
          Stop Video
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Local Video (You - Green Border)</h3>
          <video 
            ref={localVideoRef}
            className="w-full h-48 bg-black border-2 border-green-500"
            autoPlay
            playsInline
            muted
            controls
          />
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Remote Video (Stranger - Red Border)</h3>
          <video 
            ref={remoteVideoRef}
            className="w-full h-48 bg-black border-2 border-red-500"
            autoPlay
            playsInline
            controls
          />
        </div>
      </div>
      
      <div className="text-sm space-y-1">
        <p>Local Stream: {localStream ? '✅ Active' : '❌ None'}</p>
        <p>Remote Stream: {remoteStream ? '✅ Active' : '❌ None'}</p>
        <p>Connection: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
      </div>
    </div>
  );
}