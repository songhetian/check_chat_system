import React, { useMemo } from 'react';
import { useReplyStore } from '../store/useReplyStore';
import { cn } from '../lib/utils';
import { Check, Copy, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

export const IntelligentReplyList = () => {
  const { searchQuery, replies, isExpanded, setSearchQuery } = useReplyStore();

  // 搜索逻辑：支持内容模糊匹配或拼音首字母
  const filteredReplies = useMemo(() => {
    if (!searchQuery) return [];
    return replies.filter(r => 
      r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.pinyin.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5); // 仅展示前 5 条，保持简洁
  }, [searchQuery, replies]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('已复制到剪切板', {
      style: {
        background: '#18181b',
        color: '#fff',
        fontSize: '12px',
        borderRadius: '20px',
      },
      iconTheme: {
        primary: '#22c55e',
        secondary: '#fff',
      },
    });
  };

  if (!isExpanded) return null;

  return (
    <div className="absolute top-14 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* 最近使用快速入口 */}
      {!searchQuery && (
        <div className="p-3 border-b border-white/5 bg-white/5">
          <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-tight">最近常用</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer transition-colors border border-white/5">报价查询</span>
            <span className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer transition-colors border border-white/5">售后流程</span>
          </div>
        </div>
      )}

      <div className="p-2 space-y-1">
        {filteredReplies.length > 0 ? (
          filteredReplies.map((reply) => (
            <div
              key={reply.id}
              onClick={() => handleCopy(reply.content)}
              className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-all active:scale-[0.98]"
            >
              <div className="mt-1">
                {reply.category === '主管方案' ? 
                  <Zap size={14} className="text-amber-400 group-hover:text-amber-300" /> : 
                  <Hash size={14} className="text-zinc-500 group-hover:text-blue-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium uppercase",
                    reply.category === '主管方案' ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                  )}>
                    {reply.category}
                  </span>
                  {reply.hasImage && <span className="text-[9px] text-zinc-500">[含截图]</span>}
                </div>
                <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed group-hover:text-white">
                  {reply.category === '主管方案' ? `问：${reply.question} \n答：${reply.content}` : reply.content}
                </p>
              </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="text-zinc-600 mb-2">🔍</div>
            <p className="text-xs text-zinc-500">未找到相关话术，换个关键词试试？</p>
          </div>
        )}
      </div>

            <div className="mt-1">
              <Hash size={14} className="text-zinc-500 group-hover:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium uppercase">
                  {reply.category}
                </span>
              </div>
              <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed group-hover:text-white">
                {reply.content}
              </p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Copy size={14} className="text-zinc-500" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white/5 p-2 text-center">
        <p className="text-[10px] text-zinc-500">点击项目直接复制 · 共 {filteredReplies.length} 条结果</p>
      </div>
    </div>
  );
};
