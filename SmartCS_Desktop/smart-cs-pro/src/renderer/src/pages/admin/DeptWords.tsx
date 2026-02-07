import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, Loader2, RefreshCw, X, Plus, Save, Trash2, Edit3, ShieldAlert, Tag, Building2, Search
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

export default function DeptWordsPage() {
  const { token, hasPermission, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE'>('NONE')
  const [editItem, setEditItem] = useState<any>(null)

  const isHQ = user?.role_id === 3 || user?.role_code === 'HQ'

  // 1. 数据采集
  const { data: wordsData, isLoading: wordsLoading, isFetching: wordsFetching, refetch } = useQuery({
    queryKey: ['dept_words', page, search],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/dept-words?page=${page}&size=10&search=${encodeURIComponent(search)}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data
    },
    enabled: !!token,
    staleTime: 30000
  })

  const { data: cats } = useQuery({
    queryKey: ['categories_words'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/categories?type=WORDS`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data.data
    },
    enabled: !!token
  })

  const { data: depts } = useQuery({
    queryKey: ['departments_all_words'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments?size=100`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data.data
    },
    enabled: !!token && isHQ
  })

  // 2. 变更操作
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const data = { ...payload };
      if (data.department_id === 'GLOBAL') data.department_id = null;
      return window.api.callApi({ 
        url: `${CONFIG.API_BASE}/ai/dept-words`, 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        data
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dept_words'] })
      setModalType('NONE')
      toast.success('合规规避词已同步')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/ai/dept-words/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dept_words'] })
      setModalType('NONE')
      toast.success('规避词已物理移除')
    }
  })

  const data = wordsData?.data || []
  const total = wordsData?.total || 0

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">部门规避词库</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">配置静默拦截词项及修正建议 · 触发时不报警但自动清屏并记录</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="过滤规避词..." className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-slate-900 transition-all outline-none" />
           </div>
           <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"><RefreshCw size={18} className={cn((wordsLoading || wordsFetching) && "animate-spin")} /></button>
           {hasPermission('admin:dept_word:create') && (
             <button onClick={() => { setEditItem({ word: '', suggestion: '', category_id: cats?.[0]?.id || '', department_id: isHQ ? 'GLOBAL' : user?.department_id, is_active: 1 }); setModalType('EDIT'); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-xl active:scale-95 transition-all"><Plus size={16} /> 录入规避词</button>
           )}
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {wordsLoading ? <div className="h-64 flex flex-col items-center justify-center opacity-30"><Loader2 className="animate-spin mb-4" size={40} /></div> : (
              <TacticalTable headers={['规避词', '修正建议', '业务分类', '作用域', '状态', '操作']}>
                {data.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center">
                    <td className="px-8 py-5 font-black text-slate-900">{item.word}</td>
                    <td className="px-6 py-5 text-left italic text-amber-600">"{item.suggestion}"</td>
                    <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black inline-flex items-center gap-1.5 border border-slate-200"><Tag size={10}/>{item.category__name}</span></td>
                    <td className="px-6 py-5 text-center">
                      {!item.department_id ? (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black border border-amber-100 uppercase tracking-tighter">全域</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black border border-slate-200 uppercase tracking-tighter">{item.department__name}</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">{item.is_active ? <span className="text-emerald-600 font-black">激活</span> : <span className="text-slate-300">挂起</span>}</td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center gap-2">
                        {hasPermission('admin:dept_word:update') && (isHQ || item.department_id === user?.department_id) && (
                          <button onClick={() => { setEditItem(item); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                        )}
                        {hasPermission('admin:dept_word:delete') && (isHQ || item.department_id === user?.department_id) && (
                          <button onClick={() => { setEditItem(item); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </TacticalTable>
            )}
         </div>
         {total > 10 && <div className="p-2 border-t border-slate-100"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      <AnimatePresence>
        {modalType === 'EDIT' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative z-10 p-12">
               <h3 className="text-2xl font-black text-slate-900 mb-8 italic uppercase">规避策略定义</h3>
               <div className="space-y-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">屏蔽词项</label><input value={editItem?.word || ''} onChange={(e)=>setEditItem({...editItem, word: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none shadow-inner outline-none" placeholder="输入禁忌关键词..." /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">修正建议 (显示给坐席)</label><input value={editItem?.suggestion || ''} onChange={(e)=>setEditItem({...editItem, suggestion: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium border-none shadow-inner outline-none" placeholder="建议替换为..." /></div>
                  <div className="grid grid-cols-2 gap-6">
                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">业务分类</label><TacticalSelect options={cats || []} value={editItem?.category_id} onChange={(val) => setEditItem({...editItem, category_id: val})} /></div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">作用域</label>
                      {isHQ ? (
                        <TacticalSelect options={[{id: 'GLOBAL', name: '全域公共'}, ...(depts || [])]} value={editItem?.department_id || 'GLOBAL'} onChange={(val) => setEditItem({...editItem, department_id: val})} />
                      ) : <div className="px-6 py-4 bg-slate-100 rounded-2xl text-xs font-black text-slate-500 border border-slate-200 uppercase">限定本部门</div>}
                    </div>
                  </div>
                  <button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(editItem)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 确认并生效
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
               <h3 className="text-xl font-black text-slate-900 mb-2 italic">移除该规避词？</h3>
               <p className="text-xs text-slate-400 font-medium mb-8 italic">移除后，系统将不再静默拦截该词项。</p>
               <div className="grid grid-cols-2 gap-4">
                  <button disabled={deleteMutation.isPending} onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">取消</button>
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