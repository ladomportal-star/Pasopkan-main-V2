const fs = require('fs');

let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf-8');

const oldShare = `  const handleShare = async () => {
    if (!event) return;
    
    const shareUrl = window.location.href;
    let copied = false;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }
    } catch (err) {
      console.warn('Failed to use navigator.clipboard, trying fallback:', err);
    }
    
    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          copied = true;
        }
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
    }

    if (copied) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } else {
      // In case copy failed completely, alert or still show toast advising manually copying
      console.warn('Could not copy link automatically.');
    }
  };`;

const newShare = `  const handleShare = async () => {
    if (!event) return;
    
    const shareUrl = window.location.href;

    // 1. Try Native Share API first (best for mobile and modern desktop browsers)
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: \`Check out \${event.title} on Pasopkan\`,
          url: shareUrl,
        });
        return; // Success!
      }
    } catch (err: any) {
      // If user cancelled, don't show an error or try clipboard
      if (err.name === 'AbortError') return;
      console.warn('Native share failed', err);
    }
    
    // 2. Fallback to Clipboard API
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }
    } catch (err) {
      console.warn('Failed to use navigator.clipboard, trying fallback:', err);
    }
    
    // 3. Ultimate fallback to execCommand
    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          copied = true;
        }
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
    }

    if (copied) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } else {
      console.warn('Could not copy link automatically.');
    }
  };`;

content = content.replace(oldShare, newShare);

// Now remove the "Copy Address" button
const oldCopyBtn = `                     <button
                       type="button"
                       onClick={() => {
                         const fullAddr = [event.venue, event.location, event.district, event.province, 'Laos'].filter(Boolean).join(', ');
                         navigator.clipboard.writeText(fullAddr || 'Vientiane, Laos');
                         setCopiedMapAddress(true);
                         setTimeout(() => setCopiedMapAddress(false), 2000);
                       }}
                       className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                     >
                       {copiedMapAddress ? (
                         <>
                           <Check className="w-3.5 h-3.5 text-emerald-600" />
                           <span className="text-emerald-600">{lang === 'lo' ? 'ສຳເນົາແລ້ວ' : 'Copied'}</span>
                         </>
                       ) : (
                         <>
                           <Copy className="w-3.5 h-3.5 text-gray-500" />
                           <span>{lang === 'lo' ? 'ສຳເນົາທີ່ຢູ່' : 'Copy Address'}</span>
                         </>
                       )}
                     </button>`;

content = content.replace(oldCopyBtn, '');

// Also remove `setCopiedMapAddress` state declaration
content = content.replace('  const [copiedMapAddress, setCopiedMapAddress] = useState(false);\n', '');

fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
