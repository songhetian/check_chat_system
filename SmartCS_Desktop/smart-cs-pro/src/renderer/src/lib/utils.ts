import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * [战术适配器] 自动切换环境：Electron -> IPC / Browser -> Fetch
 */
export async function tacticalRequest(payload: { url: string, method?: string, data?: any, headers?: any }) {
  if (window.api && window.api.callApi) {
    // Electron 模式
    return await window.api.callApi(payload);
  } else {
    // 浏览器 Web 模式
    const response = await fetch(payload.url, {
      method: payload.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(payload.headers || {})
      },
      body: payload.data ? JSON.stringify(payload.data) : undefined
    });
    const result = await response.json();
    return { status: response.status, data: result };
  }
}
