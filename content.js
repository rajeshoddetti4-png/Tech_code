let floatBtn = null;
document.addEventListener('mouseup', (e) => {
  const sel = window.getSelection()?.toString()?.trim();
  if (floatBtn) { floatBtn.remove(); floatBtn = null; }
  if (sel && sel.length > 10) {
    chrome.storage.session.set({ selectedText: sel, selectedAt: Date.now() });
    floatBtn = document.createElement('div');
    floatBtn.innerHTML = `<div id="genie-float" style="position:fixed;top:${e.clientY-44}px;left:${e.clientX}px;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;padding:5px 13px;border-radius:20px;font-size:12px;font-family:sans-serif;font-weight:600;cursor:pointer;z-index:999999;box-shadow:0 3px 14px rgba(0,0,0,.3);white-space:nowrap;">✦ Ask Genie</div>`;
    document.body.appendChild(floatBtn);
    document.getElementById('genie-float').onclick = () => { chrome.storage.session.set({ triggerAsk: Date.now() }); floatBtn.remove(); floatBtn = null; };
    setTimeout(() => { if (floatBtn) { floatBtn.remove(); floatBtn = null; } }, 4000);
  }
});
document.addEventListener('scroll', () => { if (floatBtn) { floatBtn.remove(); floatBtn = null; } });
