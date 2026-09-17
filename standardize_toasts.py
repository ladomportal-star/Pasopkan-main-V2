import os
import re

directories = ['frontend/src/pages', 'frontend/src/components']
files_to_process = []

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx'):
                files_to_process.append(os.path.join(root, file))

for file_path in files_to_process:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. We will replace all `<CheckCircle2 ... />`, `<XCircle ... />`, `<AlertCircle ... />`, `<Info ... />`, `<Share2 ... />` inside any toast-like blocks.
    # But wait, it's safer to just replace the whole `<AnimatePresence> ... </AnimatePresence>` for the toasts we know about if we can't reliably regex.
    # Actually, let's just strip out any `<CheckCircle2...>`, `<AlertCircle...>`, `<XCircle...>`, `<Info...>` from inside toast containers.
    # What identifies a toast container? className string containing "shadow-2xl" and "fixed".
    
    # Let's do it manually for the ones we missed:
    # EditProfile.tsx
    if file_path.endswith('EditProfile.tsx'):
        content = re.sub(r'<CheckCircle2 className="[^"]+" />', '', content)
        content = re.sub(r'<div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">.*?</div>', '', content, flags=re.DOTALL)
        
    # LanguageSettings.tsx
    if file_path.endswith('LanguageSettings.tsx'):
        # Just rewrite the whole block
        target = r'\{showSuccessToast && \(\s*<motion\.div.*?className="fixed bottom-24.*?".*?>\s*<span>\{toastMessage\}</span>\s*</motion\.div>\s*\)\}'
        replacement = """{showSuccessToast && (
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
        
    # Notifications.tsx
    if file_path.endswith('Notifications.tsx'):
        target = r'\{showSuccessToast && \(\s*<motion\.div.*?className="fixed bottom-24.*?".*?>\s*\{toastMessage\}\s*</motion\.div>\s*\)\}'
        replacement = """{showSuccessToast && (
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
        
    # PastEvents.tsx
    if file_path.endswith('PastEvents.tsx'):
        target = r'\{toastMessage && \(\s*<motion\.div.*?className="fixed bottom-24.*?".*?>\s*\{toastMessage\}\s*</motion\.div>\s*\)\}'
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

    # PaymentMethods.tsx
    if file_path.endswith('PaymentMethods.tsx'):
        target = r'\{showSuccess && \(\s*<motion\.div.*?className="fixed bottom-24.*?".*?>\s*<span>\{toastMessage \|\| t\.changesSaved\}</span>\s*</motion\.div>\s*\)\}'
        replacement = """{showSuccess && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">{toastMessage || t.changesSaved}</span>
            </motion.div>
          </div>
        )}"""
        content = re.sub(target, replacement, content, flags=re.DOTALL)
        
    # StaffScanner.tsx
    if file_path.endswith('StaffScanner.tsx'):
        target = r'\{toastMessage && \(\s*<motion\.div.*?className="fixed bottom-24.*?".*?>\s*<span>\{toastMessage\.text\}</span>\s*</motion\.div>\s*\)\}'
        replacement = """{toastMessage && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">{toastMessage.text}</span>
            </motion.div>
          </div>
        )}"""
        content = re.sub(target, replacement, content, flags=re.DOTALL)
        
    # AdminBlogsTab.tsx
    if file_path.endswith('AdminBlogsTab.tsx'):
        target = r'\{toastMessage && \(\s*<motion\.div.*?className="fixed top-6 right-6.*?".*?>\s*<span>\{toastMessage\}</span>\s*</motion\.div>\s*\)\}'
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
        
    # EventDetails.tsx
    if file_path.endswith('EventDetails.tsx'):
        target = r'\{shareSuccess && \(\s*<motion\.div.*?className="fixed bottom-12 left-1/2.*?".*?>\s*\{t\.linkCopied\}\s*</motion\.div>\s*\)\}'
        replacement = """{shareSuccess && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">{t.linkCopied}</span>
            </motion.div>
          </div>
        )}"""
        content = re.sub(target, replacement, content, flags=re.DOTALL)

    # Account.tsx profile pic toast
    if file_path.endswith('Account.tsx'):
        target = r'\{showProfilePicSuccess && \(\s*<motion\.div.*?className="fixed bottom-24.*?".*?>\s*<span>\{t\.profileUpdated\}</span>\s*</motion\.div>\s*\)\}'
        replacement = """{showProfilePicSuccess && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug text-black">{t.profileUpdated}</span>
            </motion.div>
          </div>
        )}"""
        content = re.sub(target, replacement, content, flags=re.DOTALL)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Standardized {file_path}")

