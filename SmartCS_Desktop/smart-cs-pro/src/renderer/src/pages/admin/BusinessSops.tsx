import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Loader2, RefreshCw, X, Plus, Save, Trash2, Edit3, ShieldAlert, Tag, Search, FileType, Image as ImageIcon, FileCode, Paperclip
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

export default function BusinessSopsPage() {
  const { token, hasPermission, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE'>('NONE')
  const [editItem, setEditItem] = useState<any>(null)

  const isHQ = user?.role_id === 3 || user?.role_code === 'HQ'

  const { data: sopData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['business_sops_admin', page, search],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/sops?page=${page}&size=10&search=${encodeURIComponent(search)}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data
    },
    enabled: !!token
  })

  const { data: depts = [] } = useQuery({
    queryKey: ['departments_all_sop'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments?size=100`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data.data
    },
    enabled: !!token && isHQ
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return window.api.callApi({ url: `${CONFIG.API_BASE}/ai/sops`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: payload })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_sops_admin'] })
      setModalType('NONE'); toast.success('SOP规范已同步')
    }
  })

  const listData = sopData?.data || []
  const total = sopData?.total || 0

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'MD': return <FileCode className="text-cyan-500" size={16}/>
      case 'IMAGE': return <ImageIcon className="text-amber-500" size={16}/>
      case 'FILE': return <Paperclip className="text-purple-500" size={16}/>
      default: return <FileText className="text-slate-400" size={16}/>
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-3xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">SOP 业务规范库</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic text-emerald-600">管理各业务维度的标准操作流程 · 支持文字、Markdown、图片及多媒体附件</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} placeholder="搜索 SOP 标题..." className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-64 outline-none" />
           </div>
           <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 transition-all"><RefreshCw size={18} className={cn((isLoading || isFetching) && "animate-spin")} /></button>
           {hasPermission('admin:sop:create') && (
             <button onClick={() => { setEditItem({ title: '', content: '', sop_type: 'TEXT', department_id: isHQ ? 'GLOBAL' : user?.department_id }); setModalType('EDIT'); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-xl active:scale-95 transition-all"><Plus size={16} /> 录入 SOP</button>
           )}
        </div>
      </header>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? <div className="h-64 flex flex-col items-center justify-center opacity-30"><Loader2 className="animate-spin mb-4" size={40} /></div> : (
              <TacticalTable headers={['规范标题', '内容预览', '载体类型', '作用域', '操作']}>
                {listData.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center">
                    <td className="px-8 py-5 font-black text-slate-900 text-left">{item.title}</td>
                    <td className="px-6 py-5 text-left max-w-xs truncate italic opacity-60">"{item.content}"</td>
                    <td className="px-6 py-5 text-center">
                       <span className="px-3 py-1 bg-slate-100 rounded-lg flex items-center justify-center gap-2 mx-auto w-fit border border-slate-200 text-[9px] font-black uppercase">
                          {getTypeIcon(item.sop_type)} {item.sop_type}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {!item.department_id ? <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black border border-amber-100">全域公共</span> : <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black border border-slate-200">{item.department_name || '部门专用'}</span>}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center gap-2">
                        {hasPermission('admin:sop:update') && (<button onClick={() => { setEditItem(item); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 rounded-xl transition-all"><Edit3 size={16} /></button>)}
                        {hasPermission('admin:sop:delete') && (<button onClick={() => { setEditItem(item); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>)}
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
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 p-12 overflow-y-auto max-h-[90vh]">
               <h3 className="text-2xl font-black text-slate-900 mb-8 italic uppercase flex items-center gap-3"><FileText className="text-emerald-500"/> 业务规范定义</h3>
               <div className="space-y-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">规范标题</label><input value={editItem?.title} onChange={(e)=>setEditItem({...editItem, title: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none shadow-inner outline-none" placeholder="如：售后退换货 SOP v1.2" /></div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">载体类型</label>
                      <TacticalSelect options={[{id: 'TEXT', name: '纯文本'}, {id: 'MD', name: 'Markdown'}, {id: 'IMAGE', name: '图片内容'}, {id: 'FILE', name: '外部文件路径'}]} value={editItem?.sop_type} onChange={(val) => setEditItem({...editItem, sop_type: val})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">作用域</label>
                      {isHQ ? (
                        <TacticalSelect options={[{id: 'GLOBAL', name: '全域公共'}, ...depts]} value={editItem?.department_id || 'GLOBAL'} onChange={(val) => setEditItem({...editItem, department_id: val})} />
                      ) : <div className="px-6 py-4 bg-slate-100 rounded-2xl text-xs font-black text-slate-500 border border-slate-200 uppercase">限定本部门</div>}
                    </div>
                  </div>

                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">详细内容 / 文件链接</label><textarea value={editItem?.content} onChange={(e)=>setEditItem({...editItem, content: e.target.value})} rows={6} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium border-none shadow-inner outline-none resize-none" placeholder="输入 SOP 详细说明，或图片/附件的物理 URL 地址..." /></div>

                  <button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(editItem)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 固化规范文档
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
