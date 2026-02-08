import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, UserCog, RefreshCw, 
  Loader2, ShieldCheck, 
  Trash2, Download, X,
  ShieldAlert, Edit3, Save, CheckCircle2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
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
                <h3 className="text-lg font-black uppercase italic">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 cursor-pointer"><X size={18}/></button>
             </div>
             {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function UsersPage() {
  const { hasPermission, token } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [deptId, setDeptId] = useState<string | number>('')
  const [roleCode, setRoleCode] = useState<string | number>('')
  const [page, setPage] = useState(1)
  
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE' | 'ROLE_PICKER'>('NONE')
  const [targetUser, setTargetUser] = useState<any>(null)

  // React Query: Fetch Roles
  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/roles`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data.data
    },
    enabled: !!token
  })

  // React Query: Fetch Departments
  const deptsQuery = useQuery({
    queryKey: ['departments_all'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments?size=100`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data.data
    },
    enabled: !!token
  })

  // React Query: Fetch Users
  const usersQuery = useQuery({
    queryKey: ['users', page, search, deptId, roleCode],
    queryFn: async () => {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=${page}&size=10&search=${search}&dept_id=${deptId}&role_only=${roleCode}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data
    },
    enabled: !!token
  })

  const users = usersQuery.data?.data || []
  const total = usersQuery.data?.total || 0
  const roles = rolesQuery.data || []
  const depts = deptsQuery.data || []

  // React Query: Role Change Mutation
  const roleMutation = useMutation({
    mutationFn: async (payload: any) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/hq/user/update-role`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: payload
      })
    },
    onSuccess: (res, variables) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        const newRole = roles.find((r: any) => r.id === variables.new_role_id)
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setModalType('NONE')
        toast.success('权责已重置', { description: `操作员 ${targetUser.real_name} 已切换至 ${newRole?.name || '新角色'}` })
      }
    }
  })

  // React Query: Info Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const sanitizedData = {
        ...payload,
        department_id: payload.department_id === '' ? null : payload.department_id
      }
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents/update-info`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: sanitizedData
      })
    },
    onSuccess: (res) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setModalType('NONE')
        toast.success('信息已更新', { description: `操作员 ${targetUser.real_name} 的档案已同步` })
      }
    }
  })

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (username: string) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { username }
      })
    },
    onSuccess: (res) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setModalType('NONE')
        toast.success('节点已物理注销')
      }
    }
  })

  const isAnyLoading = usersQuery.isLoading || rolesQuery.isLoading || deptsQuery.isLoading
  const isAnyFetching = usersQuery.isFetching || rolesQuery.isFetching || deptsQuery.isFetching
  const isPending = roleMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-black">
      <header className="flex justify-between items-end bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-black uppercase italic leading-none tracking-tighter">成员角色矩阵</h2>
          <p className="text-slate-500 text-sm mt-2 font-bold flex items-center gap-2">
            管理成员姓名、所属部门及系统权限等级
            {isAnyFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 同步中</span>}
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xl active:scale-95 transition-all"><Download size={16} /> 导出清单</button>
      </header>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex-1 min-w-[240px]"><TacticalSearch value={search} onChange={setSearch} placeholder="检索姓名..." /></div>
        <div className="w-56">
          <TacticalSelect 
            options={[{id: '', name: '所有部门'}, ...depts]} 
            value={deptId} 
            onChange={(val) => { setDeptId(val); setPage(1); }} 
          />
        </div>
        <button onClick={() => usersQuery.refetch()} className="p-3 bg-slate-50 text-black rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
          <RefreshCw size={18} className={cn(isAnyFetching && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isAnyLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50">
              <Loader2 className="animate-spin" size={40} />
              <span>数据拉取中...</span>
            </div>
          ) : (
            <TacticalTable headers={['成员姓名', '用户状态', '所属部门', '当前角色 (点击切换)', '管理操作']}>
              {users.map((u: any) => (
                <tr key={u.username} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-900 text-center border-b border-slate-50">
                  <td className="px-8 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-black text-xs border border-cyan-200 shadow-inner">
                        {u.real_name?.[0] || '?'}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-black text-slate-900 leading-none">{u.real_name}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">@{u.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center">
                      {u.is_manager ? (
                        <div className="px-2.5 py-0.5 bg-cyan-600 text-white text-[9px] font-black rounded-full inline-flex items-center gap-1 shadow-sm uppercase tracking-tighter">
                          <ShieldCheck size={10} /> 部门主管
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">普通成员</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-slate-900 text-[10px] uppercase">
                    {u.dept_name || '全域通用'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => { setTargetUser(u); setModalType('ROLE_PICKER'); }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:ring-4 hover:ring-cyan-500/10 border cursor-pointer",
                          u.role_code === 'HQ' ? "bg-black text-white border-black" : "bg-white text-slate-600 border-slate-200"
                        )}
                      >
                        {u.role_name}
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                       {hasPermission('admin:user:update') && (
                         <button 
                           onClick={() => { 
                             setTargetUser({
                               ...u, 
                               department_id: (u.department_id === null || u.department_id === undefined) ? '' : u.department_id
                             }); 
                             setModalType('EDIT'); 
                           }} 
                           className="p-2 bg-slate-50 text-slate-400 hover:text-cyan-600 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 cursor-pointer" 
                           title="修订档案"
                         >
                           <Edit3 size={14} />
                         </button>
                       )}
                       {hasPermission('admin:user:delete') && (
                         <button 
                           onClick={() => { setTargetUser(u); setModalType('DELETE'); }} 
                           className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 cursor-pointer" 
                           title="注销节点"
                         >
                           <Trash2 size={14} />
                         </button>
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

      {/* Modals */}
      <PerformanceModal isOpen={modalType === 'EDIT'} onClose={() => setModalType('NONE')} title="重校成员档案" isPending={updateMutation.isPending}>
         <div className="space-y-6">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">物理姓名</label><input disabled={updateMutation.isPending} value={targetUser?.real_name || ''} onChange={(e)=>setTargetUser({...targetUser, real_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-black text-slate-900 shadow-inner outline-none" /></div>
            <div>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">所属战术部门</label>
               <TacticalSelect 
                 disabled={updateMutation.isPending} 
                 options={depts} 
                 value={targetUser?.department_id} 
                 onChange={(val)=>setTargetUser({...targetUser, department_id: val})} 
                 placeholder="指派归属部门..." 
               />
            </div>
            <button disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ username: targetUser.username, real_name: targetUser.real_name, department_id: targetUser.department_id })} className="w-full py-4 bg-black text-white rounded-xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
              {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 固化档案更改
            </button>
         </div>
      </PerformanceModal>

      <PerformanceModal isOpen={modalType === 'ROLE_PICKER'} onClose={() => setModalType('NONE')} title="权责重设中心" isPending={roleMutation.isPending}>
         <div className="space-y-6 flex flex-col">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
               <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-lg"><UserCog size={20} /></div>
               <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-900 truncate">正在重设: {targetUser?.real_name}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Identity Transmission Management</p>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
               {roles.map((r: any) => (
                 <button 
                   key={r.id} 
                   onClick={() => roleMutation.mutate({ username: targetUser.username, new_role_id: r.id })}
                   disabled={roleMutation.isPending || r.id === targetUser?.role_id}
                   className={cn(
                     "w-full p-4 rounded-2xl flex items-center justify-between transition-all group border cursor-pointer",
                     r.id === targetUser?.role_id 
                       ? "bg-cyan-50 border-cyan-200 cursor-default" 
                       : "bg-white border-slate-100 hover:border-cyan-500 hover:shadow-lg"
                   )}
                 >
                    <div className="flex items-center gap-3">
                       <div className={cn("w-2 h-2 rounded-full", r.id === targetUser?.role_id ? "bg-cyan-500 animate-pulse" : "bg-slate-200 group-hover:bg-cyan-400")} />
                       <span className={cn("text-xs font-black", r.id === targetUser?.role_id ? "text-cyan-700" : "text-slate-600")}>{r.name}</span>
                    </div>
                    {r.id === targetUser?.role_id ? <CheckCircle2 size={14} className="text-cyan-500" /> : <Shield size={14} className="text-slate-200 group-hover:text-cyan-500 opacity-0 group-hover:opacity-100 transition-all" />}
                 </button>
               ))}
            </div>
            <button onClick={() => setModalType('NONE')} className="w-full py-2 text-slate-400 text-[10px] font-black uppercase hover:text-slate-600 transition-colors">放弃此次操作</button>
         </div>
      </PerformanceModal>

      <PerformanceModal isOpen={modalType === 'DELETE'} onClose={() => setModalType('NONE')} title="危险：物理注销确认" isPending={deleteMutation.isPending}>
         <div className="space-y-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-inner"><ShieldAlert size={24} /></div>
            <h3 className="text-base font-black mb-1 italic text-red-600 uppercase">成员节点物理清除</h3>
            <p className="text-[10px] text-slate-400 font-medium px-4">注销成员 <span className="text-red-600 font-black">[@{targetUser?.username}]</span> 后，该物理链路将永久断开，账号无法恢复。</p>
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <button disabled={deleteMutation.isPending} onClick={() => setModalType('NONE')} className="py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 disabled:opacity-50 cursor-pointer">返回</button>
              <button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(targetUser.username)} className="py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                {deleteMutation.isPending && <Loader2 className="animate-spin" size={12} />} 确认清除
              </button>
            </div>
         </div>
      </PerformanceModal>
    </div>
  )
}