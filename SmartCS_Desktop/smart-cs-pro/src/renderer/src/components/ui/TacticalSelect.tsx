import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Option {
  id: string | number
  name: string
}

interface TacticalSelectProps {
  options: Option[]
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  className?: string
  showSearch?: boolean
  disabled?: boolean
}

export function TacticalSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "请选择...", 
  className, 
  showSearch = true, 
  disabled = false 
}: TacticalSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = options.find(o => String(o.id) === String(value))
  
  const filteredOptions = useMemo(() => options.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase())
  ), [options, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) setSearch('')
  }, [isOpen])

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* 选择框触发器 */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black flex items-center justify-between transition-colors shadow-sm group cursor-pointer",
          disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:border-cyan-400",
          isOpen ? "ring-2 ring-cyan-500/20 border-cyan-500 shadow-lg" : ""
        )}
      >
        <span className={cn(selectedOption ? "text-slate-900" : "text-slate-400")}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180 text-cyan-600")} />
      </div>

      {/* 下拉列表容器 */}
      {isOpen && (
        <div 
          style={{ willChange: 'transform, opacity' }}
          className="absolute z-[1100] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col p-2 animate-in fade-in zoom-in-95 duration-100"
        >
          {showSearch && (
            <div className="relative mb-2 shrink-0">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600"><Search size={14} /></div>
              <input 
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索项..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-[11px] font-black text-black focus:ring-2 focus:ring-cyan-500/20 outline-none"
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-0.5 no-scrollbar overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="p-6 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest flex flex-col items-center gap-2">
                 无匹配结果
              </div>
            ) : (
              filteredOptions.map((opt: Option) => {
                const isSelected = String(value) === String(opt.id)
                return (
                  <div 
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors",
                      isSelected 
                        ? "bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-500/20" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <span className="truncate pr-4">{opt.name}</span>
                    {isSelected && <Check size={14} className="text-cyan-500 shrink-0" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}