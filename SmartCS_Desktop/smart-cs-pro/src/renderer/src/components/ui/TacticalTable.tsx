import React from 'react'
import { cn } from '../../lib/utils'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

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

export const TacticalPagination = ({ total, pageSize, currentPage, onPageChange }: TacticalPaginationProps) => {
  const totalPages = Math.ceil(total / pageSize)
  
  // 生成页码逻辑 (支持缩略显示)
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  const PageButton = ({ page, active = false, disabled = false, icon: Icon }: any) => (
    <button
      onClick={() => typeof page === 'number' && onPageChange(page)}
      disabled={disabled || page === '...'}
      className={cn(
        "w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all",
        active 
          ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" 
          : "bg-white border border-slate-200 text-slate-600 hover:border-cyan-500 hover:text-cyan-600 disabled:opacity-30 shadow-sm"
      )}
    >
      {Icon ? <Icon size={14} /> : page}
    </button>
  )

  return (
    <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center shrink-0 font-sans">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">战术数据分页</span>
        <p className="text-[9px] text-slate-400 font-medium">总计 {total} 条记录 / 共 {totalPages} 页</p>
      </div>

      <div className="flex items-center gap-1.5">
        {/* 首页 */}
        <PageButton page={1} disabled={currentPage === 1} icon={ChevronsLeft} />
        
        {/* 上一页 */}
        <PageButton page={currentPage - 1} disabled={currentPage === 1} icon={ChevronLeft} />

        {/* 动态页码 */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((p, i) => (
            <PageButton 
              key={i} 
              page={p} 
              active={p === currentPage} 
            />
          ))}
        </div>

        {/* 下一页 */}
        <PageButton page={currentPage + 1} disabled={currentPage === totalPages} icon={ChevronRight} />

        {/* 末页 */}
        <PageButton page={totalPages} disabled={currentPage === totalPages} icon={ChevronsRight} />
      </div>
    </div>
  )
}