import flet as ft
from datetime import datetime

class ViolationQueue(ft.Control):
    def __init__(self):
        super().__init__()
        # agent_id -> {count, last_time, last_word, is_handled}
        self.active_alerts = {} 

    def build(self):
        self.alert_list = ft.Column(spacing=10, scroll=ft.ScrollMode.AUTO)
        
        return ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text("⚡ 紧急响应队列 (Priority Queue)", size=18, weight=ft.FontWeight.BOLD, color=ft.colors.RED_200),
                    ft.Badge(content=ft.Text("0"), label="ALERTS", bgcolor=ft.colors.RED)
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                ft.Divider(color=ft.colors.WHITE10),
                self.alert_list
            ]),
            bgcolor="#141e2a",
            padding=15,
            border_radius=12,
            border=ft.border.all(1, ft.colors.WHITE10),
            expand=True
        )

    def add_or_update_alert(self, agent_id, keyword, timestamp):
        """Update local queue and trigger re-sort"""
        if agent_id not in self.active_alerts:
            self.active_alerts[agent_id] = {
                "id": agent_id,
                "count": 1,
                "last_time": timestamp,
                "last_word": keyword,
                "handled": False
            }
        else:
            self.active_alerts[agent_id]["count"] += 1
            self.active_alerts[agent_id]["last_time"] = timestamp
            self.active_alerts[agent_id]["last_word"] = keyword
            self.active_alerts[agent_id]["handled"] = False # Re-open if was handled

        self._refresh_ui()

    def _refresh_list(self):
        # 1. Sort logic: Unhandled first, then by count (desc), then by time
        sorted_keys = sorted(
            self.active_alerts.keys(),
            key=lambda k: (
                not self.active_alerts[k]["handled"], 
                self.active_alerts[k]["count"], 
                self.active_alerts[k]["last_time"]
            ),
            reverse=True
        )

        self.alert_list.controls.clear()
        active_count = 0
        
        for k in sorted_keys:
            alert = self.active_alerts[k]
            if alert["handled"]: continue
            
            active_count += 1
            # Color logic based on frequency
            border_color = ft.colors.BLUE_700
            if alert["count"] >= 3: border_color = ft.colors.ORANGE_700
            if alert["count"] >= 5: border_color = ft.colors.RED_700

            self.alert_list.controls.append(
                ft.Container(
                    content=ft.Column([
                        ft.Row([
                            ft.Column([
                                ft.Text(alert["id"], weight=ft.FontWeight.BOLD, size=14),
                                ft.Text(f"违规词: {alert['last_word']}", size=12, color=ft.colors.GREY_400),
                            ], expand=True),
                            ft.IconButton(ft.icons.REPLAY, icon_color=ft.colors.CYAN_400, tooltip="一键抖动警告", on_click=lambda e, aid=alert["id"]: self._quick_action(aid, "SHAKE")),
                            ft.IconButton(ft.icons.CHECK_CIRCLE_OUTLINE, icon_color=ft.colors.GREEN_400, on_click=lambda e, aid=alert["id"]: self._handle_alert(aid))
                        ]),
                        # Quick Instruction Row
                        ft.Row([
                            cmd_input := ft.TextField(hint_text="发送实时指令...", height=30, text_size=11, expand=True, border_radius=5, bgcolor=ft.colors.BLACK26),
                            ft.IconButton(ft.icons.SEND_ROUNDED, icon_size=16, on_click=lambda e, aid=alert["id"], inp=cmd_input: self._send_whisper(aid, inp))
                        ], spacing=5)
                    ]),
                    padding=10,
                    bgcolor=ft.colors.WHITE10,
                    border=ft.border.all(1, border_color),
                    border_radius=8,
                )
            )
    
    def _quick_action(self, agent_id, type):
        # Triggered through page.session link back to socket
        send_cmd = self.page.session.get("send_command")
        if send_cmd:
            send_cmd(agent_id, {"type": type})

    def _send_whisper(self, agent_id, input_control):
        if not input_control.value: return
        send_cmd = self.page.session.get("send_command")
        if send_cmd:
            send_cmd(agent_id, {"type": "WHISPER", "content": input_control.value})
            input_control.value = ""
            self.update()
            self.page.snack_bar = ft.SnackBar(ft.Text(f"已向 {agent_id} 发送实时指令"))
            self.page.snack_bar.open = True
            self.page.update()
        
        # Update badge
        self.controls[0].content.controls[0].controls[1].content.value = str(active_count)
        self.update()

    def _handle_alert(self, agent_id):
        if agent_id in self.active_alerts:
            self.active_alerts[agent_id]["handled"] = True
            self._refresh_list()

    def _refresh_ui(self):
        self._refresh_list()
