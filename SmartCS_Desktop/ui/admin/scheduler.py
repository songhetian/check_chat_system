import flet as ft
from datetime import datetime
import threading
import time

class MissionScheduler(ft.UserControl):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.tasks = [
            {"time": "10:00", "desc": "抽查 A 组昨日违规截图", "done": False},
            {"time": "14:30", "desc": "更新本周敏感词库", "done": False},
            {"time": "17:00", "desc": "导出并发送当日治理日报", "done": False},
        ]
        threading.Thread(target=self._clock_loop, daemon=True).start()

    def build(self):
        self.task_list = ft.Column(spacing=10)
        self._refresh_list()
        
        return ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text("🗓️ 管理员任务调度 (Mission Scheduler)", size=20, weight=ft.FontWeight.BOLD),
                    ft.IconButton(ft.icons.ADD_ALARM, on_click=self._add_task_dialog)
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                ft.Divider(),
                self.task_list
            ]),
            padding=20,
            bgcolor="#1c232e",
            border_radius=10,
            expand=True
        )

    def _refresh_list(self):
        self.task_list.controls.clear()
        for t in self.tasks:
            self.task_list.controls.append(
                ft.Checkbox(
                    label=f"[{t['time']}] {t['desc']}",
                    value=t['done'],
                    label_style=ft.TextStyle(size=14, color=ft.colors.WHITE70 if not t['done'] else ft.colors.GREY_500),
                    on_change=lambda e, task=t: self._toggle_task(task)
                )
            )
        self.update()

    def _toggle_task(self, task):
        task['done'] = not task['done']
        self._refresh_list()

    def _add_task_dialog(self, e):
        # Implementation for adding task via dialog
        pass

    def _clock_loop(self):
        """Monitor time and trigger alerts"""
        while True:
            now = datetime.now().strftime("%H:%M")
            for t in self.tasks:
                if t['time'] == now and not t['done']:
                    # Trigger Alarm
                    self._show_alarm(t['desc'])
                    # Wait a minute to not re-trigger
                    time.sleep(61)
            time.sleep(10)

    def _show_alarm(self, desc):
        # Use Flet's system tray notification if possible, or a loud snackbar
        self.page.snack_bar = ft.SnackBar(
            content=ft.Row([
                ft.Icon(ft.icons.ALARM, color=ft.colors.WHITE),
                ft.Text(f"任务提醒：{desc}", weight=ft.FontWeight.BOLD)
            ]),
            bgcolor=ft.colors.ORANGE_700,
            duration=10000 # Stay longer
        )
        self.page.snack_bar.open = True
        self.page.update()
        # Optionally: play a sound using a library like playsound
