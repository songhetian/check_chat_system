import flet as ft

class SettingsManager(ft.UserControl):
    def __init__(self):
        super().__init__()
        # Simulated Data
        self.sensitive_words = [
            {"id": 1, "word": "Refund Now", "level": "High", "action": "Alert+Shake"},
            {"id": 2, "word": "Scam", "level": "High", "action": "Block"},
            {"id": 3, "word": "Stupid", "level": "Medium", "action": "Alert"},
        ]
        self.monitor_words = [
            {"id": 1, "word": "CompetitorX", "category": "Business", "count": 142},
            {"id": 2, "word": "Too expensive", "category": "Feedback", "count": 55},
        ]

    def build(self):
        self.tabs = ft.Tabs(
            selected_index=0,
            animation_duration=300,
            tabs=[
                ft.Tab(
                    text="Sensitive Words",
                    icon=ft.icons.SHIELD,
                    content=self._build_sensitive_word_panel()
                ),
                ft.Tab(
                    text="Monitor Words",
                    icon=ft.icons.HEARING,
                    content=self._build_monitor_word_panel()
                ),
                ft.Tab(
                    text="Staff Management",
                    icon=ft.icons.PEOPLE_OUTLINE,
                    content=self._build_staff_panel()
                ),
                ft.Tab(
                    text="Data Import/Export",
                    icon=ft.icons.IMPORT_EXPORT,
                    content=self._build_data_panel()
                ),
            ],
            expand=True
        )
        return self.tabs

    def _build_sensitive_word_panel(self):
        # Data Table for Sensitive Words
        table = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("Word")),
                ft.DataColumn(ft.Text("Risk Level")),
                ft.DataColumn(ft.Text("Trigger Action")),
                ft.DataColumn(ft.Text("Manage")),
            ],
            rows=[
                ft.DataRow(cells=[
                    ft.DataCell(ft.Text(item["word"])),
                    ft.DataCell(ft.Container(
                        content=ft.Text(item["level"], size=10),
                        bgcolor=ft.colors.RED_900 if item["level"]=="High" else ft.colors.ORANGE_900,
                        padding=5, border_radius=5
                    )),
                    ft.DataCell(ft.Text(item["action"])),
                    ft.DataCell(ft.Row([
                        ft.IconButton(ft.icons.EDIT, icon_size=16, icon_color=ft.colors.BLUE_400),
                        ft.IconButton(ft.icons.DELETE, icon_size=16, icon_color=ft.colors.RED_400),
                    ]))
                ]) for item in self.sensitive_words
            ],
            border=ft.border.all(1, ft.colors.WHITE10),
            border_radius=10,
        )
        
        return ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text("Interceptor Configuration", size=18, weight=ft.FontWeight.BOLD),
                    ft.Row([
                        ft.ElevatedButton("Add New Word", icon=ft.icons.ADD, bgcolor=ft.colors.BLUE_700, color=ft.colors.WHITE),
                        ft.ElevatedButton(
                            "Push Sync to All", 
                            icon=ft.icons.SYNC, 
                            bgcolor=ft.colors.ORANGE_700, 
                            color=ft.colors.WHITE,
                            on_click=self._trigger_global_sync
                        )
                    ], spacing=10)
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                ft.Divider(color=ft.colors.WHITE10),
                table
            ]),
            padding=20,
        )

    def _trigger_global_sync(self, e):
        # Access the commander through page session
        send_cmd = self.page.session.get("send_command")
        if send_cmd:
            # Target 'ALL' tells server to broadcast to the whole department
            send_cmd("ALL", {"type": "RELOAD_CONFIG"})
            self.page.snack_bar = ft.SnackBar(ft.Text("🚀 Sync Command Pushed to all agents!"), bgcolor=ft.colors.GREEN_700)
            self.page.snack_bar.open = True
            self.page.update()

    def _build_monitor_word_panel(self):
        return ft.Container(
            content=ft.Column([
                ft.Text("Passive Monitoring (Non-blocking)", size=18, weight=ft.FontWeight.BOLD),
                ft.Text("These words will be logged for trend analysis but won't trigger alerts.", size=12, color=ft.colors.GREY_400),
                ft.Divider(),
                ft.Wrap(
                    spacing=10,
                    run_spacing=10,
                    controls=[
                        ft.Chip(
                            label=ft.Text(f"{item['word']} ({item['count']})"),
                            leading=ft.Icon(ft.icons.LABEL_IMPORTANT_OUTLINE),
                            bgcolor=ft.colors.BLUE_GREY_900,
                            on_delete=lambda e: print("Deleted"),
                        ) for item in self.monitor_words
                    ]
                )
            ]),
            padding=20
        )

    def _build_staff_panel(self):
        return ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text("Employee & Hardware Auth", size=18, weight=ft.FontWeight.BOLD),
                    ft.ElevatedButton("Import from Excel", icon=ft.icons.UPLOAD_FILE)
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                ft.Divider(),
                # Mock Staff List
                ft.ListView(
                    controls=[
                        ft.ListTile(
                            leading=ft.CircleAvatar(content=ft.Icon(ft.icons.PERSON)),
                            title=ft.Text("Agent 001 (Zhang San)"),
                            subtitle=ft.Text("HW-ID: 8A-2B-C3... | Status: Online"),
                            trailing=ft.PopupMenuButton(
                                items=[
                                    ft.PopupMenuItem(text="Edit Profile"),
                                    ft.PopupMenuItem(text="Reset Hardware Binding"),
                                    ft.PopupMenuItem(text="Kick Out", icon=ft.icons.EXIT_TO_APP, text_style=ft.TextStyle(color=ft.colors.RED)),
                                ]
                            )
                        ),
                         ft.ListTile(
                            leading=ft.CircleAvatar(content=ft.Icon(ft.icons.PERSON)),
                            title=ft.Text("Agent 002 (Li Si)"),
                            subtitle=ft.Text("HW-ID: Pending... | Status: Offline"),
                            trailing=ft.Icon(ft.icons.MORE_VERT)
                        ),
                    ]
                )
            ]),
            padding=20
        )
    
    def _build_data_panel(self):
        return ft.Container(
            content=ft.Column([
                ft.Text("Data Management Center", size=18, weight=ft.FontWeight.BOLD),
                ft.Divider(),
                ft.Row([
                    self._build_action_card("Export Logs", "Download full audit logs (CSV/Excel)", ft.icons.DOWNLOAD, ft.colors.GREEN),
                    self._build_action_card("Backup DB", "Create a full snapshot of SQL Database", ft.icons.STORAGE, ft.colors.BLUE),
                    self._build_action_card("Restore", "Restore system from backup file", ft.icons.RESTORE, ft.colors.ORANGE),
                ], spacing=20)
            ]),
            padding=20
        )

    def _build_action_card(self, title, subtitle, icon, color):
        return ft.Container(
            content=ft.Column([
                ft.Icon(icon, size=40, color=color),
                ft.Text(title, weight=ft.FontWeight.BOLD),
                ft.Text(subtitle, size=12, color=ft.colors.GREY_400, text_align=ft.TextAlign.CENTER),
                ft.ElevatedButton("Execute", height=30)
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=10),
            padding=20,
            bgcolor=ft.colors.WHITE10,
            border_radius=10,
            width=200,
            height=200,
            alignment=ft.alignment.center
        )
