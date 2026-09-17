import re

with open('frontend/src/components/HomeBlogSection.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <ShareArticleButton blog={readingBlog} dropUp={true} />
                <button
                  type="button"
                  onClick={handleCloseBlog}
                  className="px-6 py-2.5 rounded-xl bg-adv-slate text-white text-xs font-black uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
                >
                  {isLao ? 'ປິດໜ້າຕ່າງ' : 'Close'}
                </button>
              </div>"""

replacement = """              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end sm:justify-between">
                <div className="hidden sm:block">
                  <ShareArticleButton blog={readingBlog} dropUp={true} />
                </div>
                <button
                  type="button"
                  onClick={handleCloseBlog}
                  className="px-6 py-2.5 w-full sm:w-auto rounded-xl bg-adv-slate text-white text-xs font-black uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
                >
                  {isLao ? 'ປິດໜ້າຕ່າງ' : 'Close'}
                </button>
              </div>"""

if target in content:
    content = content.replace(target, replacement)
    print("Patched successfully")
else:
    print("Target not found")

with open('frontend/src/components/HomeBlogSection.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
