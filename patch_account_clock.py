import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """                                      {((att.checkedInTime && att.isCheckedIn) || att.purchaseDate) && (
                                        <>
                                          {att.price && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />}
                                          <span className={`flex items-center gap-1 font-mono font-bold lowercase ${att.isCheckedIn ? 'text-emerald-500' : 'text-gray-400 dark:text-zinc-400'}`}>
                                            <Clock className="w-3.5 h-3.5 sm:w-3 sm:h-3 shrink-0" />
                                            <span>{formatTimeToHHMM(att.checkedInTime || att.purchaseDate, att.checkedInTimestamp)}</span>
                                          </span>
                                        </>
            )}"""

replacement = """                                      {(att.checkedInTime && att.isCheckedIn) && (
                                        <>
                                          {att.price && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />}
                                          <span className="flex items-center gap-1 font-mono font-bold lowercase text-emerald-500">
                                            <Clock className="w-3.5 h-3.5 sm:w-3 sm:h-3 shrink-0" />
                                            <span>{formatTimeToHHMM(att.checkedInTime, att.checkedInTimestamp)}</span>
                                          </span>
                                        </>
                                      )}"""

if target in content:
    content = content.replace(target, replacement)
    print("Patched successfully")
else:
    print("Target not found")

with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
