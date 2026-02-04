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
}

export function TacticalSelect({ options, value, onChange, placeholder = "请选择...", className, showSearch = true }: TacticalSelectProps) {
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
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black flex items-center justify-between cursor-pointer transition-all shadow-sm group",
          isOpen ? "ring-4 ring-cyan-500/10 border-cyan-500 shadow-lg" : "hover:border-slate-300"
        )}
      >
        <span className={cn(selectedOption ? "text-slate-900" : "text-slate-400")}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-300", isOpen && "rotate-180 text-cyan-500")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute z-[1100] w-full bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-2"
          >
            {showSearch && (
              <div className="relative mb-2 p-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={14} /></div>
                <input 
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="检索匹配项..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-0 shadow-inner"
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="p-6 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">中枢未发现匹配项</div>
              ) : (
                filteredOptions.map((opt) => (
                  <div 
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "px-4 py-3 rounded-xl text-xs font-black flex items-center justify-between cursor-pointer transition-all mb-1 last:mb-0",
                      String(value) === String(opt.id) ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span>{opt.name}</span>
                    {String(value) === String(opt.id) && <Check size={14} />}
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