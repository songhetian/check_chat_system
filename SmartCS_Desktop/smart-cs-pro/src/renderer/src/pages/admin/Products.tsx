import { 
  FileSpreadsheet, Plus, Edit3, Trash2, Loader2, Package, RefreshCw, X, ShieldAlert
} from 'lucide-react'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { useAuthStore } from '../../store/useAuthStore'
import { TacticalPagination } from '../../components/ui/TacticalTable'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  sku: string
  price: string
  usp: string
  stock: number
}

// Lightweight Performance Modal Component
function PerformanceModal({ isOpen, onClose, title, children, isPending }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isPending && onClose()} className="absolute inset-0 bg-slate-900/40" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-md rounded-xl shadow-xl z-10 bg-white p-8 text-center">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase italic tracking-tight">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={20}/></button>
             </div>
             {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function ProductsPage() {
  const { token, hasPermission } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalType, setModalType] = useState<'NONE' | 'DELETE'>('NONE')
  const [targetItem, setTargetItem] = useState<any>(null)

  // React Query: Fetch Data
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['products', page, searchTerm],
    queryFn: async () => {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/products?page=${page}&size=12&search=${searchTerm}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data
    },
    enabled: !!token
  })

  const products = data?.data || []
  const total = data?.total || 0

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/products/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id }
      })
    },
    onSuccess: (res) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['products'] })
        setModalType('NONE')
        toast.success('战术资产已移除')
      }
    }
  })

  // 预留：新增/修改加固逻辑 (如果后续添加新增功能)
  const saveMutation = useMutation({
    mutationFn: async (item: any) => {
      const sanitizedData = {
        ...item,
        price: Number(item.price),
        stock: Number(item.stock)
      }
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/products`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: sanitizedData
      })
    }
  })

  const executeDelete = () => {
    if (!targetItem || !token || deleteMutation.isPending) return
    deleteMutation.mutate(targetItem.id)
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">商品战术资产库</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            配置实战话术锚点、核心卖点矩阵与实时库存支持
            {isFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 同步中</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"><FileSpreadsheet size={16} /> 批量同步 EXCEL</button>
          {hasPermission('admin:asset:create') && (
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-xl active:scale-95 transition-all hover:bg-slate-800"><Plus size={16} /> 录入新资产</button>
          )}
        </div>
      </header>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 shrink-0">
        <TacticalSearch value={searchTerm} onChange={setSearchTerm} onSearch={() => setPage(1)} placeholder="搜索商品名称、SKU 或战术锚点..." className="flex-1" />
        <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
          <RefreshCw size={18} className={cn((isLoading || isFetching) && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>资产对齐中...</span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode='popLayout'>
              {products.map((product: Product) => (
                <motion.div layout key={product.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all group relative overflow-hidden flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100 shadow-inner"><Package size={24} /></div>
                    <div className="flex gap-1">
                      {hasPermission('admin:asset:update') && <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>}
                      {hasPermission('admin:asset:delete') && <button onClick={() => { setTargetItem(product); setModalType('DELETE'); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>}
                    </div>
                  </div>
                  <div><h3 className="text-base font-black text-slate-900 leading-tight mb-1 truncate">{product.name}</h3><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">SKU: {product.sku}</span></div>
                  <div className="flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-xs text-slate-600 leading-relaxed line-clamp-3">"{product.usp}"</div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-4"><span className="text-xl font-black text-slate-900 italic">¥{Number(product.price).toLocaleString()}</span><div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase leading-none">实时库存</p><p className={cn("text-sm font-black mt-1", Number(product.stock) < 10 ? "text-red-500" : "text-cyan-600")}>{product.stock}</p></div></div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {total > 12 && (
        <div className="shrink-0 bg-white p-2 rounded-xl border border-slate-200 shadow-sm"><TacticalPagination total={total} pageSize={12} currentPage={page} onPageChange={setPage} /></div>
      )}

      {/* Performant Delete Modal */}
      <PerformanceModal isOpen={modalType === 'DELETE'} onClose={() => setModalType('NONE')} title="物理注销战术资产" isPending={deleteMutation.isPending}>
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-inner"><ShieldAlert size={32} /></div>
          <h3 className="text-lg font-black mb-1 italic text-slate-900 text-center">确认注销该商品？</h3>
          <p className="text-[11px] text-slate-500 font-medium mb-6 px-4 text-center leading-relaxed">您正在移除 <span className="text-red-600 font-black">[{targetItem?.name}]</span>。此行为将被物理审计。</p>
          <div className="grid grid-cols-2 gap-3">
            <button disabled={deleteMutation.isPending} onClick={() => setModalType('NONE')} className="py-3.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all disabled:opacity-50">放弃动作</button>
            <button disabled={deleteMutation.isPending} onClick={executeDelete} className="py-3.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {deleteMutation.isPending && <Loader2 className="animate-spin" size={14} />} 确认注销
            </button>
          </div>
      </PerformanceModal>
    </div>
  )
}