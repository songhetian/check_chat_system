import flet as ft
import time
import threading
import random
import json
import requests
from core.hook_service import InputHookService
from core.socket_client import SocketClient
from core.config_loader import load_client_config
from core.local_db import LocalDB
from core.window_service import WindowTracker
from ui.common.tactical_capsule import TacticalCapsule
from ui.common.tactical_button import TacticalButton
from ui.agent.intelli_helper import IntelliHelper
from ui.agent.guidance_overlay import GuidanceOverlay
from ui.agent.product_search import ProductSearchOverlay
from ui.agent.tone_polisher import TonePolisher
from ui.agent.video_analyzer import VideoAnalyzer
from ui.agent.mini_task import MiniTask
from ui.agent.customer_hud import CustomerHUD

import os

def main(page: ft.Page):
    # Load Basic Config
    app_config = load_client_config()
    api_base = app_config.get("api_url", "http://localhost:8000/api")
    server_base = app_config.get("server_url", "ws://localhost:8000")
    
    # Improved Session Path for Packaged EXE
    from core.config_loader import get_base_path
    base_path = get_base_path()
    session_file = os.path.join(base_path, "assets", ".session")

    page.title = "Smart-CS Tactical Link"
    page.window_width = 400
    page.window_height = 550
    page.window_center()
    page.bgcolor = "#0a0b10"
    page.padding = 0
    page.vertical_alignment = ft.MainAxisAlignment.CENTER
    page.horizontal_alignment = ft.CrossAxisAlignment.CENTER

    # --- UI 组件 ---
    user_input = ft.TextField(
        label="操作员账号", 
        prefix_icon=ft.icons.PERSON_OUTLINED, 
        width=320, 
        border_color="#1e293b",
        focused_border_color=ft.colors.CYAN_400
    )
    pass_input = ft.TextField(
        label="访问密码", 
        prefix_icon=ft.icons.LOCK_OUTLINED, 
        password=True, 
        can_reveal_password=True, 
        width=320, 
        border_color="#1e293b",
        focused_border_color=ft.colors.CYAN_400
    )
    remember_me = ft.Checkbox(label="保持登录状态 (下次自动填充)", value=True, label_style=ft.TextStyle(size=12, color=ft.colors.BLUE_GREY_400))
    error_text = ft.Text("", color=ft.colors.RED_400, size=12)
    loading_ring = ft.ProgressRing(width=20, height=20, stroke_width=2, visible=False)
    login_btn = ft.ElevatedButton(
        content=ft.Row([ft.Text("初始化系统链路"), loading_ring], alignment=ft.MainAxisAlignment.CENTER, spacing=10),
        on_click=lambda e: perform_login(None), 
        width=320, 
        height=50,
        style=ft.ButtonStyle(
            shape=ft.RoundedRectangleBorder(radius=8),
            bgcolor={"": ft.colors.CYAN_800, "hovered": ft.colors.CYAN_700},
            color=ft.colors.WHITE
        )
    )

    def set_loading(is_loading):
        loading_ring.visible = is_loading
        login_btn.disabled = is_loading
        user_input.disabled = is_loading
        pass_input.disabled = is_loading
        page.update()

    def perform_login(saved_session=None):
        set_loading(True)
        error_text.value = ""
        
        payload = {"username": user_input.value, "password": pass_input.value}

        try:
            res = requests.post(f"{api_base}/auth/login", json=payload, timeout=5)
            if res.status_code == 200:
                data = res.json()
                user_profile = data["user"]
                token = data["token"]
                
                if user_profile["role"] != "AGENT":
                    error_text.value = "错误: 权限不足，该账号无法登录坐席端"
                    set_loading(False)
                    return

                # 保存会话
                if remember_me.value:
                    os.makedirs(os.path.dirname(session_file), exist_ok=True)
                    with open(session_file, "w", encoding="utf-8") as f:
                        json.dump({"username": user_input.value, "password": pass_input.value, "role": "AGENT"}, f)

                page.clean()
                start_agent_interface(page, user_profile, server_base, api_base, token)
            else:
                error_text.value = "登录失败: 账号或密码错误"
                set_loading(False)
        except Exception as err:
            error_text.value = "链路故障: 无法连接至服务器"
            set_loading(False)

    # --- 界面布局 ---
    login_view = ft.Container(
        content=ft.Column([
            ft.Container(
                content=ft.Icon(ft.icons.TERMINAL, size=40, color=ft.colors.CYAN_400),
                padding=20,
                border_radius=50,
                bgcolor=ft.colors.with_opacity(0.1, ft.colors.CYAN_400)
            ),
            ft.Text("智能客服战术端", size=20, weight=ft.FontWeight.BOLD, letter_spacing=3),
            ft.Text("系统版本 9.5.0 正式版", size=10, color=ft.colors.BLUE_GREY_600),
            ft.Divider(height=40, color=ft.colors.TRANSPARENT),
            user_input,
            pass_input,
            ft.Row([remember_me], alignment=ft.MainAxisAlignment.START, width=320),
            error_text,
            ft.Container(height=10),
            login_btn,
            ft.Text("安全加密传输通道已开启", size=9, color=ft.colors.BLUE_GREY_700)
        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=10),
        padding=40,
        alignment=ft.alignment.center
    )
    
    page.add(login_view)

def start_agent_interface(page: ft.Page, user_profile: dict, server_base: str, api_base: str, token: str):
    # Original Main logic starts here, but using user_profile data
    my_name = user_profile["real_name"]
    my_dept = user_profile["department"]
    agent_id = f"Agent-{user_profile['real_name']}"
    local_db = LocalDB()

    # 1. Page Configuration (Restore tactical look)
    page.title = f"Smart-CS Pro ({my_dept}) - {my_name}"
    page.bgcolor = ft.colors.TRANSPARENT
    page.window_bgcolor = ft.colors.TRANSPARENT
    page.window_width = 550
    page.window_height = 250
    page.window_frameless = True
    page.window_always_on_top = True
    page.padding = 20
    
    # 2. Initialize Components
    island = TacticalCapsule(page)
    island.setup_layout()
    
    # Update island to show current user
    island.detail_text.value = f"User: {my_name}"
    island.detail_text.visible = True
    
    # Overlays (Update with logged in profile)
    customer_hud = CustomerHUD(page, agent_id, my_dept)
    customer_hud.api_url = api_base # Sync API URL
    page.overlay.append(customer_hud.get_overlay_control())
    
    helper = IntelliHelper(page, agent_id)
    page.overlay.append(helper.get_overlay_control())
    
    guidance = GuidanceOverlay(page)
    
    product_search = ProductSearchOverlay(page, department=my_dept)
    page.overlay.append(product_search.get_overlay_control())
    
    polisher = TonePolisher(page)
    page.overlay.append(polisher.get_overlay_control())
    
    video_tool = VideoAnalyzer(page)
    page.overlay.append(video_tool.get_overlay_control())
    
    todo_list = MiniTask(page)
    page.overlay.append(todo_list.get_overlay_control())
    
    drag_area = ft.WindowDragArea(content=island, maximizable=False)

    # --- Tool Control ---
    def toggle_tool(tool_instance, button_ref):
        tool_instance.toggle()
        button_ref.set_active(tool_instance.container.visible)

    # --- Actions ---
    def trigger_help(e):
        island.set_state("assist", "SOS SENT", "Requesting help...")
        helper.send_help_request()

    def show_sop_menu(e):
        rules = guidance.local_rules
        if not rules: return
        sop_list = [{"question": f"SOP: {r['keyword']}", "answer": r['title']} for r in rules.values()]
        helper.show_suggestions(sop_list)
        island.set_state("assist", "SOP MENU OPEN", "Select workflow")

    # --- Toggles ---
    def toggle_product_search(e): toggle_tool(product_search, prod_btn)
    def toggle_polisher(e): toggle_tool(polisher, magic_btn)
    def toggle_video(e): toggle_tool(video_tool, vid_btn)
    def toggle_todo(e): toggle_tool(todo_list, task_btn)
    def toggle_hud(e): toggle_tool(customer_hud, user_btn)
    
    def toggle_theme(e):
        page.theme_mode = ft.ThemeMode.LIGHT if page.theme_mode == ft.ThemeMode.DARK else ft.ThemeMode.DARK
        theme_btn.icon = ft.icons.LIGHT_MODE if page.theme_mode == ft.ThemeMode.DARK else ft.icons.DARK_MODE
        # Refresh island appearance if it uses hardcoded colors
        page.update()

    # --- Buttons ---
    theme_btn = TacticalButton(ft.icons.DARK_MODE, ft.colors.BLUE_GREY_400, "Theme", toggle_theme, "Alt+L")
    magic_btn = TacticalButton(ft.icons.AUTO_FIX_HIGH, ft.colors.PURPLE_400, "AI Polish", toggle_polisher, "Alt+P")
    prod_btn = TacticalButton(ft.icons.SHOPPING_BAG, ft.colors.AMBER_400, "Product Search", toggle_product_search, "Alt+S")
    user_btn = TacticalButton(ft.icons.PERSON_SEARCH, ft.colors.BLUE_400, "Customer HUD", toggle_hud, "Alt+U")
    vid_btn = TacticalButton(ft.icons.VIDEO_LIBRARY, ft.colors.CYAN_200, "Video Sum", toggle_video, "Alt+V")
    sop_btn = TacticalButton(ft.icons.LIST_ALT, ft.colors.CYAN_400, "SOP Menu", show_sop_menu, "Click")
    task_btn = TacticalButton(ft.icons.CHECK_CIRCLE, ft.colors.ORANGE_400, "Todo", toggle_todo, "Alt+T")
    help_btn = TacticalButton(ft.icons.SUPPORT, ft.colors.RED_400, "SOS Help", trigger_help, "Alt+H")
    
    island.action_row.controls.extend([theme_btn, magic_btn, prod_btn, user_btn, vid_btn, sop_btn, task_btn, help_btn])

    # --- Shortcuts ---
    def on_keyboard(e: ft.KeyboardEvent):
        if e.alt:
            if e.key == "L": toggle_theme(None)
            # ...
            if e.key == "S": toggle_product_search(None)
            if e.key == "P": toggle_polisher(None)
            if e.key == "U": toggle_hud(None)
            if e.key == "T": toggle_todo(None)
            if e.key == "V": toggle_video(None)
            if e.key == "H": trigger_help(None)
    page.on_keyboard_event = on_keyboard

    # --- Communication ---
    def on_server_message(msg):
        msg_type = msg.get("type")
        if msg_type == "SHAKE": page.run_task(shake_window)
        elif msg_type == "KICK": page.window_destroy()
        elif msg_type == "RELOAD_CONFIG":
            # Real-time config sync
            page.run_task(lambda: island.set_state("assist", "UPDATING...", "Syncing new SOP/Words"))
            guidance.fetch_rules()
            start_hook_safely() # Re-init hook with new words
        elif msg_type == "WHISPER": # NEW: Supervisor Text Instruction
            content = msg.get("content", "")
            page.run_task(lambda: island.set_state("assist", "COMMAND RECEIVED", content))
            # Also show as a non-intrusive snackbar
            page.run_task(lambda: page.show_snack_bar(ft.SnackBar(ft.Text(f"Supervisor: {content}"), bgcolor=ft.colors.CYAN_900)))
        elif msg_type == "PRAISE":
            # ... (keep praise)
            pass

    # --- Enhanced Clipboard Router (V25 NEW) ---
    def _smart_clipboard_loop():
        import pyperclip
        last_clip = ""
        while True:
            try:
                content = pyperclip.paste()
                if content and content != last_clip:
                    last_clip = content
                    # 1. Phone Pattern -> HUD
                    if content.isdigit() and len(content) == 11:
                        page.run_task(lambda: customer_hud._load_data(content))
                        page.run_task(lambda: customer_hud.toggle() if not customer_hud.container.visible else None)
                    # 2. SKU Pattern (Example: Starts with IP15) -> Product Search
                    elif content.startswith("IP15") or content.startswith("SKU-"):
                        page.run_task(lambda: product_search.search_field.set_value(content))
                        page.run_task(lambda: product_search.toggle() if not product_search.container.visible else None)
                        page.run_task(lambda: product_search.on_search_change(ft.ControlEvent(target="", name="", data=content, control=product_search.search_field)))
            except: pass
            time.sleep(1.5)

    threading.Thread(target=_smart_clipboard_loop, daemon=True).start()

    def show_praise_window(text):
        snack = ft.SnackBar(
            content=ft.Row([ft.Icon(ft.icons.STAR, color=ft.colors.AMBER), ft.Text(text, color=ft.colors.AMBER_100)]),
            bgcolor=ft.colors.BLACK,
            duration=5000
        )
        page.snack_bar = snack
        page.snack_bar.open = True
        page.update()

    connect_url = f"{server_base}/ws/agent/{agent_id}?token={token}"
    client = SocketClient(connect_url, on_message=on_server_message)
    client.start()

    # --- Window Tracker ---
    def on_window_change(new_name):
        page.run_task(lambda: customer_hud._load_data(new_name))
    tracker = WindowTracker(on_context_change=on_window_change)

    # --- Violation Hook ---
    def on_violation_detected(keyword):
        if keyword in guidance.local_rules:
            page.run_task(lambda: guidance.check_and_show(keyword))
            return
        if keyword in ["help", "assist", "refund", "退款"]: 
            page.run_task(lambda: helper.trigger_suggestion(keyword))
            page.run_task(lambda: island.set_state("assist", "SUGGESTIONS FOUND", "Click to copy"))
            return
        
        # Violation logic (Screenshot + Report)
        payload = {"type": "AGENT_VIOLATION", "keyword": keyword, "timestamp": time.time(), "screenshot_base64": None}
        try:
            from PIL import ImageGrab
            from io import BytesIO
            import base64
            screenshot = ImageGrab.grab()
            buffered = BytesIO()
            screenshot.save(buffered, format="JPEG", quality=40)
            payload["screenshot_base64"] = base64.b64encode(buffered.getvalue()).decode("utf-8")
        except: pass

        try:
            if client.ws and client.ws.open: client.send(payload)
            else: raise Exception("Offline")
        except: local_db.add_event("VIOLATION", payload)

        if keyword in ["scam", "骗子", "stupid"]:
            page.run_task(lambda: island.set_state("alert", "SENSITIVE WORD DETECTED", f"Match: '{keyword}'"))
            shake_window()

    def shake_window():
        orig_l, orig_t = page.window_left, page.window_top
        for _ in range(10):
            page.window_left = orig_l + random.randint(-10, 10)
            page.window_top = orig_t + random.randint(-10, 10)
            page.update(); time.sleep(0.05)
        page.window_left, page.window_top = orig_l, orig_t
        page.update()
        threading.Timer(3.0, lambda: island.set_state("idle")).start()

    # 5. Input Hook Service
    hook_service = InputHookService(on_violation=on_violation_detected)
    
    def refresh_risk_config():
        """Fetch latest sensitive words and SOP keywords from server and update Hook"""
        print("📥 Refreshing Risk Configuration...")
        try:
            # 1. Fetch Sensitive Words
            res_words = requests.get(f"{api_base}/config/sensitive-words") 
            if res_words.status_code == 200:
                words = res_words.json().get("words", [])
                
                # 2. Combine with SOP Keywords
                sop_keywords = list(guidance.local_rules.keys())
                final_list = list(set(words + sop_keywords + ["退货", "return", "refund"]))
                
                # 3. Update Hook in memory
                hook_service.update_keywords(final_list)
                print(f"✅ Hook updated with {len(final_list)} keywords.")
        except Exception as e:
            print(f"❌ Config refresh failed: {e}")

    def start_hook_safely():
        try:
            refresh_risk_config() # Initial fetch
            hook_service.start()
        except Exception as e:
            print(f"Failed to start hook: {e}")

    # ... (Update on_server_message)
    def on_server_message(msg):
        msg_type = msg.get("type")
        if msg_type == "RELOAD_CONFIG":
            page.run_task(lambda: island.set_state("assist", "UPDATING...", "Risk config synced"))
            # Re-fetch SOPs and Keywords
            guidance.fetch_rules()
            refresh_risk_config()
        # ... rest of handlers


    page.add(ft.Row(controls=[drag_area], alignment=ft.MainAxisAlignment.CENTER))
    start_hook_safely()
    tracker.start()

    def window_event(e):
        if e.data == "close":
            hook_service.stop(); tracker.stop(); page.window_destroy()
    page.on_window_event = window_event

if __name__ == "__main__":
    ft.app(target=main)
