!macro customInstall
  DetailPrint "Installing Visual C++ Redistributable..."
  ExecWait '"$INSTDIR\resources\vcredist_x64.exe" /install /quiet /norestart'
!macroend
