import { 
  FileSpreadsheet, Plus, Search, Copy, Edit3, Trash2, Target, Zap, Tag, Loader2, Package, RefreshCw, X, ShieldAlert
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

export default function ProductsPage() {
  const { token, hasPermission } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalType, setModalType] = useState<'NONE' | 'DELETE'>('NONE')
  const [targetItem, setTargetItem] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const fetchProducts = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/products?page=${page}&size=12&search=${searchTerm}&_t=${Date.now()}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setProducts(res.data.data)
        setTotal(res.data.total)
        if (silent) {
          toast.success('资产已对齐', { description: '商品战术库已同步至最新物理刻度' })
        }
      }
    } catch (e) { console.error('资产同步故障', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [page, token])

  const executeDelete = async () => {
    if (!targetItem || !token || processing) return
    setProcessing(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/products/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id: targetItem.id }
      })
      if (res.data.status === 'ok') {
        setModalType('NONE'); 
        fetchProducts(false); // Visible refresh
        toast.success('战术资产已移除', { description: `商品 ${targetItem.name} 已从库中物理注销` })
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">商品战术资产库</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">配置实战话术锚点、核心卖点矩阵与实时库存支持</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all"><FileSpreadsheet size={16} /> 批量同步 EXCEL</button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all hover:bg-slate-800"><Plus size={16} /> 录入新资产</button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex gap-4 shrink-0">
        <TacticalSearch value={searchTerm} onChange={setSearchTerm} onSearch={() => { setPage(1); fetchProducts(false); }} placeholder="搜索商品名称、SKU 或战术锚点..." className="flex-1" />
        <button onClick={() => fetchProducts(false)} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
          <RefreshCw size={18} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>资产对齐中...</span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode='popLayout'>
              {products.map((product) => (
                <motion.div layout key={product.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all group relative overflow-hidden flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100 shadow-inner"><Package size={24} /></div>
                    <div className="flex gap-1">
                      {hasPermission('admin:asset:update') && <button className="p-2 text-slate-400 hover:text-cyan-600 transition-colors"><Edit3 size={16} /></button>}
                      {hasPermission('admin:asset:delete') && <button onClick={() => { setTargetItem(product); setModalType('DELETE'); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}
                    </div>
                  </div>
                  <div><h3 className="text-base font-black text-slate-900 leading-tight mb-1 truncate">{product.name}</h3><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">SKU: {product.sku}</span></div>
                  <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-xs text-slate-600 leading-relaxed line-clamp-3">"{product.usp}"</div>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-4"><span className="text-xl font-black text-slate-900 italic">¥{Number(product.price).toLocaleString()}</span><div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase leading-none">实时库存</p><p className={cn("text-sm font-black mt-1", Number(product.stock) < 10 ? "text-red-500" : "text-cyan-600")}>{product.stock}</p></div></div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {total > 12 && (
        <div className="shrink-0 bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm"><TacticalPagination total={total} pageSize={12} currentPage={page} onPageChange={setPage} /></div>
      )}

      {/* 删除确认模态框 */}
      <AnimatePresence>
        {modalType === 'DELETE' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processing && setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 text-center">
               <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner"><ShieldAlert size={40} className="animate-pulse" /></div>
               <h3 className="text-xl font-black mb-2 italic">物理注销战术资产？</h3>
               <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed px-4 text-center">您正在移除 <span className="text-red-600 font-black">[{targetItem?.name}]</span>。此操作将受到动作级权限 <span className="text-slate-900 font-black">[admin:asset:delete]</span> 的严密监管。</p>
               <div className="grid grid-cols-2 gap-4">
                  <button disabled={processing} onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all disabled:opacity-50">放弃动作</button>
                  <button disabled={processing} onClick={executeDelete} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100">
                    {processing && <Loader2 className="animate-spin" size={16} />} 确认物理注销
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}