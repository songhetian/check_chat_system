import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, Loader2, RefreshCw, X, Plus, Save, Trash2, Edit3, ShieldAlert, Tag, Search
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

export default function VoiceAlertsPage() {
  const { token, hasPermission, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE'>('NONE')
  const [editItem, setEditItem] = useState<any>(null)

  const isHQ = user?.role_id === 3 || user?.role_code === 'HQ'

  // 1. 数据拉取
  const { data: voiceData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['voice_alerts_admin', page, search],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/voice-alerts?page=${page}&size=10&search=${encodeURIComponent(search)}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data
    },
    enabled: !!token
  })

  // 2. 渲染优化 (V3.70 极速协议)
  const VoiceItems = useMemo(() => {
    return (voiceData?.data || []).map((item: any) => (
      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center border-b border-slate-50">
        <td className="px-8 py-5 font-black text-slate-900 text-center">
           <div className="flex items-center justify-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shadow-inner shrink-0"><Mic size={14}/></div>
             <span className="truncate max-w-md">{item.content}</span>
           </div>
        </td>
        <td className="px-6 py-5 text-center">
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-2xl text-[9px] font-black border border-slate-200 uppercase tracking-widest">物理隔离：部门专用</span>
          </div>
        </td>
        <td className="px-6 py-5 text-slate-400 text-xs font-medium text-center">
          {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
        </td>
        <td className="px-8 py-5 text-center">
          <div className="flex justify-center gap-2">
            {hasPermission('admin:voice:update') && (<button onClick={() => { setEditItem(item); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer border border-transparent hover:border-slate-200" title="修订"><Edit3 size={16} /></button>)}
            {hasPermission('admin:voice:delete') && (<button onClick={() => { setEditItem(item); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer border border-transparent hover:border-slate-200" title="移除"><Trash2 size={16} /></button>)}
          </div>
        </td>
      </tr>
    ));
  }, [voiceData?.data, hasPermission]);

  // 3. 变更操作
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      // 强制对齐后端物理隔离逻辑，不再传递 department_id
      return window.api.callApi({ url: `${CONFIG.API_BASE}/ai/voice-alerts`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: { id: payload.id, content: payload.content } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice_alerts_admin'] })
      setModalType('NONE'); toast.success('部门语音话术已固化')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return window.api.callApi({ url: `${CONFIG.API_BASE}/ai/voice-alerts/delete`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice_alerts_admin'] })
      setModalType('NONE'); toast.success('部门语音已安全移除')
    }
  })

  const listData = voiceData?.data || []
  const total = voiceData?.total || 0

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">战术语音库</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic text-red-600">管理本部门下发的语音提醒话术 · 物理链路隔离保护</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} placeholder="搜索语音内容..." className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold w-64 outline-none" />
           </div>
           <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"><RefreshCw size={18} className={cn((isLoading || isFetching) && "animate-spin")} /></button>
           {hasPermission('admin:voice:create') && (
             <button onClick={() => { setEditItem({ content: '' }); setModalType('EDIT'); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all"><Plus size={16} /> 录入语音项</button>
           )}
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? <div className="h-64 flex flex-col items-center justify-center opacity-30"><Loader2 className="animate-spin mb-4" size={40} /></div> : (
              <TacticalTable headers={['语音提醒内容', '作用域', '录入时间', '操作']}>
                {VoiceItems}
              </TacticalTable>
            )}
         </div>
         {total > 10 && <div className="p-2 border-t border-slate-100"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      <AnimatePresence>
        {modalType === 'EDIT' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 p-12">
               <h3 className="text-2xl font-black text-slate-900 mb-8 italic uppercase flex items-center gap-3"><Mic className="text-red-500"/> 语音提醒内容重校</h3>
               <div className="space-y-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">语音播放文本</label><textarea value={editItem?.content} onChange={(e)=>setEditItem({...editItem, content: e.target.value})} rows={3} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none shadow-inner outline-none resize-none" placeholder="输入本部门战术指令，坐席端将自动转为语音..." /></div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">数据归属</label>
                    <div className="px-6 py-4 bg-slate-100 rounded-2xl text-xs font-black text-slate-500 border border-slate-200 uppercase tracking-widest">物理隔离：限定本部门管理</div>
                  </div>
                  <button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(editItem)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 确认并固化
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {modalType === 'DELETE' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 p-10 text-center">
               <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldAlert size={40} /></div>
               <h3 className="text-xl font-black text-slate-900 mb-2 uppercase italic">确认注销语音项?</h3>
               <p className="text-slate-500 text-xs font-medium mb-8">此操作将物理隔离该战术指令，坐席端将不再触发相关语音提醒。</p>
               <div className="flex gap-4">
                  <button onClick={() => setModalType('NONE')} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">取消</button>
                  <button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(editItem.id)} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-200 active:scale-95 transition-all">确认注销</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
