import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State changes: We need a state for the 2FA code inside the claim modal.
# We already have `claimOtpCode` for OTP. We can add `claimTwoFaCode`.
target_state = """  const [showClaimOtpModal, setShowClaimOtpModal] = useState(false);
  const [claimOtpCode, setClaimOtpCode] = useState('');
  const [expectedClaimOtp, setExpectedClaimOtp] = useState('123456');
  const [showClaimTwoFaModal, setShowClaimTwoFaModal] = useState(false);"""

replacement_state = """  const [showClaimOtpModal, setShowClaimOtpModal] = useState(false);
  const [claimOtpCode, setClaimOtpCode] = useState('');
  const [claimTwoFaCode, setClaimTwoFaCode] = useState('');
  const [expectedClaimOtp, setExpectedClaimOtp] = useState('123456');
  const [showClaimTwoFaModal, setShowClaimTwoFaModal] = useState(false);"""

content = content.replace(target_state, replacement_state)


# 2. Reset the new state when opening the modal
target_open = """    setExpectedClaimOtp(randomOtp);
    setClaimOtpCode('');
    setClaimOtpError('');
    setClaimOtpCountdown(60);
    setShowClaimOtpModal(true);"""

replacement_open = """    setExpectedClaimOtp(randomOtp);
    setClaimOtpCode('');
    setClaimTwoFaCode('');
    setClaimOtpError('');
    setClaimOtpCountdown(60);
    setShowClaimOtpModal(true);"""

content = content.replace(target_open, replacement_open)


# 3. handleConfirmClaimPayout update
target_confirm = """  const handleConfirmClaimPayout = () => {
    let hasError = false;
    if (claimOtpCode.length < 6) {
      setClaimOtpError(lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດ OTP 6 ຫຼັກໃຫ້ຄົບຖ້ວນ' : 'Please enter the full 6-digit OTP code');
      hasError = true;
    } else if (claimOtpCode !== expectedClaimOtp && claimOtpCode !== '123456') {
      setClaimOtpError(lang === 'lo' ? 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ກະລຸນາກວດສອບຄືນ' : 'Invalid OTP code. Please verify and try again.');
      hasError = true;
    }
    

    
    if (hasError) return;

    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setShowClaimOtpModal(false);
      setShowClaimTwoFaModal(true); // Proceed to 2FA step
    }, 800);
  };"""

replacement_confirm = """  const handleConfirmClaimPayout = () => {
    let hasError = false;
    if (claimOtpCode.length < 6) {
      setClaimOtpError(lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດ OTP 6 ຫຼັກໃຫ້ຄົບຖ້ວນ' : 'Please enter the full 6-digit OTP code');
      hasError = true;
    } else if (claimOtpCode !== expectedClaimOtp && claimOtpCode !== '123456') {
      setClaimOtpError(lang === 'lo' ? 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ກະລຸນາກວດສອບຄືນ' : 'Invalid OTP code. Please verify and try again.');
      hasError = true;
    }
    
    if (claimTwoFaCode.length < 6) {
      setClaimOtpError(lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດ 2FA 6 ຫຼັກໃຫ້ຄົບຖ້ວນ' : 'Please enter the full 6-digit 2FA code');
      hasError = true;
    } else if (claimTwoFaCode !== '123456') { // Mock 2FA validation
      setClaimOtpError(lang === 'lo' ? 'ລະຫັດ 2FA ບໍ່ຖືກຕ້ອງ' : 'Invalid 2FA code');
      hasError = true;
    }

    if (hasError) return;

    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setShowClaimOtpModal(false);
      
      // Complete the claim directly
      if (!eventToClaim) return;
      const claimedAmt = eventToClaim.amount;
      setUnclaimedEvents(prev => prev.filter(e => e.id !== eventToClaim.id));
      setClaimOtpCode('');
      setClaimTwoFaCode('');
      setClaimOtpError('');

      const newPayout: PayoutBill = {
        id: `PAY-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        event: eventToClaim.title,
        grossAmount: claimedAmt,
        platformFee: claimedAmt * 0.05,
        amount: claimedAmt * 0.95,
        status: 'Pending',
        account: bankAccount ? `${bankAccount.bankName} *${bankAccount.accountNumber.slice(-4)}` : 'BCEL Bank *8899',
        accountName: bankAccount?.accountName || 'Sirithida Souksavat',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'
      };

      setMyPayouts(prev => [newPayout, ...prev]);

      try {
        const existing = safeStorage.getItem('organizer_payout_bills');
        const parsed = existing ? JSON.parse(existing) : [];
        parsed.unshift({
          id: newPayout.id,
          paidAt: new Date().toISOString(),
          eventTitle: newPayout.event,
          revenue: newPayout.grossAmount,
          platformFeeAmount: newPayout.platformFee,
          payoutAmount: newPayout.amount,
          status: 'pending',
          bankInfo: bankAccount,
          billImage: newPayout.receiptUrl
        });
        safeStorage.setItem('organizer_payout_bills', JSON.stringify(parsed));
      } catch (e) {}

      addToast(
        lang === 'lo'
          ? `ຢືນຢັນສຳເລັດ! ຂໍເບີກຈ່າຍເງິນ ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ ຮຽບຮ້ອຍແລ້ວ`
          : `Verified! Payout claim of ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ transferred successfully!`,
        'success',
        5000
      );
    }, 1200);
  };"""

content = content.replace(target_confirm, replacement_confirm)

# 4. Remove the unused standalone 2FA success logic
target_old_2fa = """  // Quick simulator tool to test 30-day lock vs claimable state
  const handleTwoFaSuccess = (code: string) => {
    setShowClaimTwoFaModal(false);
    
    if (!eventToClaim) return;
    const claimedAmt = eventToClaim.amount;
    setUnclaimedEvents(prev => prev.filter(e => e.id !== eventToClaim.id));
    setClaimOtpCode('');
    setClaimOtpError('');

    const newPayout: PayoutBill = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      event: eventToClaim.title,
      grossAmount: claimedAmt,
      platformFee: claimedAmt * 0.05,
      amount: claimedAmt * 0.95,
      status: 'Pending',
      account: bankAccount ? `${bankAccount.bankName} *${bankAccount.accountNumber.slice(-4)}` : 'BCEL Bank *8899',
      accountName: bankAccount?.accountName || 'Sirithida Souksavat',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'
    };

    setMyPayouts(prev => [newPayout, ...prev]);

    try {
      const existing = safeStorage.getItem('organizer_payout_bills');
      const parsed = existing ? JSON.parse(existing) : [];
      parsed.unshift({
        id: newPayout.id,
        paidAt: new Date().toISOString(),
        eventTitle: newPayout.event,
        revenue: newPayout.grossAmount,
        platformFeeAmount: newPayout.platformFee,
        payoutAmount: newPayout.amount,
        status: 'pending',
        bankInfo: bankAccount,
        billImage: newPayout.receiptUrl
      });
      safeStorage.setItem('organizer_payout_bills', JSON.stringify(parsed));
    } catch (e) {}

    addToast(
      lang === 'lo'
        ? `ຢືນຢັນສຳເລັດ! ຂໍເບີກຈ່າຍເງິນ ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ ຮຽບຮ້ອຍແລ້ວ`
        : `Verified! Payout claim of ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ transferred successfully!`,
      'success',
      5000
    );
  };"""

replacement_old_2fa = """  // Quick simulator tool to test 30-day lock vs claimable state
  const handleTwoFaSuccess = (code: string) => {
    // Deprecated standalone 2FA modal
  };"""
  
content = content.replace(target_old_2fa, replacement_old_2fa)

# 5. UI Updates to the Claim Modal
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
                      {lang === 'lo' ? '1. ລະຫັດ OTP 6 ຫຼັກ (SMS)' : '1. SMS OTP Code'}
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
    print("Replaced modal UI logic")
else:
    print("Could not find target_modal")

with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

