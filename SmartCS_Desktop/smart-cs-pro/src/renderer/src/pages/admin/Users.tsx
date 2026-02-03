import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Shield, UserCog, RefreshCw, ChevronRight, 
  Loader2, Search, Filter, ShieldCheck, Mail, Building2,
  Trash2, Plus, ArrowUpRight, Upload, Download, CheckCircle2, X,
  FileSpreadsheet, AlertCircle
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [showImport, setShowImport] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=${page}&size=10&search=${search}`,
        method: 'GET'
      })
      if (res.status === 200) {
        setUsers(res.data.data)
        setTotal(res.data.total)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [page, search])

  // --- 修复：下载导入模板逻辑 ---
  const handleDownloadTemplate = () => {
    const headers = "用户名,真实姓名,角色(AGENT/ADMIN/HQ),部门ID\n"
    const blob = new Blob(["\ufeff" + headers], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "SmartCS_操作员导入模板.csv")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.dispatchEvent(new CustomEvent('trigger-toast', {
      detail: { title: '资源获取成功', message: '操作员导入模板已准备就绪，请查看下载列表', type: 'success' }
    }))
  }

  // --- 修复：拖拽导入逻辑 ---
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      setUploadFile(file)
    } else {
      window.dispatchEvent(new CustomEvent('trigger-toast', {
        detail: { title: '格式错误', message: '仅支持 CSV 或 XLSX 战术清单文件', type: 'error' }
      }))
    }
  }, [])

  const handleUpload = async () => {
    if (!uploadFile) return
    alert(`正在解析并同步战术数据：${uploadFile.name}`)
    setUploadFile(null)
    setShowImport(false)
    fetchUsers()
  }

  const handleRoleChange = async (username: string, newRole: string) => {
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/hq/user/update-role`,
      method: 'POST',
      data: { username, new_role: newRole, operator: '超级管理员' }
    })
    if (res.data.status === 'ok') {
      fetchUsers()
      window.dispatchEvent(new CustomEvent('trigger-toast', {
        detail: { title: '权限同步成功', message: `用户 @${username} 的角色已更新`, type: 'success' }
      }))
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      
      {/* 战术头部 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic text-tactical-glow">成员权限矩阵</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">管理全域操作员的职能身份与所属战术单元</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black shadow-lg shadow-emerald-900/20 active:scale-95 hover:bg-emerald-700 transition-all">
             <Download size={14} /> 下载导入模板
           </button>
           <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all">
             <Upload size={14} /> 批量导入数据
           </button>
           <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all">
             <Plus size={14} /> 录入新操作员
           </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex gap-4 shrink-0">
        <TacticalSearch value={search} onChange={setSearch} onSearch={fetchUsers} placeholder="通过姓名或账号精准定位节点..." className="flex-1" />
        <button onClick={fetchUsers} className="px-6 bg-slate-50 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-100 flex items-center gap-2 transition-all border border-slate-100"><RefreshCw size={14} className={cn(loading && "animate-spin")} /> 刷新同步</button>
      </div>

      {/* 列表区域 */}
      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 gap-3 font-bold uppercase italic tracking-widest"><Loader2 className="animate-spin" /> 正在同步矩阵数据...</div>
          ) : (
            <TacticalTable headers={['姓名与账号', '管理身份', '所属战术单元', '当前系统角色', '权限快速调整', '战术操作']}>
              {users.map((u) => (
                <tr key={u.username} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black border border-cyan-100 shadow-inner">{u.real_name?.[0] || '?'}</div>
                      <div className="flex flex-col text-left min-w-[120px]"><span className="text-sm font-black text-slate-900">{u.real_name}</span><span className="text-[9px] text-slate-400 font-mono italic">@{u.username}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">{u.is_manager ? <div className="px-3 py-1 bg-cyan-50 text-cyan-600 text-[10px] font-black rounded-full border border-cyan-100 flex items-center justify-center gap-1.5 shadow-sm inline-flex"><ShieldCheck size={12} /> 部门主管</div> : <span className="text-[10px] text-slate-300 font-bold italic">普通成员</span>}</td>
                  <td className="px-6 py-5 text-center"><div className="flex items-center justify-center gap-2"><Building2 size={12} className="text-slate-300" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{u.dept_name || '未归类节点'}</span></div></td>
                  <td className="px-6 py-5 text-center"><span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase italic tracking-widest border shadow-sm", u.role === 'HQ' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200")}>{u.role === 'HQ' ? '总部' : u.role === 'ADMIN' ? '主管' : '坐席'}</span></td>
                  <td className="px-6 py-5 text-center"><div className="flex items-center justify-center gap-2"><RoleOption active={u.role === 'AGENT'} label="坐席" onClick={() => handleRoleChange(u.username, 'AGENT')} /><RoleOption active={u.role === 'ADMIN'} label="主管" onClick={() => handleRoleChange(u.username, 'ADMIN')} /><RoleOption active={u.role === 'HQ'} label="总部" onClick={() => handleRoleChange(u.username, 'HQ')} /></div></td>
                  <td className="px-8 py-5 text-center"><button className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
        {total > 10 && <TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} />}
      </div>

      {/* 批量导入模态框：支持拖拽上传 */}
      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImport(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative z-10 p-10 text-center">
               <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black text-slate-900 uppercase">批量导入操作员</h3><button onClick={() => setShowImport(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={20}/></button></div>
               
               <div 
                 onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                 className={cn(
                   "w-full h-64 rounded-[32px] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 relative overflow-hidden",
                   isDragging ? "bg-cyan-50 border-cyan-500 scale-[1.02]" : "bg-slate-50 border-slate-200",
                   uploadFile && "border-emerald-500 bg-emerald-50"
                 )}
               >
                  {uploadFile ? (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce"><FileSpreadsheet size={32} /></div>
                      <div className="flex flex-col gap-1"><span className="text-sm font-black text-emerald-900">{uploadFile.name}</span><span className="text-[10px] text-emerald-600 font-bold uppercase">就绪，可同步数据</span></div>
                      <button onClick={() => setUploadFile(null)} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-red-500 transition-colors"><X size={14}/></button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Upload size={32} /></div>
                      <div className="flex flex-col gap-1"><span className="text-sm font-black text-slate-900">拖拽文件至此区域</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">支持 CSV / XLSX 格式</span></div>
                    </>
                  )}
               </div>

               <div className="grid grid-cols-1 gap-3 mt-10">
                  <button onClick={handleUpload} disabled={!uploadFile} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all active:scale-95 flex items-center justify-center gap-3">开始同步战术数据</button>
                  <p className="text-[9px] text-slate-400 font-bold flex items-center justify-center gap-1.5 italic"><AlertCircle size={10}/> 导入操作将覆盖具有相同用户名的现有节点</p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

function RoleOption({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} disabled={active} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 border shadow-sm", active ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-md" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50")}>{label}</button>
  )
}
