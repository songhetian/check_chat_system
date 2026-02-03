import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Trash2, Building2, Loader2, RefreshCw, 
  CheckCircle2, X, AlertTriangle, Edit3, Users2,
  ShieldCheck, UserCog, Search, ShieldAlert
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'

// --- 战术模态框组件 ---
function Modal({ isOpen, onClose, title, children }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative z-10 bg-white">
             <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{title}</h3>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button>
                </div>
                {children}
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [modalType, setModalType] = useState<'NONE' | 'ADD' | 'EDIT' | 'DELETE'>('NONE')
  const [targetItem, setTargetItem] = useState<any>(null)
  const [inputName, setInputName] = useState('')
  const [managerId, setManagerId] = useState<string>('')
  
  // 部门员工搜索
  const [deptUsers, setDeptUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')

  const fetchDepts = async () => {
    setLoading(true)
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments?page=${page}&size=10`, method: 'GET' })
      if (res.status === 200) {
        setDepts(res.data.data)
        setTotal(res.data.total)
      }
    } finally { setLoading(false) }
  }

  const fetchDeptUsers = async (deptId: number) => {
    try {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/departments/users?dept_id=${deptId}&search=${userSearch}`, 
        method: 'GET' 
      })
      if (res.status === 200) setDeptUsers(res.data.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchDepts() }, [page])
  
  useEffect(() => {
    if (modalType === 'EDIT' && targetItem) {
      fetchDeptUsers(targetItem.id)
    }
  }, [modalType, userSearch])

  const openAdd = () => {
    setInputName('')
    setManagerId('')
    setModalType('ADD')
  }

  const openEdit = (dept: any) => {
    setTargetItem(dept)
    setInputName(dept.name)
    setManagerId(dept.manager_id || '')
    setModalType('EDIT')
  }

  const openDeleteModal = (dept: any) => {
    setTargetItem(dept)
    setModalType('DELETE')
  }

  const handleSave = async () => {
    if (!inputName.trim()) return
    const isEdit = modalType === 'EDIT'
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/admin/departments${isEdit ? '/update' : ''}`,
      method: 'POST',
      data: isEdit ? { id: targetItem.id, name: inputName, manager_id: managerId || null } : { name: inputName }
    })
    if (res.data.status === 'ok') {
      setModalType('NONE')
      fetchDepts()
    }
  }

  const executeDelete = async () => {
    if (!targetItem) return
    const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments/delete`, method: 'POST', data: { id: targetItem.id } })
    if (res.data.status === 'ok') { setModalType('NONE'); fetchDepts(); }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic text-tactical-glow">
                    组织架构中枢
                  </h2>
                  <p className="text-slate-500 text-sm mt-1 font-medium">配置业务战术单元，实现全域数据隔离与权限管控</p>
                </div>
                {/* 功能色标红线：新增操作必须使用黑色背景 */}
                <button 
                  onClick={openAdd}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all"
                >
                  <Plus size={16} /> 录入新部门
                </button>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 gap-3 font-bold uppercase italic tracking-widest"><Loader2 className="animate-spin" /> 同步中...</div>
          ) : (
            <TacticalTable headers={['部门名称', '部门人数', '部门主管', '状态', '战术操作']}>
              {depts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100 shadow-inner"><Building2 size={18} /></div>
                      <span className="text-sm font-black text-slate-900">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-slate-600">
                    <div className="flex items-center justify-center gap-2">
                       <Users2 size={14} className="text-slate-300" />
                       <span className="text-sm">{d.member_count} <span className="text-[10px] opacity-40">人</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {d.manager__real_name ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">{d.manager__real_name[0]}</div>
                        <span className="text-xs font-black text-slate-700">{d.manager__real_name}</span>
                      </div>
                    ) : <span className="text-[10px] text-slate-300 font-bold italic">未指派主管</span>}
                  </td>
                  <td className="px-6 py-5 text-center font-black italic text-[10px] text-emerald-600 uppercase tracking-widest">正常</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(d)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                      <button onClick={() => openDeleteModal(d)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
        {total > 10 && <TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} />}
      </div>

      {/* 新增/修改 模态框 */}
      <Modal isOpen={modalType === 'ADD' || modalType === 'EDIT'} onClose={() => setModalType('NONE')} title={modalType === 'ADD' ? '录入新战术部门' : '修改部门架构'}>
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 pl-1">部门名称</label>
            <input autoFocus value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="请输入部门名称" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner" />
          </div>
          
          {modalType === 'EDIT' && (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">指派部门主管</label>
              <div className="relative group">
                 <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-500 transition-colors"><Search size={16} /></div>
                 <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="搜索部门内员工姓名..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner" />
              </div>
              <div className="max-h-40 overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl p-2 bg-slate-50/30">
                 {deptUsers.map(u => (
                   <div key={u.id} onClick={() => setManagerId(u.id)} className={cn("p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all", managerId == u.id ? "bg-cyan-500 text-white shadow-lg" : "hover:bg-white text-slate-600")}>
                      <span className="text-xs font-black">{u.real_name} <span className={cn("text-[9px] opacity-50 ml-1 font-mono", managerId == u.id ? "text-white" : "text-slate-400")}>@{u.username}</span></span>
                      {managerId == u.id && <CheckCircle2 size={14} />}
                   </div>
                 ))}
                 {deptUsers.length === 0 && <div className="p-4 text-center text-[10px] text-slate-300 font-bold uppercase italic">未发现可用成员</div>}
              </div>
            </div>
          )}

          <button onClick={handleSave} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
            <ShieldCheck size={18} /> {modalType === 'ADD' ? '确认创建单元' : '保存架构变更'}
          </button>
        </div>
      </Modal>

      {/* 删除确认 模态框 */}
      <Modal isOpen={modalType === 'DELETE'} onClose={() => setModalType('NONE')} title="确认注销操作">
        <div className="space-y-8 flex flex-col items-center text-center">
           <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-inner"><ShieldAlert size={40} className="animate-pulse" /></div>
           <div><h4 className="text-lg font-black text-slate-900 mb-2">确定要注销该部门吗？</h4><p className="text-sm text-slate-500 font-medium leading-relaxed px-4">您正在执行高危战术操作。注销 <span className="text-red-600 font-black">[{targetItem?.name}]</span> 将导致该部门下的员工失去组织归属。</p></div>
           <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">取消</button>
              <button onClick={executeDelete} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all">确认注销</button>
           </div>
        </div>
      </Modal>
    </div>
  )
}
