import React, { useState, useMemo, useEffect, memo } from 'react'
import { 
  FileText, Loader2, RefreshCw, X, Plus, Save, Trash2, Edit3, ShieldAlert, Search, FileCode, Paperclip, Image as ImageIcon,
  UploadCloud, ExternalLink, Info, CheckCircle2, FileType, Video, PlayCircle, FileUp
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

// V4.30: 增强型图标映射
const getTypeIcon = (type: string) => {
  if (!type) return <FileText className="text-slate-400" size={16}/>;
  switch(type) {
    case 'MD': return <FileCode className="text-cyan-500" size={16}/>
    case 'IMAGE': return <ImageIcon className="text-amber-500" size={16}/>
    case 'VIDEO': return <Video className="text-red-500" size={16}/>
    case 'FILE': return <Paperclip className="text-purple-500" size={16}/>
    default: return <FileText className="text-slate-400" size={16}/>
  }
}

// V4.60: 支持多文件并行上传与视频载体
const SopEditModal = memo(({ item, onSave, onCancel, isPending }: any) => {
  // content 存储逻辑：TEXT 模式存字符串，其它模式存 JSON 数组字符串
  const initialContent = useMemo(() => {
    if (!item?.content) return item?.sop_type === 'TEXT' ? '' : '[]';
    return item.content;
  }, [item]);

  const [editItem, setEditItem] = useState(item || { title: '', content: '', sop_type: 'TEXT' })
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({}) // 记录各文件上传进度
  const [isDragging, setIsDragging] = useState(false)
  const { token } = useAuthStore()

  // 解析当前附件列表
  const fileList = useMemo(() => {
    if (editItem.sop_type === 'TEXT') return [];
    try {
      const parsed = JSON.parse(editItem.content || '[]');
      return Array.isArray(parsed) ? parsed : [editItem.content].filter(Boolean);
    } catch (e) {
      return editItem.content ? [editItem.content] : [];
    }
  }, [editItem.content, editItem.sop_type]);

  const handleSave = () => {
    if (!editItem.title?.trim()) { toast.error('规范标题不能为空'); return; }
    if (editItem.sop_type === 'TEXT' && !editItem.content?.trim()) { toast.error('文字内容不能为空'); return; }
    if (editItem.sop_type !== 'TEXT' && fileList.length === 0) { toast.error('请至少上传一个战术附件'); return; }
    onSave(editItem);
  }

  // 物理上传引擎 (单文件任务)
  const performUpload = async (fileObj: { name: string, data: string }) => {
    const fileId = `${Date.now()}-${fileObj.name}`;
    try {
      setUploadingFiles(prev => ({ ...prev, [fileId]: 0 }));
      
      const byteCharacters = atob(fileObj.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      
      const formData = new FormData()
      formData.append('file', blob, fileObj.name)
      const apiHost = CONFIG.API_BASE.replace('/api', '')

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${CONFIG.API_BASE}/ai/sops/upload`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadingFiles(prev => ({ ...prev, [fileId]: percent }));
        }
      };

      const resultPromise = new Promise((resolve, reject) => {
        xhr.onload = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject();
        xhr.onerror = () => reject();
      });

      xhr.send(formData);
      const result: any = await resultPromise;

      if (result.status === 'ok') {
        const fullUrl = `${apiHost}${result.url}`;
        const newList = [...fileList, fullUrl];
        setEditItem({ ...editItem, content: JSON.stringify(newList) });
        toast.success(`附件 ${fileObj.name} 同步成功`);
      }
    } catch (e) {
      toast.error(`附件 ${fileObj.name} 同步失败`);
    } finally {
      setUploadingFiles(prev => {
        const next = { ...prev }; delete next[fileId]; return next;
      });
    }
  }

  const triggerNativeUpload = async () => {
    let filters: any[] = [];
    if (editItem.sop_type === 'IMAGE') filters = [{ name: '图片', extensions: ['jpg', 'png', 'gif', 'webp'] }];
    else if (editItem.sop_type === 'MD') filters = [{ name: 'Markdown', extensions: ['md'] }];
    else if (editItem.sop_type === 'VIDEO') filters = [{ name: '视频', extensions: ['mp4', 'webm', 'mov', 'avi'] }];
    else filters = [{ name: '附件', extensions: ['pdf', 'doc', 'docx', 'xlsx', 'xls', 'ppt', 'pptx', 'zip'] }];
    
    const file = await window.api.selectFile({ title: '物理拉取战术载体', filters })
    if (file) performUpload(file);
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (editItem.sop_type === 'TEXT') return;
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        performUpload({ name: file.name, data: base64 });
      };
      reader.readAsDataURL(file);
    }
  }

  const removeFile = (index: number) => {
    const newList = [...fileList];
    newList.splice(index, 1);
    setEditItem({ ...editItem, content: JSON.stringify(newList) });
  }

  const isUploading = Object.keys(uploadingFiles).length > 0;
  const isFileMode = editItem.sop_type !== 'TEXT';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-8">
      <div onClick={onCancel} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer" />
      
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 flex overflow-hidden border border-white/20">
         
         {/* 左栏：核心控制 */}
         <div className="w-[320px] bg-slate-50 border-r border-slate-100 flex flex-col p-8 shrink-0">
            <header className="mb-10">
               <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                  <FileUp size={24} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">SOP 物理录入</h3>
               <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Multi-Asset Transmission</p>
            </header>

            <div className="space-y-8 flex-1">
               <section>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block ml-1 tracking-widest">规范标题 <span className="text-red-500">*</span></label>
                  <input 
                    value={editItem.title || ''} 
                    onChange={(e)=>setEditItem({...editItem, title: e.target.value})} 
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all shadow-sm"
                    placeholder="输入标题..." 
                  />
               </section>

               <section>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block ml-1 tracking-widest">载体物理类型</label>
                  <TacticalSelect 
                    options={[
                      {id: 'TEXT', name: '纯文本 (TEXT)'}, 
                      {id: 'MD', name: 'Markdown 指南 (MD)'}, 
                      {id: 'IMAGE', name: '视觉资产 (IMAGE)'}, 
                      {id: 'VIDEO', name: '战术视频 (VIDEO)'},
                      {id: 'FILE', name: '综合附件 (FILE)'}
                    ]} 
                    value={editItem.sop_type || 'TEXT'} 
                    onChange={(val) => setEditItem({...editItem, sop_type: val, content: val === 'TEXT' ? '' : '[]'})} 
                  />
               </section>

               <div className="p-6 bg-cyan-50/50 rounded-3xl border border-cyan-100">
                  <div className="flex items-start gap-3">
                     <Info size={16} className="text-cyan-600 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold text-cyan-800 leading-relaxed uppercase">
                        已支持视频与多文件并行同步。拖入文件即可自动触发物理上传。
                     </p>
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-200 flex gap-3">
               <button onClick={onCancel} className="px-6 py-4 bg-white text-slate-500 rounded-2xl text-xs font-black uppercase hover:bg-slate-100 border border-slate-200 cursor-pointer">取消</button>
               <button 
                 disabled={isPending || isUploading} 
                 onClick={handleSave} 
                 className="flex-1 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
               >
                 {isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                 固化规范
               </button>
            </div>
         </div>

         {/* 右栏：多载荷预览/上传区 */}
         <div 
           className={cn(
             "flex-1 bg-white flex flex-col overflow-hidden transition-colors duration-300",
             isDragging && "bg-cyan-50/50"
           )}
           onDragOver={(e) => { e.preventDefault(); if(isFileMode) setIsDragging(true); }}
           onDragLeave={() => setIsDragging(false)}
           onDrop={handleDrop}
         >
            <header className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 shrink-0">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">规范载荷内容</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{isFileMode ? `已就绪附件: ${fileList.length}` : '标准文本指引'}</p>
               </div>
               {isFileMode && (
                 <button 
                   onClick={triggerNativeUpload}
                   className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-cyan-200 hover:bg-cyan-500 active:scale-95 transition-all cursor-pointer"
                 >
                   <UploadCloud size={14}/> 物理文件追加
                 </button>
               )}
            </header>

            <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-slate-50/10">
               {editItem.sop_type === 'TEXT' ? (
                 <textarea 
                   value={editItem.content || ''} 
                   onChange={(e)=>setEditItem({...editItem, content: e.target.value})} 
                   className="w-full h-full bg-white border border-slate-100 rounded-[32px] p-8 text-sm font-medium leading-relaxed focus:border-cyan-500 outline-none shadow-inner resize-none no-scrollbar"
                   placeholder="在此输入文字指引..."
                 />
               ) : (
                 <div className="grid grid-cols-2 gap-4">
                    {/* 上传任务占位符 */}
                    {Object.entries(uploadingFiles).map(([id, progress]) => (
                      <div key={id} className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-sm animate-pulse">
                         <Loader2 className="animate-spin text-cyan-500" size={24}/>
                         <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                         </div>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">同步中 {progress}%</span>
                      </div>
                    ))}

                    {/* 已就绪附件卡片 */}
                    {fileList.map((url: string, idx: number) => {
                      const fileName = url.split('/').pop() || '未命名附件';
                      const isImage = editItem.sop_type === 'IMAGE' || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                      const isVideo = editItem.sop_type === 'VIDEO' || /\.(mp4|webm|mov)$/i.test(url);

                      return (
                        <div key={idx} className="group bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all relative">
                           {isImage ? (
                             <img src={url} className="w-full h-32 object-cover" />
                           ) : (
                             <div className="w-full h-32 bg-slate-50 flex items-center justify-center text-slate-300">
                                {isVideo ? <PlayCircle size={40}/> : <FileCode size={40}/>}
                             </div>
                           )}
                           <div className="p-4 flex items-center justify-between bg-white">
                              <div className="flex-1 min-w-0 pr-2">
                                 <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tighter" title={fileName}>{fileName}</p>
                                 <p className="text-[9px] font-bold text-emerald-600/60 uppercase mt-0.5 tracking-widest flex items-center gap-1">
                                    <CheckCircle2 size={8}/> 载荷已就绪
                                 </p>
                              </div>
                              <div className="flex items-center gap-1">
                                 <button onClick={() => window.open(url)} className="p-2 text-slate-400 hover:text-cyan-600 transition-colors cursor-pointer" title="物理预览"><ExternalLink size={14}/></button>
                                 <button onClick={() => removeFile(idx)} className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer" title="从队列移除"><Trash2 size={14}/></button>
                              </div>
                           </div>
                        </div>
                      )
                    })}

                    {fileList.length === 0 && Object.keys(uploadingFiles).length === 0 && (
                      <div className="col-span-2 py-20 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center opacity-30 gap-4">
                         <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
                            {getTypeIcon(editItem.sop_type)}
                         </div>
                         <p className="text-xs font-black uppercase tracking-widest">将物理文件拖入此区域，或点击上方追加按钮</p>
                      </div>
                    )}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  )
})

export default function BusinessSopsPage() {
  const { token, hasPermission, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE'>('NONE')
  const [activeItem, setActiveItem] = useState<any>(null)

  const isHQ = user?.role_id === 3 || user?.role_code === 'HQ'

  const { data: sopData, isLoading, isFetching, refetch, isError, error: queryError } = useQuery({
    queryKey: ['business_sops_admin', page, search],
    queryFn: async () => {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/ai/sops?page=${page}&size=10&search=${encodeURIComponent(search)}`, 
        method: 'GET', 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      if (res.status !== 200 || res.data?.status === 'error') {
        throw new Error(res.data?.message || res.error || '指挥中心同步失败');
      }
      return res.data
    },
    enabled: !!token,
    retry: false,
    staleTime: 5000
  })

  useEffect(() => {
    if (isError && queryError) {
      toast.error('SOP 获取异常', { description: queryError instanceof Error ? queryError.message : String(queryError) });
    }
  }, [isError, queryError]);

  const SopItems = useMemo(() => {
    const items = Array.isArray(sopData?.data) ? sopData.data : [];
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="py-20 text-center text-slate-400 italic font-medium opacity-50">
            {isLoading ? "正在同步指挥中心数据..." : "暂无 SOP 业务规范记录"}
          </td>
        </tr>
      );
    }

    return items.map((item: any) => {
      // V4.70: 预览内容语义化处理
      let previewText = item.content;
      if (item.sop_type !== 'TEXT' && item.content) {
        try {
          const parsed = JSON.parse(item.content);
          if (Array.isArray(parsed)) {
            previewText = `[包含 ${parsed.length} 个附件资源]`;
          } else if (item.sop_type === 'MD') {
            previewText = '[Markdown 物理载荷]';
          }
        } catch (e) {
          if (String(item.content).includes('http')) {
            previewText = '[远程物理资源]';
          }
        }
      }

      return (
        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center border-b border-slate-50">
          <td className="px-8 py-5 font-black text-slate-900 text-center min-w-[200px]">
            <div className="flex justify-center">{item.title || '未命名规范'}</div>
          </td>
          <td className="px-6 py-5 text-center max-w-md">
            <div className="mx-auto truncate italic opacity-60 w-fit max-w-[300px] font-medium text-center">
              {item.content ? `"${previewText}"` : <span className="text-[10px] uppercase tracking-tighter opacity-30">空内容</span>}
            </div>
          </td>
          <td className="px-6 py-5 text-center">
             <div className="flex items-center justify-center">
               <span className="px-3 py-1 bg-slate-100 rounded-2xl flex items-center justify-center gap-2 border border-slate-200 text-[9px] font-black uppercase shadow-sm">
                  {getTypeIcon(item?.sop_type)} {item?.sop_type || 'TEXT'}
               </span>
             </div>
          </td>
          <td className="px-6 py-5 text-center">
            <div className="flex items-center justify-center">
              <span className={cn(
                "px-3 py-1 rounded-2xl text-[9px] font-black border uppercase tracking-widest",
                item.department_id ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-cyan-50 text-cyan-600 border-cyan-100"
              )}>
                {item.department__name || (item.department_id ? '未知部门' : '全域规范')}
              </span>
            </div>
          </td>
          <td className="px-8 py-5 text-center">
            <div className="flex justify-center gap-2">
              {hasPermission('admin:sop:update') && (<button onClick={() => { setActiveItem(item); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-slate-200 shadow-sm" title="修订"><Edit3 size={16} /></button>)}
              {hasPermission('admin:sop:delete') && (<button onClick={() => { setActiveItem(item); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-slate-200 shadow-sm" title="废弃"><Trash2 size={16} /></button>)}
            </div>
          </td>
        </tr>
      );
    });
  }, [sopData?.data, hasPermission, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return window.api.callApi({ url: `${CONFIG.API_BASE}/ai/sops`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: payload })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_sops_admin'] })
      setModalType('NONE'); toast.success('部门SOP规范已同步')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return window.api.callApi({ url: `${CONFIG.API_BASE}/ai/sops/delete`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_sops_admin'] })
      setModalType('NONE'); toast.success('部门SOP已成功注销')
    }
  })

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">SOP 业务规范库</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic text-emerald-600">管理业务标准流程 · 支持文字、Markdown、图片、视频及多媒体</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} placeholder="搜索 SOP 标题..." className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold w-64 outline-none" />
           </div>
           <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"><RefreshCw size={18} className={cn((isLoading || isFetching) && "animate-spin")} /></button>
           {hasPermission('admin:sop:create') && (
             <button onClick={() => { setActiveItem({ title: '', content: '', sop_type: 'TEXT' }); setModalType('EDIT'); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl transition-all cursor-pointer"><Plus size={16} /> 录入 SOP</button>
           )}
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? <div className="h-64 flex flex-col items-center justify-center opacity-30"><Loader2 className="animate-spin mb-4" size={40} /></div> : (
              <TacticalTable headers={['规范标题', '内容预览', '载体类型', '作用域', '操作']}>
                {SopItems}
              </TacticalTable>
            )}
         </div>
         {sopData?.total > 10 && <div className="p-2 border-t border-slate-100"><TacticalPagination total={sopData.total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      {modalType === 'EDIT' && (
        <SopEditModal 
          item={activeItem} 
          isPending={saveMutation.isPending}
          onCancel={() => setModalType('NONE')}
          onSave={(data: any) => saveMutation.mutate(data)}
        />
      )}

      {modalType === 'DELETE' && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
          <div onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 cursor-pointer" />
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 p-10 text-center">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldAlert size={40} /></div>
             <h3 className="text-xl font-black text-slate-900 mb-2 uppercase italic">注销 SOP 规范?</h3>
             <p className="text-slate-500 text-xs font-medium mb-8">此操作将逻辑移除该业务指南。</p>
             <div className="flex gap-4">
                <button onClick={() => setModalType('NONE')} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all cursor-pointer">取消</button>
                <button disabled={deleteMutation.isPending} onClick={() => activeItem?.id && deleteMutation.mutate(activeItem.id)} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-200 transition-all cursor-pointer">确认注销</button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}