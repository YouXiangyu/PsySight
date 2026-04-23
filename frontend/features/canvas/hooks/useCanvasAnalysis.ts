import { useState } from 'react';
import { analyzeCanvas } from '@/lib/api';
import { canvasCopy } from '@/shared/copy/app-copy';
import { getErrorMessage } from '@/shared/ui/request-state';

export function useCanvasAnalysis() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reflectionText, setReflectionText] = useState('');

  const handleExport = async (payload: {
    imageData: string;
    drawingMeta: { colors_used: string[]; stroke_count: number; has_htp_elements: boolean };
  }) => {
    setIsLoading(true);
    setAnalysis(null);
    setError('');

    try {
      const result = await analyzeCanvas({
        image_data: payload.imageData,
        drawing_meta: payload.drawingMeta,
        reflection_text: reflectionText,
      });
      setAnalysis(result.analysis);
    } catch (err) {
      setError(getErrorMessage(err, canvasCopy.fallbackErrors.analyze));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analysis,
    error,
    isLoading,
    reflectionText,
    setReflectionText,
    handleExport,
  };
}
