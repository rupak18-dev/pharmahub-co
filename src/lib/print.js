export function printHtml(html, onError) {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.setAttribute("aria-hidden", "true");
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) {
    document.body.removeChild(frame);
    onError?.();
    return;
  }
  frame.onload = () => {
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 150);
  };
  frame.src = "about:blank";
}
