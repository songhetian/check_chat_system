import { create } from 'zustand';
import { io } from 'socket.io-client';

// Socket 实例初始化
export const socket = io('http://localhost:3000', {
  autoConnect: true, // 改为自动连接
  reconnection: true,
  reconnectionAttempts: 5,
});

interface AppState {
  isShaking: boolean;
  status: 'online' | 'busy' | 'away' | 'offline';
  memos: any[];
  setShaking: (shake: boolean) => void;
  setStatus: (status: AppState['status']) => void;
}

export const useStore = create<AppState>((set) => ({
  isShaking: false,
  status: 'offline',
  memos: [],
  setShaking: (shake) => set({ isShaking: shake }),
  setStatus: (status) => set({ status }),
}));

// 监听一次性的全局事件
let isInitialized = false;
export const initSocketListeners = () => {
  if (isInitialized) return;
  
  socket.on('on-shake', () => {
    useStore.getState().setShaking(true);
    setTimeout(() => useStore.getState().setShaking(false), 3000);
  });

  socket.on('connect', () => {
    useStore.getState().setStatus('online');
  });

  // 监听强制下线指令
  socket.on('force-logout', (data: { reason: string }) => {
    toast.error(data.reason, { duration: 5000 });
    useStore.getState().setStatus('offline');
    
    // 延迟 2 秒跳转，让用户看清提示
    setTimeout(() => {
      window.location.href = '/login'; 
    }, 2000);
  });

  isInitialized = true;
};

