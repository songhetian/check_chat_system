import React from 'react'
import { Search, X, Command } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TacticalSearchProps {
  value: string
  onChange: (val: string) => void
  onSearch?: () => void
  placeholder?: string
  className?: string
}

export const TacticalSearch = ({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = "搜索...", 
  className 
}: TacticalSearchProps) => {
  return (
    <div className={cn("relative group w-full max-w-sm", className)}>
      {/* 搜索图标 */}
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-500 transition-colors" />
      
      {/* 输入框核心 */}
      <input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
        placeholder={placeholder}
        className={cn(
          "w-full bg-slate-50/50 border border-slate-200 rounded-lg py-2 pl-10 pr-10 text-xs text-slate-900",
          "placeholder:text-slate-400 font-medium transition-all duration-300",
          "focus:bg-white focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none",
          "hover:border-slate-300"
        )}
      />

      {/* 交互反馈：清除按钮 或 快捷键提示 */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value ? (
          <button 
            onClick={() => onChange('')}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={14} />
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-tighter opacity-60">
            <Command size={8} /> K
          </div>
        )}
      </div>
    </div>
  )
}
