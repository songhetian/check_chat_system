import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, Eye, Clock, User, 
  BrainCircuit, VideoOff, Loader2, Filter, Search,
  ShieldAlert, X, Play, Image as ImageIcon, Download,
  ChevronRight, ArrowUpRight, ShieldCheck, RefreshCw
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { useRiskStore } from '../../store/useRiskStore'

// --- 证据详单弹窗 ---

function EvidenceModal({ isOpen, onClose, data }: any) {
  if (!data) return null
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">违规取证数字化详单</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-mono">ID: {data.id}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-500"/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-8 custom-scrollbar">
              {/* 左侧：多媒体证据 */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                <div className="aspect-video rounded-[32px] bg-slate-900 flex items-center justify-center relative overflow-hidden border-4 border-slate-100 shadow-inner">
                  {data.video_path ? (
                    <video controls className="w-full h-full" autoPlay>
                      <source src={`${CONFIG.API_BASE}/evidence/video/${data.id}`} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-600">
                      <VideoOff size={64} strokeWidth={1} />
                      <span className="text-xs font-black uppercase tracking-[0.2em]">无实时视频链路记录</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">命中关键词</span>
                      <span className="text-lg font-black text-red-600 italic">#{data.keyword}</span>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">风险权重</span>
                      <span className="text-lg font-black text-slate-900 italic">LV.{data.risk_score}</span>
                   </div>
                </div>
              </div>

              {/* 右侧：战术分析 */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                <div className="p-6 rounded-[32px] bg-cyan-50 border border-cyan-100 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><BrainCircuit size={80}/></div>
                   <h4 className="text-xs font-black text-cyan-700 uppercase mb-4 flex items-center gap-2">
                     <BrainCircuit size={14}/> 智脑战术综述
                   </h4>
                   <p className="text-sm font-medium text-cyan-900 leading-relaxed italic">
                     "该行为表现出明显的引导客户向第三方社交平台转移的意图，建议立即开启语音告警协议并对此节点进行 24H 重点监听。"
                   </p>
                </div>

                <div className="space-y-4">
                   <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-3">违规对话原文</span>
                      <div className="text-sm font-medium text-slate-700 bg-white p-4 rounded-2xl border border-slate-100">"{data.context}"</div>
                   </div>
                   <div className="p-6 rounded-[32px] bg-slate-900 text-white shadow-xl">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-3">纠偏战术建议</span>
                      <p className="text-sm font-bold text-cyan-400 leading-relaxed italic">“非常抱歉，根据公司战术合规要求，我们严禁私下添加联系方式，请您理解...”</p>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
               {/* 功能色标红线：导出按钮必须使用翡翠绿 */}
               <button className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95">
                 <Download size={16} /> 导出证据包
               </button>
               <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl">完成审计</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function ViolationsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptId, setDeptId] = useState('')
  const [riskLevel, setRiskLevel] = useState('ALL')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [depts, setDepts] = useState<any[]>([])

  // 引入全局风险状态，用于触发自动刷新
  const violationsCount = useRiskStore(s => s.violations.length)

  const fetchDepts = async () => {
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments`, method: 'GET' })
      if (res.status === 200) setDepts(res.data.data)
    } catch (e) { console.error(e) }
  }

  const fetchViolations = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/violations?page=${page}&username=${search}&dept_id=${deptId}&risk_level=${riskLevel}`,
        method: 'GET'
      })
      if (res.status === 200) {
        setData(res.data.data)
        setTotal(res.data.total)
        
        // 自动锚点：如果 URL 中有 ID，自动弹出详情
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1])
        const targetId = urlParams.get('id')
        if (targetId) {
          const item = res.data.data.find((v: any) => v.id === targetId)
          if (item) {
            setSelectedItem(item)
            setIsModalOpen(true)
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDepts() }, [])
  
  // 1. 初始化加载
  useEffect(() => { fetchViolations() }, [page, deptId, riskLevel])

  // 2. 核心：自动实时刷新机制
  useEffect(() => {
    // 当全局 store 中的违规数量变化时（WS 推送），触发静默刷新
    if (violationsCount > 0) {
      fetchViolations(true)
    }
  }, [violationsCount])

  // 3. 兜底轮询：每 30 秒同步一次，防止 WS 遗漏
  useEffect(() => {
    const timer = setInterval(() => fetchViolations(true), 30000)
    return () => clearInterval(timer)
  }, [page, search, deptId, riskLevel])

  const openEvidence = (item: any) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const formatDateTime = (ts: string) => {
    if (!ts) return "N/A"
    try { return new Date(ts).toLocaleString() } catch { return "Format Error" }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      
      {/* 战术头部：增强响应式 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
            风险拦截取证中枢 <span className="text-red-500">AUDIT</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">全域违规捕获、多媒体证据链固化与 AI 复盘系统</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
           <div className="flex-1 sm:flex-none px-6 py-3 bg-slate-50 border rounded-2xl flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
             <span className="text-sm font-black text-slate-700 uppercase tracking-widest">实时链路已激活</span>
           </div>
        </div>
      </div>

      {/* 搜索过滤条：彻底解决窄屏错行问题 */}
      <div className="bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-2">
          {/* 搜索框固定宽度，防止被挤压 */}
          <div className="min-w-[240px] shrink-0">
            <TacticalSearch 
              value={search}
              onChange={setSearch}
              onSearch={() => fetchViolations()}
              placeholder="搜索坐席姓名或账号..."
            />
          </div>
          
          <div className="h-8 w-[1px] bg-slate-100 shrink-0 mx-1" />

          {/* 下拉框设置最小宽度，确保在窄屏下通过滚动查看，而非折行 */}
          <select 
            value={deptId} 
            onChange={(e) => setDeptId(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-cyan-500/20 py-2 px-4 min-w-[140px] shrink-0"
          >
            <option value="">全域部门</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select 
            value={riskLevel} 
            onChange={(e) => setRiskLevel(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-red-500/20 py-2 px-4 min-w-[140px] shrink-0"
          >
            <option value="ALL">全部风险</option>
            <option value="SERIOUS">严重 (8+)</option>
            <option value="MEDIUM">中级 (5-7)</option>
            <option value="LOW">低级 (&lt;5)</option>
          </select>

          <div className="flex-1" /> {/* 弹性占位 */}

          <button 
            onClick={() => fetchViolations()}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 flex items-center gap-2 shrink-0 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} /> 立即同步
          </button>
        </div>
      </div>

      {/* 核心内容 */}
      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        {/* 数据状态指示 */}
        {violationsCount > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 py-1 bg-cyan-500 text-slate-950 text-[10px] font-black rounded-full shadow-xl flex items-center gap-2">
              <RefreshCw size={10} className="animate-spin" /> 检测到新拦截，已自动同步
            </motion.div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 gap-3 italic font-bold uppercase tracking-widest">
              <Loader2 className="animate-spin" /> 正在调取中枢取证库...
            </div>
          ) : (
            <TacticalTable headers={['发生时间', '坐席信息', '所属部门', '拦截关键词', '风险等级', '管理操作']}>
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openEvidence(item)}>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                      <Clock size={12} /> {formatDateTime(item.timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 shrink-0">
                        {item.user__real_name?.[0] || '?'}
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="text-sm font-black text-slate-900 truncate">{item.user__real_name}</span>
                        <span className="text-[9px] text-slate-400 font-mono italic truncate">@{item.user__username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-tighter whitespace-nowrap">
                      {item.user__department__name || '未归类'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-black text-red-600 bg-red-500/5 px-3 py-1 rounded-lg border border-red-500/10 italic whitespace-nowrap">
                      {item.keyword}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded italic whitespace-nowrap",
                        item.risk_score >= 8 ? "bg-red-600 text-white" : "bg-slate-900 text-white"
                      )}>LV.{item.risk_score}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEvidence(item); }}
                      className="p-2 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shrink-0"
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </TacticalTable>
          )}
          
          {!loading && data.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black tracking-[0.2em]">
               <ShieldCheck size={64} strokeWidth={1} className="opacity-20" />
               <p className="text-sm">暂无违规命中记录</p>
            </div>
          )}
        </div>

        {total > 20 && (
          <TacticalPagination 
            total={total} 
            pageSize={20} 
            currentPage={page} 
            onPageChange={setPage} 
          />
        )}
      </div>

      {/* 证据详单弹窗 */}
      <EvidenceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedItem} 
      />

    </div>
  )
}
