// share.js
let els = {};

export function initShareUI() {
  els.shareBtn     = document.getElementById("shareBtn");
  els.overlay      = document.getElementById("shareOverlay");
  els.preview      = document.getElementById("sharePreview");
  els.nativeBtn    = document.getElementById("nativeShare");
  els.copyBtn      = document.getElementById("copyShare");
  els.closeBtn     = document.getElementById("closeShare");
  els.smsLink      = document.getElementById("smsShare");
  els.tweetLink    = document.getElementById("tweetShare");
  els.mailLink     = document.getElementById("mailShare");
}

/** Open the dialog and wire actions for this specific text */
function openShareDialog(shareText, mailSubject = "My result") {
  if (!els.overlay) initShareUI(); // lazy init if needed
  if (!els.overlay) return;

  // preview
  if (els.preview) els.preview.textContent = shareText;

  // quick links
  if (els.smsLink)   els.smsLink.href   = `sms:?&body=${encodeURIComponent(shareText)}`;
  if (els.tweetLink) els.tweetLink.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  if (els.mailLink)  els.mailLink.href  = `mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(shareText)}`;

  // native share
  if (els.nativeBtn) {
    els.nativeBtn.onclick = async () => {
      if (navigator.share) {
        try { await navigator.share({ text: shareText }); } catch {}
      } else {
        await copyToClipboard(shareText);
        alert("Copied to clipboard!");
      }
    };
  }

  // copy
  if (els.copyBtn) {
    els.copyBtn.onclick = async () => {
      await copyToClipboard(shareText);
      els.copyBtn.textContent = "Copied!";
      setTimeout(() => (els.copyBtn.textContent = "Copy"), 1200);
    };
  }

  // open/close
  els.overlay.hidden = false;
  if (els.closeBtn) els.closeBtn.onclick = () => (els.overlay.hidden = true);
  els.overlay.addEventListener(
    "click",
    (e) => { if (e.target === els.overlay) els.overlay.hidden = true; },
    { once: true }
  );
}

/** Attach a button to call openShareDialog using your provided builder */
export function attachShareButton(buttonElOrId, getShareText, getMailSubject = () => "My result") {
  if (!buttonElOrId) return;
  const btn = typeof buttonElOrId === "string"
    ? document.getElementById(buttonElOrId)
    : buttonElOrId;
  if (!btn) return;

  // Replace any previous handler:
  btn.onclick = () => {
    const text = getShareText();
    const subj = getMailSubject();
    openShareDialog(text, subj);
  };
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export function showShareButton(shareText, mailSubject = "My result") {
  if (!els.shareBtn) initShareUI();
  if (els.shareBtn) els.shareBtn.style.display = 'inline-flex';
}
