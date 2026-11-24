!macro NSIS_HOOK_PREINSTALL
  StrCpy $INSTDIR "$EXEDIR"
  SetOutPath "$INSTDIR"
!macroend
