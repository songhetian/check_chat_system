import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Clock, CheckCircle2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const MemoPanel = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [newMemo, setNewMemo] = useState('');
  
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute top-14 left-0 w-72 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Clock size={14} /> 待办事项
        </h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">×</button>
      </div>

      <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-1">
        {/* 示例待办 */}
        <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5 group">
          <div className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-green-500 transition-colors cursor-pointer">
            <CheckCircle2 size={12} className="text-transparent group-hover:text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-zinc-200">回访昨天咨询报价的王先生</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">提醒时间: 15:30</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <input
          value={newMemo}
          onChange={(e) => setNewMemo(e.target.value)}
          placeholder="添加随手记..."
          className="w-full bg-white/10 border-none rounded-xl py-2 pl-3 pr-10 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              toast.success('已添加到备忘录');
              setNewMemo('');
            }
          }}
        />
        <Plus size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
      </div>
    </motion.div>
  );
};
