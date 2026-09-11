# Let's see what execCommand('foreColor', false, '#...') does in Chromium:
# In modern browsers, when document.execCommand('foreColor', false, color) is called:
# 1) If styleWithCSS is true, it wraps selection in <span style="color: rgb(...)">
# 2) If the selection ALREADY had a color from before, e.g.
#    <span style="color: rgb(239, 68, 68)">Text</span>
#    and the user selects a part of it, or the whole thing:
#    Chromium's execCommand might NOT override an existing outer span's style if it was inherited, or it might nest another span:
#    <span style="color: rgb(239, 68, 68)"><span style="color: rgb(...)">Text</span></span>
# BUT what if the text was inside:
# <p className="mb-4 text-gray-400">{t.introPlaceholder}</p>
# or <p className="mb-2 text-gray-600">{t.tncEvent}</p>
# or <ul className="... text-gray-600"><li><strong>...</strong> ...</li></ul>
# Notice the parent has class:
# "text-gray-400" or "text-gray-600" or "text-gray-800"
# Wait! In CSS:
# An inline style on <span style="color: #123456"> has specificity (1, 0, 0, 0)
# which beats .text-gray-600 (0, 0, 1, 0).
# BUT what if the selection wasn't wrapped in a span at all because document.execCommand failed?
# Why would document.execCommand fail or apply the wrong color?
# Let's analyze:
