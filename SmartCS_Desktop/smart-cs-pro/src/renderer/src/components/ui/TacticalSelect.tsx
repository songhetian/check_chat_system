import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

export function TacticalSelect({ options, value, onChange, placeholder = "请选择...", className, showSearch = true, disabled = false }: TacticalSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = options.find(o => String(o.id) === String(value))
  
  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 每次打开时重置搜索
  useEffect(() => {
    if (!isOpen) setSearch('')
  }, [isOpen])

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black flex items-center justify-between transition-all shadow-sm group",
          disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer",
          isOpen ? "ring-2 ring-cyan-500/10 border-cyan-500 shadow-md" : (disabled ? "" : "hover:border-slate-300")
        )}
      >
        <span className={cn(selectedOption ? "text-slate-900" : "text-slate-400")}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180 text-cyan-500")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute z-[1100] w-full bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col p-1.5"
          >
            {showSearch && (
              <div className="relative mb-1.5 p-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={12} /></div>
                <input 
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="检索匹配项..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-lg text-[11px] font-bold text-slate-900 focus:ring-0 shadow-inner"
                />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">无匹配项</div>
              ) : (
                filteredOptions.map((opt) => (
                  <div 
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "px-3 py-2 rounded-lg text-[11px] font-black flex items-center justify-between cursor-pointer transition-all mb-0.5 last:mb-0",
                      String(value) === String(opt.id) ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span>{opt.name}</span>
                    {String(value) === String(opt.id) && <Check size={12} />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
