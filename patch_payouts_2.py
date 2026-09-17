import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 5. UI Changes: Remove claim button from main card and add individual event claim list
target_ui = """                <button
                  onClick={handleOpenClaimModal}
                  disabled={unclaimedRevenue <= 0}
                  className={`w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 ${
                    isBankInCoolingPeriod
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isBankInCoolingPeriod ? (
                    <>
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200" />
                      <span>{lang === 'lo' ? `ຖືກລັອກ (ເຫຼືອ ${coolingDaysRemaining} ວັນ)` : `Locked (${coolingDaysRemaining}d left)`}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
                      <span>{lang === 'lo' ? 'ຂໍເບີກຈ່າຍເງິນ (OTP)' : 'Claim Event Money (OTP)'}</span>
                    </>
            )}
                </button>
              </div>"""

replacement_ui = """              </div>
              
              {/* Event-by-Event Claim List */}
              {unclaimedEvents.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className={`font-bold text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>
                    {lang === 'lo' ? 'ກິດຈະກຳທີ່ສາມາດເບີກຈ່າຍໄດ້' : 'Claimable Events'}
                  </h3>
                  {unclaimedEvents.map(ev => (
                    <div key={ev.id} className={`p-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border shadow-sm transition-all ${
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'
                    }`}>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base">{ev.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-500 text-xs">{ev.date}</span>
                          <span className="text-gray-300 dark:text-zinc-600">•</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {new Intl.NumberFormat('lo-LA').format(ev.amount)} ₭
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenClaimModal(ev)}
                        disabled={isBankInCoolingPeriod}
                        className={`w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                          isBankInCoolingPeriod
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isBankInCoolingPeriod ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            {lang === 'lo' ? 'ລັອກ' : 'Locked'}
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5" />
                            {lang === 'lo' ? 'ຂໍເບີກຈ່າຍ (OTP)' : 'Claim (OTP)'}
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}"""

content = content.replace(target_ui, replacement_ui)

# 6. Modal UI update (to show correct event)
target_modal = """              <div className={`p-3.5 rounded-xl sm:rounded-2xl mb-4 space-y-2 text-xs border ${
                theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50 border-gray-150'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຍອດລາຍຮັບກິດຈະກຳ:' : 'Event Revenue:'}</span>
                  <span className="font-black text-sm">{new Intl.NumberFormat('lo-LA').format(unclaimedRevenue)} ₭</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຄ່າທຳນຽມລະບົບ (5%):' : 'Platform Fee (5%):'}</span>
                  <span className="font-bold text-red-500">-{new Intl.NumberFormat('lo-LA').format(unclaimedRevenue * 0.05)} ₭</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-adv-slate dark:text-white font-black">{lang === 'lo' ? 'ຍອດເງິນທີ່ໄດ້ຮັບຕົວຈິງ:' : 'Net Transfer Amount:'}</span>
                  <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('lo-LA').format(unclaimedRevenue * 0.95)} ₭
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-150 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between sm:items-center text-[11px] gap-1 sm:gap-2">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ທະນາຄານຮັບເງິນ:' : 'Payout Account:'}</span>
                  <span className="font-extrabold sm:text-right">{bankAccount?.accountNumber || '0000000008899'} - {bankAccount?.accountName || 'Phanyadeth'}</span>
                </div>
              </div>"""

replacement_modal = """              <div className={`p-3.5 rounded-xl sm:rounded-2xl mb-4 space-y-2 text-xs border ${
                theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50 border-gray-150'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ລາຍການກິດຈະກຳ:' : 'Event Title:'}</span>
                  <span className="font-black text-xs text-right truncate w-48" title={eventToClaim?.title}>{eventToClaim?.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຍອດລາຍຮັບກິດຈະກຳ:' : 'Event Revenue:'}</span>
                  <span className="font-black text-sm">{new Intl.NumberFormat('lo-LA').format(eventToClaim?.amount || 0)} ₭</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຄ່າທຳນຽມລະບົບ (5%):' : 'Platform Fee (5%):'}</span>
                  <span className="font-bold text-red-500">-{new Intl.NumberFormat('lo-LA').format((eventToClaim?.amount || 0) * 0.05)} ₭</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-adv-slate dark:text-white font-black">{lang === 'lo' ? 'ຍອດເງິນທີ່ໄດ້ຮັບຕົວຈິງ:' : 'Net Transfer Amount:'}</span>
                  <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('lo-LA').format((eventToClaim?.amount || 0) * 0.95)} ₭
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-150 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between sm:items-center text-[11px] gap-1 sm:gap-2">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ທະນາຄານຮັບເງິນ:' : 'Payout Account:'}</span>
                  <span className="font-extrabold sm:text-right">{bankAccount?.accountNumber || '0000000008899'} - {bankAccount?.accountName || 'Phanyadeth'}</span>
                </div>
              </div>"""

content = content.replace(target_modal, replacement_modal)

with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Phase 2 applied.")
