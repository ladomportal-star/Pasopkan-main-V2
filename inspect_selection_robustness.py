# Let's test a complete custom color implementation that guarantees:
# 1) Selection is ALWAYS tracked in real-time via `selectionchange` on document, but ONLY when within editorRef.current and NOT collapsed!
#    This means:
#    - User highlights text: savedRange is captured.
#    - User clicks ANYWHERE (dropdown, toolbar, button, input): savedRange is NOT destroyed or overwritten!
#    - User drags color slider: each drag step restores savedRange and applies color instantly!
# 2) For text custom input:
#    Keep a separate local state for the custom hex input, e.g. `customHexInput`.
#    Only when valid (e.g. 6-hex digits with optional #), apply it to `selectedTextColor` and the editor text!
#    And ensure <input type="color"> ALWAYS receives a strictly valid 7-char hex like /^#[0-9a-fA-F]{6}$/ (falling back to '#EF4444' if not).
# 3) When applying the color:
#    We use:
#    a) document.execCommand('styleWithCSS', false, 'true')
#    b) document.execCommand('foreColor', false, formattedColor)
#    c) PLUS: Direct DOM styling of all wrapped nodes / font elements / styled spans to guarantee that:
#       - `style.color = formattedColor`
#       - `style.setProperty('color', formattedColor, 'important')`
#       so that no external stylesheet, Tailwind prose, or ancestor style can ever override it!
# 4) Also provide preset color swatches + custom color picker + custom HEX input with an "Apply" button or on enter or live when 6 chars are typed!
