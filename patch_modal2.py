import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_modal = """              {/* OTP Input Component */}
              <div className="mb-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block text-center mb-2">
                  {lang === 'lo' ? 'ລະຫັດຢືນຢັນ OTP 6 ຫຼັກ' : '6-Digit SMS OTP Code'}
                </label>
                <OtpInput
                  length={6}
                  autoFocus={false}
                  value={claimOtpCode}
                  onChange={(val) => {
                    setClaimOtpCode(val);
                    setClaimOtpError('');
                  }}
                  error={!!claimOtpError}
                />
                {claimOtpError && (
                  <p className="text-red-500 text-[11px] font-bold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{claimOtpError}</span>
                  </p>
                )}
              </div>
              {/* Resend & Demo Helper */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-5 text-[11px] px-1">
                <div className="text-gray-400 font-medium">
                  {claimOtpCountdown > 0 ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {lang === 'lo' ? `ສົ່ງໃໝ່ໃນ ${claimOtpCountdown} ວິນາທີ` : `Resend in ${claimOtpCountdown}s`}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendClaimOtp}
                      className="text-emerald-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {lang === 'lo' ? 'ສົ່ງລະຫັດໃໝ່' : 'Resend OTP Code'}
                    </button>
            )}
                </div>
                {/* Demo Helper Pill */}
                <div className="flex justify-center gap-2 flex-wrap mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClaimOtpCode(expectedClaimOtp);
                      setClaimOtpError('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    title="Click to auto-fill demo OTP code"
                  >
                    Demo OTP: {expectedClaimOtp}
                  </button>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimOtpModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                    theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.cancel || (lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={claimOtpCode.length < 6 || isClaiming}
                  onClick={handleConfirmClaimPayout}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >"""

replacement_modal = """              {/* Validation Errors */}
              {claimOtpError && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-red-500 text-[11px] font-bold">{claimOtpError}</span>
                </div>
              )}

              {/* Input Section - Both OTP and 2FA */}
              <div className="mb-5 space-y-4">
                
                {/* OTP Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      {lang === 'lo' ? '1. ລະຫັດ OTP (SMS)' : '1. SMS OTP Code'}
                    </label>
                    {/* Demo Helper Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setClaimOtpCode(expectedClaimOtp);
                        setClaimOtpError('');
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[9px] hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      Fill: {expectedClaimOtp}
                    </button>
                  </div>
                  <OtpInput
                    length={6}
                    autoFocus={false}
                    value={claimOtpCode}
                    onChange={(val) => {
                      setClaimOtpCode(val);
                      setClaimOtpError('');
                    }}
                    error={!!claimOtpError && claimOtpCode.length < 6}
                  />
                  <div className="flex justify-between items-center mt-1.5 px-1">
                    <div className="text-[10px] text-gray-400 font-medium">
                      {claimOtpCountdown > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {lang === 'lo' ? `ສົ່ງໃໝ່ໃນ ${claimOtpCountdown}s` : `Resend in ${claimOtpCountdown}s`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendClaimOtp}
                          className="text-emerald-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {lang === 'lo' ? 'ສົ່ງລະຫັດໃໝ່' : 'Resend'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <hr className={`border-t border-dashed ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`} />

                {/* 2FA Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      {lang === 'lo' ? '2. ລະຫັດ 2FA Authenticator' : '2. 2FA App Code'}
                    </label>
                    {/* Demo Helper Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setClaimTwoFaCode('123456');
                        setClaimOtpError('');
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[9px] hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      Fill: 123456
                    </button>
                  </div>
                  <OtpInput
                    length={6}
                    autoFocus={false}
                    value={claimTwoFaCode}
                    onChange={(val) => {
                      setClaimTwoFaCode(val);
                      setClaimOtpError('');
                    }}
                    error={!!claimOtpError && claimTwoFaCode.length < 6}
                  />
                  <p className="text-[10px] text-gray-400 font-medium text-center mt-1.5">
                    {lang === 'lo' ? 'ເປີດແອັບ Google Authenticator ຂອງທ່ານ' : 'Open your Google Authenticator app'}
                  </p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimOtpModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                    theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.cancel || (lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={claimOtpCode.length < 6 || claimTwoFaCode.length < 6 || isClaiming}
                  onClick={handleConfirmClaimPayout}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >"""

if target_modal in content:
    content = content.replace(target_modal, replacement_modal)
    print("Replaced modal UI logic 2")
else:
    print("Could not find target_modal 2")

with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

