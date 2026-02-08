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
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black flex items-center justify-between transition-all shadow-sm group cursor-pointer",
          disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "",
          isOpen ? "ring-2 ring-cyan-500/20 border-cyan-500 shadow-lg" : (disabled ? "" : "hover:border-cyan-400")
        )}
      >
        <span className={cn(selectedOption ? "text-black" : "text-slate-400")}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180 text-cyan-600")} />
      </div>

      {isOpen && (
        <div 
          className="absolute z-[1100] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col p-2 animate-in fade-in zoom-in-95 duration-100"
        >
          {showSearch && (
            <div className="relative mb-2">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600"><Search size={14} /></div>
              <input 
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="检索匹配项..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-[11px] font-black text-black focus:ring-2 focus:ring-cyan-500/20 outline-none"
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar scroll-smooth">
            {filteredOptions.length === 0 ? (
              <div className="p-6 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest flex flex-col items-center gap-2">
                 <Search size={24} className="opacity-20" />
                 无匹配战术单元
              </div>
            ) : (
              filteredOptions.map((opt: Option) => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-between cursor-pointer transition-colors active:scale-[0.98]",
                    String(value) === String(opt.id) ? "bg-black text-white shadow-lg" : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
                  )}
                >
                  <span className="truncate pr-4">{opt.name}</span>
                  {String(value) === String(opt.id) && <Check size={14} className="text-cyan-400 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}