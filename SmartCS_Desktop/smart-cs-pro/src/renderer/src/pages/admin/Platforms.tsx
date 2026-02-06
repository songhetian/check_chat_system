import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Plus, Trash2, Loader2, RefreshCw, ShieldAlert, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'

// Lightweight Performance Modal
function PerformanceModal({ isOpen, onClose, title, children, isPending }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isPending && onClose()} className="absolute inset-0 bg-slate-900/40" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-md rounded-[32px] shadow-xl z-10 bg-white p-8 text-center">
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

export default function PlatformsPage() {
  const { hasPermission, token } = useAuthStore()
  const queryClient = useQueryClient()
  const [modalType, setModalType] = useState<'NONE' | 'DELETE'>('NONE')
  const [targetItem, setTargetItem] = useState<any>(null)

  // React Query: Fetch Platforms
  const { data: platforms = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/platforms?page=1&size=50`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data.data
    },
    enabled: !!token
  })

  // React Query: Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (p: any) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/platforms/update`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id: p.id, is_active: p.is_active ? 0 : 1 }
      })
    },
    onSuccess: (_, p) => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      toast.success(p.is_active ? '监控节点已暂停' : '监控节点已激活')
    }
  })

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/platforms/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      setModalType('NONE')
      toast.success('监控节点已移除')
    }
  })

  const handleToggle = (p: any) => {
    if (!hasPermission('admin:platform:update')) {
      toast.error('权限不足', { description: '缺失 [admin:platform:update] 权限' })
      return
    }
    updateMutation.mutate(p)
  }

  const executeDelete = () => {
    if (!targetItem || !token || deleteMutation.isPending) return
    deleteMutation.mutate(targetItem.id)
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic text-tactical-glow">战术目标管理</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            定义系统需要实时扫描和拦截的聊天软件窗口
            {isFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 同步中</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
            <RefreshCw size={18} className={cn((isLoading || isFetching) && "animate-spin")} />
          </button>
          {hasPermission('admin:platform:create') && (
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all hover:bg-slate-800">
              <Plus size={16} /> 增加监控目标
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>节点同步中...</span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((p: any) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:border-cyan-500/30 transition-all flex flex-col"
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
                        onClick={() => { setTargetItem(p); setModalType('DELETE'); }} 
                        disabled={updateMutation.isPending && updateMutation.variables?.id === p.id}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-black text-slate-900 text-lg mb-1">{p.name}</h3>
                <div className="flex items-center gap-2 mb-6">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">窗口特征码:</span>
                   <span className="text-[10px] font-black px-2 py-0.5 bg-slate-900 text-white rounded shadow-sm">{p.keyword}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", p.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{p.is_active ? 'Active' : 'Paused'}</span>
                   </div>
                   {hasPermission('admin:platform:update') && (
                     <button 
                       onClick={() => handleToggle(p)}
                       disabled={updateMutation.isPending && updateMutation.variables?.id === p.id}
                       className={cn(
                         "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100",
                         p.is_active ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20"
                       )}
                     >
                       {updateMutation.isPending && updateMutation.variables?.id === p.id && <Loader2 size={12} className="animate-spin" />}
                       {p.is_active ? '暂停监控' : '恢复监控'}
                     </button>
                   )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <PerformanceModal isOpen={modalType === 'DELETE'} onClose={() => setModalType('NONE')} title="注销战术目标" isPending={deleteMutation.isPending}>
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-inner"><ShieldAlert size={32} /></div>
          <h3 className="text-lg font-black mb-1 italic text-slate-900">确认注销该目标？</h3>
          <p className="text-[11px] text-slate-500 font-medium mb-6 px-4 leading-relaxed">您正在移除 <span className="text-red-600 font-black">[{targetItem?.name}]</span>。该软件将不再受到实时扫描。</p>
          <div className="grid grid-cols-2 gap-3">
            <button disabled={deleteMutation.isPending} onClick={() => setModalType('NONE')} className="py-3.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all disabled:opacity-50">放弃动作</button>
            <button disabled={deleteMutation.isPending} onClick={executeDelete} className="py-3.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {deleteMutation.isPending && <Loader2 className="animate-spin" size={14} />} 确认移除
            </button>
          </div>
      </PerformanceModal>
    </div>
  )
}
