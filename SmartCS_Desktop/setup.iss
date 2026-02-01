; Smart-CS 工业级安全监管平台 安装脚本
#define MyAppName "Smart-CS 智能客服监管系统"
#define MyAppVersion "9.5.0"
#define MyAppPublisher "SmartCS 数字情报部"
#define MyAppURL "https://www.smartcs.com/"
#define MyAppExeName "SmartCS_Admin.exe"
#define MyGuardExeName "SmartCS_Guard.exe"
#define MyAgentExeName "SmartCS_Agent.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-1234-567890ABCDEF}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\SmartCS
DisableProgramGroupPage=yes
OutputDir=Output
OutputBaseFilename=SmartCS_Pro_Setup_v950
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "chinesesimplified"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "附加任务:"; Flags: unchecked

[Files]
Source: "dist\SmartCS_Admin.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\SmartCS_Agent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\SmartCS_Guard.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\SmartCS_Server.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\SmartCS_HQ.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "server_config.json"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
; 核心：在系统启动时自动运行 GUARD 服务进行实时监控
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "SmartCSGuard"; ValueData: "{app}\{#MyGuardExeName}"; Flags: uninsdeletevalue

[Run]
; 安装完成后立即启动守护进程
Filename: "{app}\{#MyGuardExeName}"; Description: "启动后台安全防护"; Flags: nowait postinstall skipifsilent
Filename: "{app}\{#MyAppExeName}"; Description: "打开管理控制台"; Flags: nowait postinstall skipifsilent