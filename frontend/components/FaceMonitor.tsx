'use client';

import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

interface FaceMonitorProps {
  enabled: boolean;
  onEmotionUpdate: (emotions: Record<string, number>) => void;
}

export default function FaceMonitor({ enabled, onEmotionUpdate }: FaceMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number>();
  const modelsLoadedRef = useRef(false);
  const [dominantEmotion, setDominantEmotion] = React.useState<string>('wait...');

  useEffect(() => {
    const stopAll = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setDominantEmotion('off');
    };

    if (!enabled) {
      stopAll();
      return;
    }

    const loadModelsAndStart = async () => {
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      try {
        if (!modelsLoadedRef.current) {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          ]);
          modelsLoadedRef.current = true;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Face monitor init failed:', error);
        setDominantEmotion('denied');
      }
    };

    loadModelsAndStart();

    return () => {
      stopAll();
    };
  }, [enabled]);

  const handleVideoPlay = () => {
    if (!enabled) return;
    intervalRef.current = window.setInterval(async () => {
      if (videoRef.current) {
        if (videoRef.current.readyState === 4) {
          const detections = await faceapi
            .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceExpressions();

          if (detections) {
            const exps = detections.expressions as unknown as Record<string, number>;
            onEmotionUpdate(exps);
            
            const maxEmotion = Object.entries(exps).reduce((a, b) => a[1] > b[1] ? a : b);
            setDominantEmotion(`${maxEmotion[0]} ${(maxEmotion[1] * 100).toFixed(0)}%`);
          }
        }
      }
    }, 500);
  };

  return (
    <div className={`relative h-20 w-28 overflow-hidden rounded-2xl border-2 shadow-lg sm:h-24 sm:w-32 ${enabled ? 'border-indigo-500/30 bg-black' : 'border-slate-200 bg-slate-100'}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPlay={handleVideoPlay}
        className={`absolute inset-0 h-full w-full object-cover grayscale opacity-80 ${enabled ? '' : 'hidden'}`}
      />
      <div className="absolute bottom-1 right-1 flex items-center gap-1">
        <span className={`rounded px-1 text-[10px] font-mono ${enabled ? 'bg-black/50 text-white' : 'bg-white/80 text-slate-600'}`}>
          {dominantEmotion}
        </span>
        <div className={`h-2 w-2 rounded-full ${enabled ? 'animate-pulse bg-red-500' : 'bg-slate-300'}`} />
      </div>
      <p className={`absolute left-1 top-1 text-[7px] font-bold uppercase tracking-wider sm:text-[8px] ${enabled ? 'text-white/70' : 'text-slate-500'}`}>
        {enabled ? 'AI Emotion' : 'Emotion Off'}
      </p>
    </div>
  );
}
