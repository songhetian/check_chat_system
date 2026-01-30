import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useReplyStore } from '../store/useReplyStore';
import { MessageSquare, LifeBuoy, Bell, Search, AlertCircle, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { IntelligentReplyList } from './IntelligentReplyList';

export const Capsule = () => {
  const { isShaking, status } = useStore();
  const { searchQuery, setSearchQuery, isExpanded, setExpanded } = useReplyStore();
  const [isFocused, setIsFocused] = useState(false);
  const [alertType, setAlertType] = useState<'none' | 'block' | 'monitor'>('none');

  // 根据预警类型获取样式
  const getAlertStyles = () => {
    if (alertType === 'block') return 'border-red-500/50 bg-red-950/60 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
    if (alertType === 'monitor') return 'border-amber-500/50 bg-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
    return isShaking ? 'border-red-500/50 bg-red-950/40' : 'hover:border-white/30';
  };

  return (
    <div className="relative w-full p-2 select-none">
      <Toaster position="bottom-center" />
      
      {/* 主管实时指导气泡 */}
      <AnimatePresence>
        {status === 'busy' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -45 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 mx-auto w-fit max-w-[200px] bg-blue-600 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-lg pointer-events-none"
          >
            <div className="flex items-center gap-1 font-bold mb-0.5">
              <Zap size={10} /> 主管指导：
            </div>
            建议回复：请您稍等，我这边正在为您申请特殊折扣...
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout // Framer Motion 自动处理布局改变时的平滑过渡
        initial={false}
        animate={{
          width: isFocused || searchQuery ? 320 : 280,
          scale: alertType === 'block' ? [1, 1.05, 0.95, 1.05, 1] : isShaking ? [1, 1.05, 0.95, 1.02, 1] : 1,
        }}
        className={`
          relative flex items-center h-12 px-1 rounded-full 
          bg-zinc-900/85 backdrop-blur-2xl border border-white/20
          shadow-[0_20px_50px_rgba(0,0,0,0.3),_inset_0_1px_1px_rgba(255,255,255,0.1)]
          transition-all duration-500
          ${getAlertStyles()}
        `}
      >
        {/* 左侧：功能图标 */}
        <div className="flex items-center ml-3 gap-3 text-zinc-400">
          <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
            <Bell size={16} className="cursor-pointer hover:text-white" />
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.2 }} 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              toast.success('已请求主管协助');
              // 调用 preload 暴露的安全接口
              if (window.electronAPI) {
                window.electronAPI.sendHelpRequest({ content: '客服发起文字求助...' });
              }
            }}
          >
            <LifeBuoy size={16} className="cursor-pointer hover:text-blue-400" />
          </motion.div>
        </div>

        {/* 中间：智能搜索区域 */}
        <div className="flex-1 mx-2 relative flex items-center">
          <Search 
            size={14} 
            className={`absolute left-3 transition-colors ${alertType !== 'none' ? 'text-white' : isFocused ? 'text-blue-400' : 'text-zinc-600'}`} 
          />
          <input 
            type="text"
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={alertType === 'block' ? "违规内容已拦截" : alertType === 'monitor' ? "监控词已记录" : isFocused ? "支持拼音简拼..." : "快捷搜索"}
            className="w-full bg-white/5 border-none rounded-full py-1.5 pl-9 pr-8 text-xs text-zinc-100 placeholder:text-zinc-500 focus:bg-white/10 outline-none transition-all"
          />
          {searchQuery && (
            <X 
              size={12} 
              className="absolute right-3 text-zinc-500 cursor-pointer hover:text-white"
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>

        {/* 右侧：呼吸状态灯 */}
        <div className="mr-3 flex items-center gap-2">
          <AnimatePresence>
            {alertType !== 'none' && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
              >
                <AlertCircle size={16} className={alertType === 'block' ? 'text-red-500' : 'text-amber-500'} />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative">
             <div className={`w-2.5 h-2.5 rounded-full ${
               status === 'online' ? 'bg-green-500' : 'bg-zinc-600'
             }`} />
             {status === 'online' && !isShaking && (
               <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-40" />
             )}
          </div>
        </div>
      </motion.div>

      {/* 下拉话术列表 */}
      <AnimatePresence>
        {(isExpanded || isFocused) && searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <IntelligentReplyList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};