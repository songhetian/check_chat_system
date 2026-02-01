import flet as ft

class HonorRollView(ft.Control):
    def __init__(self, dept):
        super().__init__()
        self.dept = dept

    def build(self):
        # UI showing two columns: Honor Roll (Left) vs Risk Roll (Right)
        return ft.Container(
            content=ft.Column([
                ft.Text("🏆 红黑榜实时公示 (Honor vs Risk)", size=24, weight=ft.FontWeight.BOLD),
                ft.Divider(),
                ft.Row([
                    # Gold List
                    ft.Container(
                        content=ft.Column([
                            ft.Row([ft.Icon(ft.icons.EMOJI_EVENTS, color=ft.colors.AMBER), ft.Text("精英红榜 (GOLD LIST)", weight=ft.FontWeight.BOLD)]),
                            ft.ListView(
                                controls=[
                                    self._build_agent_tile("Agent-Elite-01", "12天零违规", ft.colors.AMBER_400),
                                    self._build_agent_tile("Agent-Elite-05", "8天零违规", ft.colors.AMBER_200),
                                    self._build_agent_tile("Agent-Elite-09", "5天零违规", ft.colors.AMBER_100),
                                ],
                                spacing=10
                            )
                        ]),
                        expand=1, bgcolor="#14211a", padding=20, border_radius=12, border=ft.border.all(1, ft.colors.AMBER_900)
                    ),
                    # Red List
                    ft.Container(
                        content=ft.Column([
                            ft.Row([ft.Icon(ft.icons.GAVEL, color=ft.colors.RED), ft.Text("预警黑榜 (RED LIST)", weight=ft.FontWeight.BOLD)]),
                            ft.ListView(
                                controls=[
                                    self._build_agent_tile("Agent-Risk-03", "本周违规 12次", ft.colors.RED_400),
                                    self._build_agent_tile("Agent-Risk-07", "本周违规 8次", ft.colors.RED_200),
                                ],
                                spacing=10
                            )
                        ]),
                        expand=1, bgcolor="#211414", padding=20, border_radius=12, border=ft.border.all(1, ft.colors.RED_900)
                    )
                ], spacing=20, expand=True)
            ]),
            expand=True
        )

    def _build_agent_tile(self, name, reason, color):
        return ft.Container(
            content=ft.Row([
                ft.CircleAvatar(content=ft.Text(name[0])),
                ft.Column([
                    ft.Text(name, weight=ft.FontWeight.BOLD),
                    ft.Text(reason, size=12, color=color)
                ], spacing=0)
            ]),
            padding=10, bgcolor=ft.colors.WHITE10, border_radius=8
        )
