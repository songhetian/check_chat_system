import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { initDynamicConfig } from './lib/config'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

// 在渲染应用前，同步局域网指挥中心配置
console.log('📡 [系统启动] 正在同步中枢链路配置...');
initDynamicConfig()
  .then(() => {
    console.log('✅ [系统启动] 战术配置同步完成，正在挂载指挥矩阵');
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </React.StrictMode>
    )
  })
  .catch((err) => {
    console.error('❌ [系统启动] 关键配置加载失败，请检查网络或配置文件', err);
  });
