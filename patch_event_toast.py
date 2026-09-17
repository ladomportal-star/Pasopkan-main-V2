import re

with open('frontend/src/pages/EventDetails.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      {/* Share Toast */}
      <AnimatePresence>
        {shareSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className="fixed bottom-12 left-1/2 z-[150] bg-adv-slate text-white px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <Share2 className="w-4 h-4 text-adv-orange" />
            {t.linkCopied}
          </motion.div>
        )}
      </AnimatePresence>"""

replacement = """      {/* Share Toast */}
      <AnimatePresence>
        {shareSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className="fixed bottom-12 left-1/2 z-[150] bg-white text-black px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 border border-gray-200"
          >
            {t.linkCopied}
          </motion.div>
        )}
      </AnimatePresence>"""

if target in content:
    content = content.replace(target, replacement)
    print("Patched EventDetails Toast")

with open('frontend/src/pages/EventDetails.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
