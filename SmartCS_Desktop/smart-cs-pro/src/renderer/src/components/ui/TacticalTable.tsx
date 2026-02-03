import React from 'react'
import { cn } from '../../lib/utils'

interface TacticalTableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}

export const TacticalTable = ({ headers, children, className }: TacticalTableProps) => {
  return (
    <div className={cn("w-full overflow-hidden flex flex-col", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            {headers.map((h, i) => (
              <th key={i} className="px-8 py-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {children}
        </tbody>
      </table>
    </div>
  )
}

interface TacticalPaginationProps {
  total: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
}

import { ChevronLeft, ChevronRight } from 'lucide-react'

export const TacticalPagination = ({ total, pageSize, currentPage, onPageChange }: TacticalPaginationProps) => {
  return (
    <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center shrink-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} 条，共 {total} 条战术存档
      </span>
      <div className="flex gap-2">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage * pageSize >= total}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
