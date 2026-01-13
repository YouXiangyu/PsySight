'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, AlertCircle, Menu, Activity } from 'lucide-react';
import { chatWithAI } from '@/lib/api';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommended_scale?: {
    id: number;
    title: string;
  };
  isError?: boolean;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是 PsySight 心理助手。最近感觉怎么样？有什么想和我聊聊的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    // 立即显示用户消息
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const data = await chatWithAI(userMsg);
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply,
        recommended_scale: data.recommended_scale_id ? {
          id: data.recommended_scale_id,
          title: data.recommended_scale_title
        } : undefined
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '连接 AI 服务失败。请检查后端是否启动。',
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      {/* 移动端顶部栏 (仅在小屏显示) */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Menu className="text-gray-500" />
          <span className="font-medium">PsySight</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <User size={16} className="text-gray-600" />
        </div>
      </div>
      
      {/* 顶部模型切换栏 (桌面端) */}
      <div className="hidden md:flex items-center justify-center p-2 pt-4 sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition text-sm font-medium text-gray-700">
          <span>PsySight 3.0</span>
          <Sparkles size={14} className="text-yellow-500" />
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto w-full pb-32" ref={scrollRef}>
        <div className="flex flex-col text-sm md:text-base">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`w-full border-b border-black/5 ${
                msg.role === 'assistant' ? 'bg-[#f7f7f8]' : 'bg-white'
              }`}
            >
              <div className="max-w-3xl mx-auto flex gap-4 p-4 md:p-6 m-auto">
                {/* 头像 */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center ${
                  msg.role === 'assistant' ? 'bg-[#19c37d]' : 'bg-[#5436DA]'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Bot size={20} className="text-white" />
                  ) : (
                    <User size={20} className="text-white" />
                  )}
                </div>

                {/* 内容 */}
                <div className="relative flex-1 overflow-hidden">
                  <div className={`prose max-w-none leading-7 text-gray-800 ${msg.isError ? 'text-red-500' : ''}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* 推荐量表卡片 */}
                  {msg.recommended_scale && (
                    <div className="mt-4 p-4 bg-white rounded-md border border-gray-200 shadow-sm md:max-w-md">
                      <div className="flex items-center gap-2 mb-2 text-indigo-600">
                        <Activity size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">推荐测评</span>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">{msg.recommended_scale.title}</h4>
                      <Link 
                        href={`/scale/${msg.recommended_scale.id}`}
                        className="inline-flex items-center justify-center w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
                      >
                        开始测评
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading 状态 */}
          {isLoading && (
            <div className="w-full bg-[#f7f7f8] border-b border-black/5">
              <div className="max-w-3xl mx-auto flex gap-4 p-4 md:p-6 m-auto">
                <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-[#19c37d] flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="flex items-center">
                  <Loader2 className="animate-spin text-gray-400" size={18} />
                </div>
              </div>
            </div>
          )}
          
          {/* 底部垫高，防止内容被输入框遮挡 */}
          <div className="h-12 md:h-24 flex-shrink-0" />
        </div>
      </div>

      {/* 底部输入框区域 */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end w-full p-3 bg-white border border-gray-200 shadow-md rounded-xl focus-within:ring-1 focus-within:ring-black/10 focus-within:border-black/10 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="发送消息..."
              className="flex-1 max-h-[200px] min-h-[24px] bg-transparent border-none focus:ring-0 resize-none py-2 px-2 text-base text-gray-800 placeholder-gray-400"
              rows={1}
              style={{ height: 'auto', overflowY: input.length > 50 ? 'auto' : 'hidden' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-md transition-colors ${
                input.trim() && !isLoading 
                  ? 'bg-[#19c37d] text-white hover:bg-[#1a885d]' 
                  : 'bg-transparent text-gray-300 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-400">
              PsySight 可能会生成不准确的信息。本工具不作为医疗诊断依据。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
