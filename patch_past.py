import re

with open('frontend/src/pages/PastEvents.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = r'\{toastMessage && \(\s*<motion\.div.*?className="fixed bottom-24.*?">.*?</motion\.div>\s*\)\}'

replacement = """{toastMessage && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">{toastMessage}</span>
            </motion.div>
          </div>
        )}"""

content = re.sub(target, replacement, content, flags=re.DOTALL)

with open('frontend/src/pages/PastEvents.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched PastEvents")
