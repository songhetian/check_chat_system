import ctypes
import time
import threading
import sys

# Win32 API Definitions
def get_active_window_title():
    try:
        if sys.platform == "win32":
            # Native C call, extremely fast
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
            buff = ctypes.create_unicode_buffer(length + 1)
            ctypes.windll.user32.GetWindowTextW(hwnd, buff, length + 1)
            return buff.value
        return "Non-Windows OS"
    except:
        return None

class WindowTracker:
    def __init__(self, on_context_change=None):
        self.on_context_change = on_context_change
        self.last_context = ""
        self.is_running = False

    def _clean_title(self, title):
        if not title: return None
        for prefix in ["与", "Chat with", "会话 - "]:
            if prefix in title:
                # Optimized logic
                parts = title.split(prefix)
                if len(parts) > 1:
                    return parts[-1].strip().split(" ")[0].split(".")[0] # Get first word/clean name
        return title

    def start(self):
        self.is_running = True
        threading.Thread(target=self._loop, daemon=True).start()

    def _loop(self):
        print("🚀 Vision Link: High-Speed Win32 Tracking Enabled")
        while self.is_running:
            raw_title = get_active_window_title()
            context = self._clean_title(raw_title)
            
            if context and context != self.last_context:
                self.last_context = context
                if self.on_context_change:
                    self.on_context_change(context)
            
            # Since Win32 is fast, we can poll faster (1s) with zero lag
            time.sleep(1.0)

    def stop(self):
        self.is_running = False