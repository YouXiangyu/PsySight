'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Pencil, Trash2, Send, Loader2 } from 'lucide-react';

interface DrawingCanvasProps {
  onExport: (base64: string) => void;
  isLoading: boolean;
}

export default function DrawingCanvas({ onExport, isLoading }: DrawingCanvasProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [penColor, setPenColor] = useState('#000000');

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const setEraser = () => {
    setPenColor('#ffffff'); // 白色模拟橡皮擦
  };

  const setPencil = () => {
    setPenColor('#000000');
  };

  const handleAnalyze = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("画板还是空的呢，画点什么吧！");
      return;
    }
    const dataURL = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataURL) {
      onExport(dataURL);
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
            canvasProps={{
              className: "w-full h-[400px]",
              style: { width: '100%', height: '400px' }
            }}
          />
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
        <h4 className="text-sm font-bold text-indigo-800 mb-1">💡 绘画提示：房树人 (HTP)</h4>
        <p className="text-xs text-indigo-600 leading-relaxed">
          请在画布上画出<b>一个房子、一棵树和一个完整的人</b>。不需要画得很精美，随心而动即可。
          完成后，AI 将尝试通过这些元素探索你的潜意识。
        </p>
      </div>
    </div>
  );
}
