'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Palette, Pencil, Send, Trash2, Undo2 } from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import { canvasCopy } from '@/shared/copy/app-copy';

interface DrawingCanvasProps {
  onExport: (payload: {
    imageData: string;
    drawingMeta: {
      colors_used: string[];
      stroke_count: number;
      has_htp_elements: boolean;
    };
  }) => void;
  isLoading: boolean;
}

export default function DrawingCanvas({ onExport, isLoading }: DrawingCanvasProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [penColor, setPenColor] = useState<string>(canvasCopy.drawing.colorOptions[0]);
  const [colorsUsed, setColorsUsed] = useState<string[]>([canvasCopy.drawing.colorOptions[0]]);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [hasHouse, setHasHouse] = useState(false);
  const [hasTree, setHasTree] = useState(false);
  const [hasPerson, setHasPerson] = useState(false);
  const canvasHeight = 'clamp(320px, 52vh, 400px)';

  const clear = () => {
    sigCanvas.current?.clear();
    setStrokes([]);
  };

  const setEraser = () => {
    setPenColor('#ffffff');
  };

  const setPencil = () => {
    setPenColor(canvasCopy.drawing.colorOptions[0]);
  };

  const handleStrokeEnd = () => {
    if (!sigCanvas.current) {
      return;
    }

    const data = sigCanvas.current.toData();
    setStrokes(data);
    setColorsUsed((prev) => (prev.includes(penColor) ? prev : [...prev, penColor]));
  };

  const handleUndo = () => {
    if (!sigCanvas.current) {
      return;
    }

    const data = sigCanvas.current.toData();
    if (!data.length) {
      return;
    }

    const nextData = data.slice(0, -1);
    sigCanvas.current.fromData(nextData);
    setStrokes(nextData);
  };

  const handleAnalyze = () => {
    if (sigCanvas.current?.isEmpty()) {
      window.alert(canvasCopy.drawing.emptyAlert);
      return;
    }

    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (!dataUrl) {
      return;
    }

    onExport({
      imageData: dataUrl,
      drawingMeta: {
        colors_used: colorsUsed.filter((color) => color !== '#ffffff'),
        stroke_count: strokes.length,
        has_htp_elements: hasHouse && hasTree && hasPerson,
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mist-panel overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem]">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-[#f4f8f8] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={setPencil}
              className={`rounded-2xl p-2 transition-colors ${
                penColor === canvasCopy.drawing.colorOptions[0] ? 'bg-[#e7f1f1] text-[#406f76]' : 'text-slate-600 hover:bg-white'
              }`}
              title={canvasCopy.drawing.pencil}
            >
              <Pencil size={20} />
            </button>
            <button
              type="button"
              onClick={setEraser}
              className={`rounded-2xl p-2 transition-colors ${
                penColor === '#ffffff' ? 'bg-[#e7f1f1] text-[#406f76]' : 'text-slate-600 hover:bg-white'
              }`}
              title={canvasCopy.drawing.eraser}
            >
              <Eraser size={20} />
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-2xl p-2 text-slate-600 transition-colors hover:bg-red-100 hover:text-red-600"
              title={canvasCopy.drawing.clear}
            >
              <Trash2 size={20} />
            </button>
            <button
              type="button"
              onClick={handleUndo}
              className="rounded-2xl p-2 text-slate-600 transition-colors hover:bg-white"
              title={canvasCopy.drawing.undo}
            >
              <Undo2 size={20} />
            </button>
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-2">
              <Palette size={16} className="text-slate-400" />
              {canvasCopy.drawing.colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPenColor(color)}
                  className={`h-5 w-5 rounded-full border ${
                    penColor === color ? 'ring-2 ring-[#8cb8b4]' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`颜色 ${color}`}
                />
              ))}
            </div>
          </div>

          <LoadingButton
            type="button"
            onClick={handleAnalyze}
            loading={isLoading}
            loadingText={canvasCopy.drawing.analyzing}
            icon={<Send size={18} />}
            className="mist-primary-button inline-flex w-full items-center justify-center gap-2 rounded-[1.15rem] px-4 py-2 text-sm font-semibold sm:w-auto sm:rounded-2xl sm:px-6"
          >
            {canvasCopy.drawing.analyze}
          </LoadingButton>
        </div>

        <div className="cursor-crosshair bg-white">
          <SignatureCanvas
            ref={sigCanvas}
            penColor={penColor}
            onEnd={handleStrokeEnd}
            canvasProps={{
              className: 'w-full',
              style: { width: '100%', height: canvasHeight, touchAction: 'none' },
            }}
          />
        </div>
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-[#d9ebe7] bg-[#f3f9f8] p-3.5 sm:rounded-[1.5rem] sm:p-4">
        <h4 className="mb-1 text-sm font-bold text-[#406f76]">{canvasCopy.drawing.htpTitle}</h4>
        <p className="text-xs leading-6 text-[#5f8e94]">{canvasCopy.drawing.htpDescription}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#406f76] sm:gap-4">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={hasHouse} onChange={(event) => setHasHouse(event.target.checked)} />
            {canvasCopy.drawing.hasHouse}
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={hasTree} onChange={(event) => setHasTree(event.target.checked)} />
            {canvasCopy.drawing.hasTree}
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={hasPerson} onChange={(event) => setHasPerson(event.target.checked)} />
            {canvasCopy.drawing.hasPerson}
          </label>
        </div>
      </div>
    </div>
  );
}
