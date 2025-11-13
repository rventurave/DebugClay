// Editor de codigo con CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById("codeInput"), {
  lineNumbers: true,
  mode: "text/x-csrc",
  theme: "default"
});

// Indicador de línea actual
const arrow = document.getElementById("arrowIndicator");
export function moveArrowToLine(line) {
  const lineHeight = editor.defaultTextHeight();
  const scrollInfo = editor.getScrollInfo();
  const visibleLines = Math.floor(scrollInfo.clientHeight / lineHeight);
  const firstVisible = editor.lineAtHeight(scrollInfo.top, "local");
  const lastVisible = firstVisible + visibleLines - 1;


  if (line < firstVisible) {
    editor.scrollTo(null, editor.heightAtLine(line, "local"));
  } else if (line > lastVisible) {
    editor.scrollTo(null, editor.heightAtLine(line - visibleLines + 1, "local"));
  }

  const relativeLine = Math.max(0, Math.min(line - firstVisible, visibleLines - 1));
  const codeMirrorTop = editor.getWrapperElement().getBoundingClientRect().top -
    editor.getWrapperElement().parentElement.getBoundingClientRect().top;
  const offsetTop = codeMirrorTop + 4 + relativeLine * lineHeight; // 4px para alinear mejor
  arrow.style.top = offsetTop + "px";
}
// Inicializa la flecha en la primera línea
editor.on("refresh", () => moveArrowToLine(0));
editor.on("changes", () => moveArrowToLine(0));
moveArrowToLine(0);