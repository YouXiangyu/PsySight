import ChatWindow from '@/components/ChatWindow';
import Link from 'next/link';
import { PenTool, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex h-screen bg-white">
      {/* 侧边栏 (PC端显示) */}
      <div className="hidden md:flex w-[260px] flex-col bg-[#000000] text-gray-100 p-3 border-r border-gray-800 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 px-3 py-4 mb-2 hover:bg-gray-900 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-lg">P</span>
          </div>
          <h1 className="text-lg font-medium">PsySight</h1>
        </Link>
        
        <button className="flex items-center gap-3 px-3 py-3 mb-6 rounded-md border border-gray-700 hover:bg-gray-800 transition text-sm text-left text-white">
          <span className="text-lg">+</span> 
          <span>开启新对话</span>
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="text-xs font-medium text-gray-500 mb-2 px-3">功能导航</div>
          <Link href="/canvas" className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-900 cursor-pointer text-sm text-gray-300 transition-colors">
            <PenTool size={16} />
            <span>绘画投射分析</span>
          </Link>
          <div className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-900 cursor-pointer text-sm text-gray-300 transition-colors">
            <Activity size={16} />
            <span>心理量表库</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 py-3 rounded-md hover:bg-gray-900 cursor-pointer text-sm">
            <div className="w-8 h-8 rounded bg-green-600 flex items-center justify-center text-white font-bold text-xs">US</div>
            <div className="flex-1">
              <div className="font-medium text-gray-200">User</div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col h-full relative bg-white">
        <ChatWindow />
      </main>
    </div>
  );
}
