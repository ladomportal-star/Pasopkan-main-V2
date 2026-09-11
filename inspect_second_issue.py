# Now let's analyze the second part:
# How foreColor works when applying color a 2nd time to text that ALREADY has color!
# Suppose text was already colored red:
# <span style="color: rgb(255, 0, 0);">Hello</span>
# Or <font color="#ff0000">Hello</font>
# Or <span style="color: #ff0000 !important;">Hello</span>
#
# Now the user changes the color to Blue (#3B82F6).
# If the previous text has `style="color: #ff0000 !important;"` on the outer span or font:
# When execCommand('foreColor', false, '#3B82F6') runs:
# It wraps the inner text in:
# `<span style="color: #ff0000 !important;"><span style="color: rgb(59, 130, 246);">Hello</span></span>`
# BUT THE OUTER SPAN HAS `!important` on its color!
# An inner span's inline style (even with or without !important) DOES NOT override the outer span if the browser styles it this way, OR the previous Method 3 was:
# Look at our previous code:
# const fontEls = editorRef.current.querySelectorAll('font[color]');
# fontEls.forEach((el) => {
#   (el as HTMLElement).style.color = formattedColor;
#   (el as HTMLElement).style.setProperty('color', formattedColor, 'important');
# });
# Notice `editorRef.current.querySelectorAll('font[color]')`!
# What if the browser didn't use <font>, but used <span> because styleWithCSS is true?!
# In Chrome, with styleWithCSS true, `foreColor` creates `<span style="color: ...">`!
# There is NO `<font[color]>`!
# And what did our code do for spans?
# if (sel && sel.rangeCount > 0) {
#   const candidateEls = editorRef.current.querySelectorAll('span, p, strong, em, li, b, i, u');
#   candidateEls.forEach((el) => {
#     if (sel.containsNode(el, true)) {
#       if (el.tagName.toLowerCase() === 'span' && (el.hasAttribute('style') || el.closest('font'))) {
#         (el as HTMLElement).style.color = formattedColor;
#         (el as HTMLElement).style.setProperty('color', formattedColor, 'important');
#       }
#     }
#   });
# }
# Wait! What if the user highlighted part of a word or sentence inside an existing colored span?
# When execCommand runs, Chrome splits or nests the span:
# <span style="color: rgb(255, 0, 0);"><span style="color: rgb(59, 130, 246);">part</span> rest</span>
# If `candidateEls` iterates over the OUTER span:
# `sel.containsNode(outerSpan, true)` is TRUE!
# So it sets outerSpan.style.color = formattedColor too, which colors the rest as well!
# OR if sel was collapsed or lost, sel.containsNode fails!
#
# Even simpler and more standard:
# How do professional WYSIWYG editors apply text color reliably multiple times?
# Let's test standard execCommand behavior in Chromium:
