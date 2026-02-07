import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Smile, Loader2, RefreshCw, X, Plus, Save, Trash2, Edit3, ShieldAlert, Palette, Type
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

export default function SentimentsPage() {
  const { token, hasPermission } = useAuthStore()
  const queryClient = useQueryClient()
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE'>('NONE')
  const [editItem, setEditItem] = useState<any>(null)

  // 1. 数据采集：React Query 极速缓存版
  const { data: sentiments = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['ai_sentiments'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/sentiments`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data.data
    },
    enabled: !!token,
    staleTime: 60000 // 情绪维度通常变动较慢，设为 1 分钟缓存
  })

  // 2. 变更操作
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return window.api.callApi({ 
        url: `${CONFIG.API_BASE}/ai/sentiments`, 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        data: payload 
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_sentiments'] })
      setModalType('NONE')
      toast.success('维度已锚定', { description: '客户情绪标签已同步至全站' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/ai/sentiments/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_sentiments'] })
      setModalType('NONE')
      toast.success('维度已物理卸载')
    }
  })

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic">情绪维度定义</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">管理坐席端 AI 优化时可供选择的客户情绪标签与提示词片段</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 transition-all"><RefreshCw size={18} className={cn((isLoading || isFetching) && "animate-spin")} /></button>
           {hasPermission('admin:sentiment:create') && (
             <button onClick={() => { setEditItem({ name: '', prompt_segment: '', color: 'slate', is_active: 1 }); setModalType('EDIT'); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-xl active:scale-95 transition-all"><Plus size={16} /> 录入新维度</button>
           )}
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? <div className="h-64 flex flex-col items-center justify-center opacity-30"><Loader2 className="animate-spin mb-4" size={40} /><span className="text-xs font-black">调取中...</span></div> : (
              <TacticalTable headers={['情绪标签', 'AI 提示词片段', 'UI 配色', '状态', '操作']}>
                {sentiments.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center">
                    <td className="px-8 py-5 font-black text-slate-900">
                       <span className={cn("px-3 py-1 rounded-lg border font-black", `bg-${item.color}-50 text-${item.color}-600 border-${item.color}-100`)}>{item.name}</span>
                    </td>
                    <td className="px-6 py-5 text-left italic opacity-70">"{item.prompt_segment}"</td>
                    <td className="px-6 py-5 text-center capitalize">{item.color}</td>
                    <td className="px-6 py-5">{item.is_active ? <span className="text-emerald-600 font-black uppercase">激活</span> : <span className="text-slate-300">禁用</span>}</td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center gap-2">
                        {hasPermission('admin:sentiment:update') && (<button onClick={() => { setEditItem(item); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>)}
                        {hasPermission('admin:sentiment:delete') && (<button onClick={() => { setEditItem(item); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </TacticalTable>
            )}
         </div>
      </div>

      <AnimatePresence>
        {modalType === 'EDIT' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 p-12">
               <h3 className="text-2xl font-black text-slate-900 mb-8 italic uppercase">情绪维度重校</h3>
               <div className="space-y-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">标签名称</label><input value={editItem?.name} onChange={(e)=>setEditItem({...editItem, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none shadow-inner outline-none" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">AI 提示词引导 (Prompt Segment)</label><textarea value={editItem?.prompt_segment} onChange={(e)=>setEditItem({...editItem, prompt_segment: e.target.value})} rows={3} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium border-none shadow-inner outline-none resize-none" /></div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">UI 视觉颜色</label>
                    <TacticalSelect options={[{id: 'red', name: '红色 (高危)'}, {id: 'amber', name: '琥珀色 (预警)'}, {id: 'emerald', name: '翡翠绿 (正常)'}, {id: 'slate', name: '深灰色 (普通)'}, {id: 'cyan', name: '科技蓝 (特殊)'}]} value={editItem?.color} onChange={(val) => setEditItem({...editItem, color: val})} />
                  </div>
                  <button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(editItem)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 固化维度逻辑
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalType === 'DELETE' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !deleteMutation.isPending && setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-12 text-center">
               <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6"><ShieldAlert size={40} /></div>
               <h3 className="text-xl font-black text-slate-900 mb-2 italic">注销情绪维度？</h3>
               <p className="text-xs text-slate-400 font-medium mb-8">此操作将移除坐席端的对应选项。</p>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">取消</button>
                  <button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(editItem.id)} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-600 active:scale-95">
                    {deleteMutation.isPending && <Loader2 className="animate-spin" size={16} />} 确认物理清除
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}