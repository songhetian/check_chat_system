import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

export const Fireworks = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => setTimeout(onComplete, 3000)}
      className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center bg-cyan-500/10 backdrop-blur-sm"
    >
      <div className="relative">
        {/* 奖杯图标浮现 */}
        <motion.div
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: [0, 1.2, 1], y: 0 }}
          className="bg-white p-8 rounded-full shadow-2xl border-4 border-amber-400 text-amber-500 relative z-10"
        >
          <Trophy size={64} strokeWidth={2.5} />
        </motion.div>

        {/* 粒子效果（模拟烟花） */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{ 
              x: Math.cos(i * 30 * Math.PI / 180) * 200, 
              y: Math.sin(i * 30 * Math.PI / 180) * 200,
              scale: 0,
              opacity: 0
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 w-4 h-4 bg-amber-400 rounded-full"
          />
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <h2 className="text-2xl font-black text-white drop-shadow-lg tracking-widest uppercase">
            收到主管表扬！
          </h2>
        </motion.div>
      </div>
    </motion.div>
  )
}
