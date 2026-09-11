# Let's test how browsers handle document.execCommand('foreColor')
# In chromium / webkit:
# When document.execCommand('styleWithCSS', false, 'true') is set:
# document.execCommand('foreColor', false, '#123456') produces:
# <span style="color: rgb(18, 52, 86);">...</span>
# BUT when foreColor is called again on the same text with a different color:
# Chrome sometimes nests another span or fails if selection is lost.
# More importantly, prose classes in Tailwind CSS:
# "prose prose-sm prose-slate"
# In Tailwind CSS Typography (@tailwindcss/typography or prose classes):
# .prose { color: var(--tw-prose-body); }
# and p, span, li might have CSS rules. BUT inline style style="color: #..." has higher specificity than .prose unless !important or unless overridden!
