import re

files = [
    'frontend/src/pages/Account.tsx',
    'frontend/src/pages/UpdatePassword.tsx',
    'frontend/src/pages/LanguageSettings.tsx',
    'frontend/src/pages/StaffScanner.tsx',
    'frontend/src/pages/PastEvents.tsx',
    'frontend/src/pages/EditProfile.tsx'
]

# In Account.tsx, find the toast queue block
for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        if file_path == 'frontend/src/pages/Account.tsx':
            target_1 = """              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              {/* 5-second auto-remove progress line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="h-full bg-adv-orange"
                />
              </div>
              {toast.type === 'error' && <XCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-red-500" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-adv-orange" />}
              {toast.type === 'info' && <Info className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-blue-500" />}
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-emerald-500" />}
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug text-black">{toast.text}</span>"""
            
            replacement_1 = """              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug text-black">{toast.text}</span>"""
            content = content.replace(target_1, replacement_1)

        elif file_path == 'frontend/src/pages/StaffScanner.tsx':
            target_2 = """            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[300] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
            style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#e5e7eb' }}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />}
            {toastMessage.type === 'warning' && <AlertCircle className="w-5 h-5 shrink-0 text-adv-orange" />}
            {toastMessage.type === 'error' && <XCircle className="w-5 h-5 shrink-0 text-red-500" />}
            <span>{toastMessage.text}</span>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-adv-orange"
              />
            </div>"""
            replacement_2 = """            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[300] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
            style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#e5e7eb' }}
          >
            <span>{toastMessage.text}</span>"""
            content = content.replace(target_2, replacement_2)
            
        elif file_path == 'frontend/src/pages/LanguageSettings.tsx':
            target_3 = """            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[100] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-adv-orange"
              />
            </div>"""
            replacement_3 = """            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[100] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
          >
            <span>{toastMessage}</span>"""
            content = content.replace(target_3, replacement_3)

        elif file_path == 'frontend/src/pages/UpdatePassword.tsx':
            target_4 = """              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-emerald-500" />
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">{toastMessage}</span>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="h-full bg-adv-orange"
                />
              </div>"""
            replacement_4 = """              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">{toastMessage}</span>"""
            content = content.replace(target_4, replacement_4)

        elif file_path == 'frontend/src/pages/PastEvents.tsx':
            target_5 = """            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[100] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            {toastMessage}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-adv-orange"
              />
            </div>"""
            replacement_5 = """            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[100] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
          >
            {toastMessage}"""
            content = content.replace(target_5, replacement_5)

        elif file_path == 'frontend/src/pages/EditProfile.tsx':
            target_6 = """            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[100] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-adv-orange"
              />
            </div>"""
            replacement_6 = """            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[100] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
          >
            <span>{toastMessage}</span>"""
            content = content.replace(target_6, replacement_6)
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {file_path}")
    except Exception as e:
        print(f"Error on {file_path}: {e}")

