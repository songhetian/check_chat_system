import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Plus, Trash2, Power, PowerOff, ShieldCheck, Loader2, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'

export default function PlatformsPage() {
  const { hasPermission, token } = useAuthStore()
  const [platforms, setPlatforms] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalType, setModalType] = useState<'NONE' | 'DELETE'>('NONE')
  const [targetItem, setTargetItem] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const fetchPlatforms = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/platforms?page=1&size=50`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setPlatforms(res.data.data)
        if (silent) toast.success('监控目标已同步')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlatforms() }, [token])

  const handleToggle = async (p: any) => {
    if (!hasPermission('admin:platform:update')) {
      toast.error('权限不足', { description: '缺失 [admin:platform:update] 权限' })
      return
    }
    if (processingId) return
    setProcessingId(p.id)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/platforms/update`, // 假设有更新接口
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id: p.id, is_active: p.is_active ? 0 : 1 }
      })
      if (res.data.status === 'ok') {
        fetchPlatforms(true)
        toast.success(p.is_active ? '监控节点已暂停' : '监控节点已激活', { description: `平台 [${p.name}] 状态变更已下发至引擎` })
      }
    } finally {
      setProcessingId(null)
    }
  }

  const executeDelete = async () => {
    if (!targetItem || !token || processing) return
    setProcessing(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/platforms/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id: targetItem.id }
      })
      if (res.data.status === 'ok') {
        setModalType('NONE')
        fetchPlatforms(false)
        toast.success('监控节点已移除', { description: `平台 [${targetItem.name}] 已从扫描队列中注销` })
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic text-tactical-glow">战术目标管理</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">定义系统需要实时扫描和拦截的聊天软件窗口</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchPlatforms(false)} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
          {hasPermission('admin:platform:create') && (
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all hover:bg-slate-800">
              <Plus size={16} /> 增加监控目标
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>节点同步中...</span></div>
        ) : platforms.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:border-cyan-500/30 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                p.is_active ? "bg-cyan-50 text-cyan-600 border-cyan-100 shadow-inner" : "bg-slate-50 text-slate-400 border-slate-100"
              )}>
                <Monitor size={24} />
              </div>
              <div className="flex gap-2">
                {hasPermission('admin:platform:delete') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setTargetItem(p); setModalType('DELETE'); }} 
                    disabled={!!processingId}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {processingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                )}
              </div>
            </div>

            <h3 className="font-black text-slate-900 text-lg mb-1">{p.name}</h3>
            <div className="flex items-center gap-2 mb-6">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">窗口特征码:</span>
               <span className="text-[10px] font-black px-2 py-0.5 bg-slate-900 text-white rounded shadow-sm">{p.keyword}</span>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", p.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{p.is_active ? 'Active' : 'Paused'}</span>
               </div>
               {hasPermission('admin:platform:update') && (
                 <button 
                   onClick={() => handleToggle(p)}
                   disabled={!!processingId}
                   className={cn(
                     "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100",
                     p.is_active ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20"
                   )}
                 >
                   {processingId === p.id && <Loader2 size={12} className="animate-spin" />}
                   {p.is_active ? '暂停监控' : '恢复监控'}
                 </button>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modalType === 'DELETE' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processing && setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 text-center">
               <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner"><ShieldAlert size={40} className="animate-pulse" /></div>
               <h3 className="text-xl font-black mb-2 italic">注销战术目标？</h3>
               <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed px-4 text-center">您正在移除 <span className="text-red-600 font-black">[{targetItem?.name}]</span>。系统将不再对该软件执行实时 OCR 扫描。此行为受到原子级权限 <span className="text-slate-900 font-black">[admin:platform:delete]</span> 的监管。</p>
               <div className="grid grid-cols-2 gap-4">
                  <button disabled={processing} onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all disabled:opacity-50">放弃动作</button>
                  <button disabled={processing} onClick={executeDelete} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100">
                    {processing && <Loader2 className="animate-spin" size={16} />} 确认物理移除
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
    </div>
  )
}
