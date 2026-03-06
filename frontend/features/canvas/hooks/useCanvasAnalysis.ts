import { useState } from 'react';
import { analyzeCanvas } from '@/lib/api';

export function useCanvasAnalysis() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reflectionText, setReflectionText] = useState('');

  const handleExport = async (payload: {
    imageData: string;
    drawingMeta: { colors_used: string[]; stroke_count: number; has_htp_elements: boolean };
  }) => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeCanvas({
        image_data: payload.imageData,
        drawing_meta: payload.drawingMeta,
        reflection_text: reflectionText,
      });
      setAnalysis(result.analysis);
    } catch {
      alert('分析失败，请检查后端连接或 API 额度。');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analysis,
    isLoading,
    reflectionText,
    setReflectionText,
    handleExport,
  };
}
