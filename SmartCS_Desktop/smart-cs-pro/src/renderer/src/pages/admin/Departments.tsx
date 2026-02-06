import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Trash2, Building2, Loader2, RefreshCw, 
  CheckCircle2, X, Edit3, Users2,
  Search, ShieldAlert, Save
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { toast } from 'sonner'

// Lightweight Performance Modal
function PerformanceModal({ isOpen, onClose, title, children, isPending }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isPending && onClose()} className="absolute inset-0 bg-slate-900/40" />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="relative w-full max-w-md rounded-xl shadow-xl z-10 bg-white p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase italic tracking-tight">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={18}/></button>
             </div>
             {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function DepartmentsPage() {
  const { hasPermission, token } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  
  const [modalType, setModalType] = useState<'NONE' | 'ADD' | 'EDIT' | 'DELETE'>('NONE')
  const [targetItem, setTargetItem] = useState<any>(null)
  const [inputName, setInputName] = useState('')
  const [managerId, setManagerId] = useState<string>('')

  // React Query: Fetch Departments
  const deptsQuery = useQuery({
    queryKey: ['departments', page, search],
    queryFn: async () => {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/departments?page=${page}&size=10&search=${search}`, 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data
    },
    enabled: !!token
  })

  // React Query: Fetch Department Users (only for EDIT modal)
  const deptUsersQuery = useQuery({
    queryKey: ['dept_users', targetItem?.id, userSearch],
    queryFn: async () => {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/departments/users?dept_id=${targetItem.id}&search=${userSearch}`, 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data.data
    },
    enabled: !!token && modalType === 'EDIT' && !!targetItem?.id
  })

  // React Query: Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const isEdit = modalType === 'EDIT'
      const endpoint = isEdit ? '/departments/update' : '/departments'
      
      // 核心清洗：manager_id 必须是数字或 null
      const sanitizedData: any = { 
        name: inputName 
      }
      
      if (isEdit) {
        sanitizedData.id = targetItem.id
        sanitizedData.manager_id = (managerId === '' || managerId === null) ? null : Number(managerId)
      }

      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin${endpoint}`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: sanitizedData
      })
    },
    onSuccess: (res) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['departments'] })
        setModalType('NONE')
        toast.success(modalType === 'EDIT' ? '架构调整已生效' : '新战术单元已就绪')
      }
    }
  })

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/departments/delete`, 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id } 
      })
    },
    onSuccess: (res) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['departments'] })
        setModalType('NONE')
        toast.success('战术单元已物理注销')
      }
    }
  })

  const depts = deptsQuery.data?.data || []
  const total = deptsQuery.data?.total || 0
  const deptUsers = deptUsersQuery.data || []
  const isPending = saveMutation.isPending || deleteMutation.isPending

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">部门架构管理</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            配置公司业务部门，实现数据隔离与成员归属管理
            {deptsQuery.isFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 同步中</span>}
          </p>
        </div>
        {hasPermission('admin:dept:create') && (
          <button onClick={() => { setInputName(''); setManagerId(''); setModalType('ADD') }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-xl active:scale-95 transition-all hover:bg-slate-800"><Plus size={16} /> 录入新部门</button>
        )}
      </header>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex-1 min-w-[240px]"><TacticalSearch value={search} onChange={setSearch} placeholder="检索部门名称..." /></div>
        <button onClick={() => deptsQuery.refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
          <RefreshCw size={18} className={cn(deptsQuery.isFetching && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {deptsQuery.isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 gap-3 font-bold uppercase italic tracking-widest">
              <Loader2 className="animate-spin" /> 架构拉取中...
            </div>
          ) : (
            <TacticalTable headers={['部门名称', '人员数量', '部门负责人', '运行状态', '管理操作']}>
              {depts.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group text-center">
                  <td className="px-8 py-3 text-left"><div className="flex items-center gap-3"><div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shadow-inner", d.manager__real_name ? "bg-cyan-50 text-cyan-600 border-cyan-100" : "bg-slate-50 text-slate-400 border-slate-100")}><Building2 size={14} /></div><span className="text-xs font-black text-slate-900">{d.name}</span></div></td>
                  <td className="px-6 py-3 font-bold text-slate-600"><div className="flex items-center justify-center gap-2"><Users2 size={12} className="text-slate-300" /><span className="text-xs">{d.member_count} <span className="text-[9px] opacity-40 italic">人</span></span></div></td>
                  <td className="px-6 py-3">{d.manager__real_name ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-black shadow-sm">{d.manager__real_name[0]}</div><span className="text-xs font-black text-slate-700">{d.manager__real_name}</span></div> : <span className="text-[10px] text-slate-300 font-bold italic">未指派</span>}</td>
                  <td className="px-6 py-3 font-black italic text-[10px] text-emerald-600 uppercase tracking-widest">正常运行</td>
                  <td className="px-8 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {hasPermission('admin:dept:update') && (
                        <button onClick={() => { setTargetItem(d); setInputName(d.name); setManagerId(d.manager_id || ''); setModalType('EDIT') }} className="p-2 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all shadow-sm"><Edit3 size={14} /></button>
                      )}
                      {hasPermission('admin:dept:delete') && (
                        <button onClick={() => { setTargetItem(d); setModalType('DELETE') }} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-sm"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
        {total > 10 && <div className="shrink-0 border-t border-slate-100 bg-white p-2"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      <PerformanceModal isOpen={modalType === 'ADD' || modalType === 'EDIT'} onClose={() => setModalType('NONE')} title={modalType === 'ADD' ? '录入新部门' : '编辑部门架构'} isPending={saveMutation.isPending}>
        <div className="space-y-6">
          <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">部门名称</label><input disabled={saveMutation.isPending} autoFocus value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="请输入名称..." className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-black text-slate-900 shadow-inner disabled:opacity-50" /></div>
          {modalType === 'EDIT' && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">指派部门负责人</label>
              <div className="relative group"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-500 transition-colors"><Search size={12} /></div><input disabled={saveMutation.isPending} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="检索负责人姓名..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 shadow-inner disabled:opacity-50" /></div>
              <div className="max-h-36 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl p-1.5 bg-slate-50/30">
                 {deptUsers.map((u: any) => (
                   <div key={u.id} onClick={() => !saveMutation.isPending && setManagerId(u.id)} className={cn("p-2 rounded-lg cursor-pointer flex justify-between items-center transition-all mb-1 last:mb-0", managerId == u.id ? "bg-cyan-500 text-white shadow-md" : "hover:bg-white text-slate-600", saveMutation.isPending && "opacity-50 cursor-not-allowed")}>
                      <span className="text-[11px] font-black">{u.real_name} <span className={cn("text-[9px] opacity-50 ml-1 font-mono", managerId == u.id ? "text-white" : "text-slate-400")}>@{u.username}</span></span>
                      {managerId == u.id && <CheckCircle2 size={12} />}
                   </div>
                 ))}
                 {deptUsers.length === 0 && <div className="p-4 text-center text-[10px] text-slate-300 italic font-bold">无匹配人员</div>}
              </div>
            </div>
          )}
          <button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {saveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 保存架构更改
          </button>
        </div>
      </PerformanceModal>

      <PerformanceModal isOpen={modalType === 'DELETE'} onClose={() => setModalType('NONE')} title="彻底删除部门确认" isPending={deleteMutation.isPending}>
        <div className="space-y-6 flex flex-col items-center text-center">
           <div className="w-16 h-16 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-inner"><ShieldAlert size={32} /></div>
           <div><h4 className="text-base font-black text-slate-900 mb-1 italic text-center">确认删除该部门？</h4><p className="text-[10px] text-slate-500 font-medium leading-relaxed px-4 text-center">删除 <span className="text-red-600 font-black">[{targetItem?.name}]</span> 后，该部门关联的所有配置将失效。</p></div>
           <div className="grid grid-cols-2 gap-3 w-full">
              <button disabled={deleteMutation.isPending} onClick={() => setModalType('NONE')} className="py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all disabled:opacity-50">取消</button>
              <button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(targetItem.id)} className="py-2.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                 {deleteMutation.isPending && <Loader2 className="animate-spin" size={14} />} 确认彻底删除
              </button>
           </div>
        </div>
      </PerformanceModal>
    </div>
  )
}
