'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Pencil, Trash2, Send, Loader2, Undo2, Palette } from 'lucide-react';

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
  const [penColor, setPenColor] = useState('#000000');
  const [colorsUsed, setColorsUsed] = useState<string[]>(['#000000']);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [hasHouse, setHasHouse] = useState(false);
  const [hasTree, setHasTree] = useState(false);
  const [hasPerson, setHasPerson] = useState(false);

  const colorOptions = ['#000000', '#4f46e5', '#16a34a', '#f97316', '#db2777', '#0ea5e9'];

  const clear = () => {
    sigCanvas.current?.clear();
    setStrokes([]);
  };

  const setEraser = () => {
    setPenColor('#ffffff'); // 白色模拟橡皮擦
  };

  const setPencil = () => {
    setPenColor('#000000');
  };

  const handleStrokeEnd = () => {
    if (!sigCanvas.current) return;
    const data = sigCanvas.current.toData();
    setStrokes(data);
    setColorsUsed((prev) => (prev.includes(penColor) ? prev : [...prev, penColor]));
  };

  const handleUndo = () => {
    if (!sigCanvas.current) return;
    const data = sigCanvas.current.toData();
    if (!data.length) return;
    const newData = data.slice(0, -1);
    sigCanvas.current.fromData(newData);
    setStrokes(newData);
  };

  const handleAnalyze = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("画板还是空的呢，画点什么吧！");
      return;
    }
    const dataURL = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataURL) {
      onExport({
        imageData: dataURL,
        drawingMeta: {
          colors_used: colorsUsed.filter((color) => color !== '#ffffff'),
          stroke_count: strokes.length,
          has_htp_elements: hasHouse && hasTree && hasPerson,
        },
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* 工具栏 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={setPencil}
              className={`p-2 rounded-lg transition-colors ${penColor === '#000000' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 text-slate-600'}`}
              title="画笔"
            >
              <Pencil size={20} />
            </button>
            <button
              onClick={setEraser}
              className={`p-2 rounded-lg transition-colors ${penColor === '#ffffff' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 text-slate-600'}`}
              title="橡皮擦"
            >
              <Eraser size={20} />
            </button>
            <button
              onClick={clear}
              className="p-2 rounded-lg hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors"
              title="清空"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={handleUndo}
              className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
              title="撤销"
            >
              <Undo2 size={20} />
            </button>
            <div className="flex items-center gap-1 ml-2">
              <Palette size={16} className="text-slate-400" />
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setPenColor(color)}
                  className={`h-5 w-5 rounded-full border ${penColor === color ? 'ring-2 ring-indigo-400' : 'border-slate-200'}`}
                  style={{ backgroundColor: color }}
                  title={`颜色 ${color}`}
                />
              ))}
            </div>
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send className="mr-2" size={18} />}
            AI 分析画作
          </button>
        </div>

        {/* 画板区域 */}
        <div className="bg-white cursor-crosshair">
          <SignatureCanvas
            ref={sigCanvas}
            penColor={penColor}
            onEnd={handleStrokeEnd}
            canvasProps={{
              className: "w-full h-[400px]",
              style: { width: '100%', height: '400px' }
            }}
          />
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
        <h4 className="text-sm font-bold text-indigo-800 mb-1">绘画提示：房树人 (HTP)</h4>
        <p className="text-xs text-indigo-600 leading-relaxed">
          请在画布上画出<b>一个房子、一棵树和一个完整的人</b>。不需要画得很精美，随心而动即可。
          完成后，AI 将尝试通过这些元素探索你的潜意识。
        </p>
        <div className="flex items-center gap-4 text-xs text-indigo-700">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={hasHouse} onChange={(e) => setHasHouse(e.target.checked)} />
            已画房子
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={hasTree} onChange={(e) => setHasTree(e.target.checked)} />
            已画树
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={hasPerson} onChange={(e) => setHasPerson(e.target.checked)} />
            已画人
          </label>
        </div>
      </div>
    </div>
  );
}
