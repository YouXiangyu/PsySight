'use client';

import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

interface FaceMonitorProps {
  onEmotionUpdate: (emotions: Record<string, number>) => void;
}

export default function FaceMonitor({ onEmotionUpdate }: FaceMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [dominantEmotion, setDominantEmotion] = React.useState<string>('wait...');

  useEffect(() => {
    const loadModels = async () => {
      // 这里的模型路径可能需要根据您的 public 文件夹结构调整
      // 建议将 weights 下载到本地 public/models 目录以加快加载
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        startVideo();
      } catch (e) {
        console.error("FaceAPI load failed:", e);
      }
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then((stream) => {
          streamRef.current = stream; // 保存流引用以便清理
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera access denied:", err);
        });
    };

    loadModels();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // 使用保存的流引用进行清理
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleVideoPlay = () => {
    intervalRef.current = setInterval(async () => {
      if (videoRef.current) {
        // 确保视频已经准备好
        if (videoRef.current.readyState === 4) {
             const detections = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceExpressions();

          if (detections) {
            const exps = detections.expressions as Record<string, number>;
            onEmotionUpdate(exps);
            
            // 找出最显著的情绪用于 UI 展示
            const maxEmotion = Object.entries(exps).reduce((a, b) => a[1] > b[1] ? a : b);
            setDominantEmotion(`${maxEmotion[0]} ${(maxEmotion[1] * 100).toFixed(0)}%`);
          }
        }
      }
    }, 500);
  };

  return (
    <div className="relative w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-indigo-500/30 shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPlay={handleVideoPlay}
        className="absolute inset-0 w-full h-full object-cover grayscale opacity-80"
      />
      <div className="absolute bottom-1 right-1 flex items-center gap-1">
         <span className="text-[10px] text-white font-mono bg-black/50 px-1 rounded">{dominantEmotion}</span>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      </div>
      <p className="absolute top-1 left-1 text-[8px] text-white/70 uppercase font-bold tracking-wider">AI Emotion</p>
    </div>
  );
}
