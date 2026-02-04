import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Shield, UserCog, RefreshCw, ChevronRight, 
  Loader2, Search, Filter, ShieldCheck, Mail, Building2,
  Trash2, Plus, ArrowUpRight, Upload, Download, CheckCircle2, X,
  FileSpreadsheet, AlertCircle, Award, GraduationCap, Medal
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { useAuthStore } from '../../store/useAuthStore'

export default function UsersPage() {
  const { hasPermission, token } = useAuthStore()
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [showImport, setShowImport] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const fetchData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [resRoles, resUsers] = await Promise.all([
        window.api.callApi({
          url: `${CONFIG.API_BASE}/admin/roles`, 
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        window.api.callApi({
          url: `${CONFIG.API_BASE}/admin/agents?page=${page}&size=10&search=${search}`,
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      if (resRoles.status === 200) setRoles(resRoles.data.data)
      if (resUsers.status === 200) {
        setUsers(resUsers.data.data)
        setTotal(resUsers.data.total)
      }
    } catch (e) {
      console.error('成员矩阵同步异常', e)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, search])

  const handleDownloadTemplate = () => {
    const headers = "用户名,真实姓名,部门ID,角色ID(1:坐席/2:主管/3:总部)"
    const blob = new Blob(["\ufeff" + headers], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.setAttribute("download", "SmartCS_成员导入模板.csv"); link.click()
  }

  const handleRoleChange = async (username: string, newRoleId: number) => {
    if (!token) return
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/hq/user/update-role`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      data: { username, new_role_id: newRoleId }
    })
    if (res.data.status === 'ok') {
      fetchData()
      window.dispatchEvent(new CustomEvent('trigger-toast', { detail: { title: '权限同步成功', message: `节点权限已实时重校`, type: 'success' } }))
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">成员权责矩阵</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">管理操作员身份、战术奖惩记录及新兵培训实战进度</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"><Download size={14} /> 下载模板</button>
           <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl hover:bg-slate-800 transition-all"><Upload size={14} /> 批量导入</button>
           <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl active:scale-95 transition-all"><Plus size={14} /> 录入成员</button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex gap-4 shrink-0">
        <TacticalSearch value={search} onChange={setSearch} onSearch={fetchData} placeholder="搜索姓名、账号定位节点..." className="flex-1" />
        <button onClick={fetchData} className="px-6 bg-slate-50 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-100 flex items-center gap-2 transition-all border border-slate-100"><RefreshCw size={14} className={cn(loading && "animate-spin")} /> 刷新同步</button>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>调取中枢矩阵数据...</span></div>
          ) : (
            <TacticalTable headers={['成员身份', '管理权限', '实战奖励', '培训进度', '当前角色', '权限快速重校', '操作']}>
              {users.map((u) => (
                <tr key={u.username} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600">
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black border border-cyan-100 shadow-inner">{u.real_name?.[0] || '?'}</div>
                      <div className="flex flex-col text-left"><span className="text-sm font-black text-slate-900">{u.real_name}</span><span className="text-[9px] text-slate-400 font-mono italic">@{u.username}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">{u.is_manager ? <div className="px-3 py-1 bg-cyan-50 text-cyan-600 text-[10px] font-black rounded-full border border-cyan-100 inline-flex items-center gap-1.5 shadow-sm"><ShieldCheck size={12} /> 部门主管</div> : <span className="text-[10px] text-slate-300 font-bold italic">普通成员</span>}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-1">
                       {u.reward_count > 0 ? (
                         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 animate-pulse-slow">
                            <Award size={12} />
                            <span className="text-[10px] font-black">{u.reward_count} <span className="opacity-50 italic">件</span></span>
                         </div>
                       ) : <span className="text-[9px] text-slate-200 italic font-black uppercase">无奖励记录</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                       <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all", u.training_progress === 100 ? "bg-emerald-500" : "bg-cyan-500")} style={{ width: `${u.training_progress || 0}%` }} />
                       </div>
                       <span className="text-[8px] font-black text-slate-400 uppercase">{u.training_progress === 100 ? '实战结业' : `进度 ${u.training_progress || 0}%`}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center"><span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm", u.role_code === 'HQ' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200")}>{u.role_name}</span></td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                       {roles.map(r => (
                         <button key={r.id} onClick={() => handleRoleChange(u.username, r.id)} disabled={u.role_id === r.id} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 border shadow-sm", u.role_id === r.id ? "bg-cyan-500 border-cyan-400 text-slate-950" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50")}>{r.name}</button>
                       ))}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center"><button className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
        {total > 10 && <div className="shrink-0 border-t border-slate-100 bg-white"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImport(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 p-10 text-center">
               <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black text-slate-900 uppercase italic">导入矩阵数据</h3><button onClick={() => setShowImport(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button></div>
               <div onDragOver={(e)=>{e.preventDefault(); setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)} onDrop={(e)=>{e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f) setUploadFile(f)}} className={cn("w-full h-64 rounded-[32px] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 relative", isDragging ? "bg-cyan-50 border-cyan-500 scale-[1.02]" : "bg-slate-50 border-slate-200", uploadFile && "border-emerald-500 bg-emerald-50")}>
                  {uploadFile ? <div className="flex flex-col items-center gap-3"><div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><FileSpreadsheet size={32} /></div><span className="text-sm font-black text-emerald-900">{uploadFile.name}</span><button onClick={()=>setUploadFile(null)} className="text-[10px] font-black text-red-500 uppercase">重新选择</button></div> : <div className="flex flex-col items-center gap-3 opacity-40"><Upload size={48} /><span className="text-xs font-black">拖拽 CSV 战术清单至此</span></div>}
               </div>
               <button disabled={!uploadFile} className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all active:scale-95">开始同步矩阵</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
