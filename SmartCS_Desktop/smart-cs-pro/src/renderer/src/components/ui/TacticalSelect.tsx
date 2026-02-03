import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
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
}

export function TacticalSelect({ options, value, onChange, placeholder = "请选择...", className }: TacticalSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = options.find(o => o.id === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold flex items-center justify-between cursor-pointer transition-all shadow-inner group",
          isOpen ? "ring-2 ring-cyan-500/20 bg-white" : "hover:bg-slate-100"
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
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute z-[1100] w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.length === 0 && (
                <div className="p-4 text-center text-xs font-bold text-slate-300 italic">暂无可选分类</div>
              )}
              {options.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "px-4 py-3 rounded-xl text-xs font-black flex items-center justify-between cursor-pointer transition-all mb-1 last:mb-0",
                    value === opt.id ? "bg-cyan-500 text-white shadow-lg" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span>{opt.name}</span>
                  {value === opt.id && <Check size={14} />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
