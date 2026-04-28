'use client';

import React, { useEffect, useRef } from 'react';

import { analyzeEmotionFrame } from '@/shared/api';

interface FaceMonitorProps {
  enabled: boolean;
  onEmotionUpdate: (emotions: Record<string, number>) => void;
}

export default function FaceMonitor({ enabled, onEmotionUpdate }: FaceMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(0);
  const [dominantEmotion, setDominantEmotion] = React.useState<string>('off');

  useEffect(() => {
    const stopAll = () => {
      sessionRef.current += 1;

      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      inFlightRef.current = false;
      setDominantEmotion('off');
    };

    if (!enabled) {
      stopAll();
      return;
    }

    const startCamera = async () => {
      const currentSession = sessionRef.current + 1;
      sessionRef.current = currentSession;

      try {
        setDominantEmotion('no face');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
        });

        if (sessionRef.current !== currentSession) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Face monitor init failed:', error);
        setDominantEmotion('denied');
      }
    };

    startCamera();

    return () => {
      stopAll();
    };
  }, [enabled]);

  const handleVideoPlay = () => {
    if (!enabled || intervalRef.current !== null) {
      return;
    }

    const currentSession = sessionRef.current;
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      canvasRef.current = canvas;
    }

    intervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4 || inFlightRef.current || sessionRef.current !== currentSession) {
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !context) {
        setDominantEmotion('error');
        return;
      }

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const imageBase64 = dataUrl.split(',')[1];

      if (!imageBase64) {
        setDominantEmotion('error');
        return;
      }

      inFlightRef.current = true;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const result = await analyzeEmotionFrame(
          {
            image_base64: imageBase64,
            mime_type: 'image/jpeg',
            capture_width: canvas.width,
            capture_height: canvas.height,
          },
          abortController.signal
        );

        if (sessionRef.current !== currentSession) {
          return;
        }

        if (!result.face_found) {
          setDominantEmotion('no face');
          return;
        }

        onEmotionUpdate(result.emotions);
        if (result.dominant_emotion && typeof result.dominant_score === 'number') {
          setDominantEmotion(`${result.dominant_emotion} ${(result.dominant_score * 100).toFixed(0)}%`);
          return;
        }

        setDominantEmotion('error');
      } catch (error) {
        if (abortController.signal.aborted || sessionRef.current !== currentSession) {
          return;
        }
        console.error('Emotion inference failed:', error);
        setDominantEmotion('error');
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
        inFlightRef.current = false;
      }
    }, 700);
  };

  return (
    <div className={`relative w-32 h-24 rounded-lg overflow-hidden border-2 shadow-lg ${enabled ? 'bg-black border-indigo-500/30' : 'bg-slate-100 border-slate-200'}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPlay={handleVideoPlay}
        className={`absolute inset-0 w-full h-full object-cover grayscale opacity-80 ${enabled ? '' : 'hidden'}`}
      />
      <div className="absolute bottom-1 right-1 flex items-center gap-1">
         <span className={`text-[10px] font-mono px-1 rounded ${enabled ? 'text-white bg-black/50' : 'text-slate-600 bg-white/80'}`}>{dominantEmotion}</span>
        <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
      </div>
      <p className={`absolute top-1 left-1 text-[8px] uppercase font-bold tracking-wider ${enabled ? 'text-white/70' : 'text-slate-500'}`}>
        {enabled ? 'AI Emotion' : 'Emotion Off'}
      </p>
    </div>
  );
}
