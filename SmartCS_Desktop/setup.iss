; Smart-CS Professional Installer Script (V9.0)
#define MyAppName "Smart-CS Tactical Platform"
#define MyAppVersion "9.0.5"
#define MyAppPublisher "SmartCS Digital Intelligence"
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
OutputBaseFilename=SmartCS_Setup_Pro
Compression=lzma
SolidCompression=yes
WizardStyle=modern
; Brand Customization (Place your bmp files in assets folder)
; WizardImageFile=assets\installer_side.bmp
; WizardSmallImageFile=assets\installer_logo.bmp

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\SmartCS_Admin.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\SmartCS_Agent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\SmartCS_Guard.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\SmartCS_Server.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "server_config.json"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
; CRITICAL: Auto-start the GUARD service on system boot for monitoring
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "SmartCSGuard"; ValueData: "{app}\{#MyGuardExeName}"; Flags: uninsdeletevalue

[Run]
; Launch Guard immediately after install (it will then launch the Agent)
Filename: "{app}\{#MyGuardExeName}"; Description: "Start Background Protection"; Flags: nowait postinstall skipifsilent
Filename: "{app}\{#MyAppExeName}"; Description: "Launch Admin Console"; Flags: nowait postinstall skipifsilent