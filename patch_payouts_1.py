import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State changes
target_state = """  // Payout revenue state
  const [unclaimedRevenue, setUnclaimedRevenue] = useState(3500000);"""

replacement_state = """  // Payout revenue state
  interface UnclaimedEvent {
    id: string;
    title: string;
    amount: number;
    date: string;
  }
  const [unclaimedEvents, setUnclaimedEvents] = useState<UnclaimedEvent[]>([
    { id: 'ev1', title: 'Vientiane Music Festival 2026', amount: 2000000, date: '2026-10-15' },
    { id: 'ev2', title: 'Tech Startup Conference', amount: 1500000, date: '2026-09-20' }
  ]);
  const [eventToClaim, setEventToClaim] = useState<UnclaimedEvent | null>(null);
  const unclaimedRevenue = unclaimedEvents.reduce((acc, ev) => acc + ev.amount, 0);"""

content = content.replace(target_state, replacement_state)

# 2. handleOpenClaimModal
target_handleOpen = """  // Open Claim Event Money Modal with 30-Day Check
  const handleOpenClaimModal = () => {
    if (unclaimedRevenue <= 0) {
      addToast(lang === 'lo' ? 'ບໍ່ມີຍອດເງິນທີ່ສາມາດເບີກໄດ້ໃນຕອນນີ້' : 'No claimable event revenue at this time', 'warning', 5000);
      return;
    }

    // Strictly enforce 30-day bank modification cooling-off condition
    if (isBankInCoolingPeriod) {
      setShowCoolingWarningModal(true);
      return;
    }

    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedClaimOtp(randomOtp);
    setClaimOtpCode('');
    setClaimOtpError('');
    setClaimOtpCountdown(60);
    setShowClaimOtpModal(true);
  };"""

replacement_handleOpen = """  // Open Claim Event Money Modal with 30-Day Check
  const handleOpenClaimModal = (event: UnclaimedEvent) => {
    // Strictly enforce 30-day bank modification cooling-off condition
    if (isBankInCoolingPeriod) {
      setShowCoolingWarningModal(true);
      return;
    }

    setEventToClaim(event);
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedClaimOtp(randomOtp);
    setClaimOtpCode('');
    setClaimOtpError('');
    setClaimOtpCountdown(60);
    setShowClaimOtpModal(true);
  };"""

content = content.replace(target_handleOpen, replacement_handleOpen)

# 3. handleConfirmClaimPayout
target_handleConfirm = """    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setShowClaimOtpModal(false);
      const claimedAmt = unclaimedRevenue;
      setUnclaimedRevenue(0);
      setClaimOtpCode('');
      setClaimOtpError('');

      const newPayout: PayoutBill = {
        id: `PAY-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        event: 'Vientiane Music Festival 2026',
        grossAmount: claimedAmt,
        platformFee: claimedAmt * 0.05,
        amount: claimedAmt * 0.95,
        status: 'Pending',
        account: `${bankAccount?.bankName || 'JDB'} ${bankAccount?.accountNumber || '000000008899'}`,
        receiptImg: null,
      };

      setMyPayouts([newPayout, ...myPayouts]);
      safeStorage.setItem('organizer_payout_bills', JSON.stringify([newPayout, ...myPayouts]));
      addToast(lang === 'lo' ? 'ຂໍເບີກຈ່າຍສຳເລັດແລ້ວ! ກຳລັງລໍຖ້າການອະນຸມັດ 1-3 ມື້' : 'Claim submitted successfully! Pending approval (1-3 days).', 'success');
    }, 1200);"""

replacement_handleConfirm = """    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setShowClaimOtpModal(false);
      
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
        account: `${bankAccount?.bankName || 'JDB'} ${bankAccount?.accountNumber || '000000008899'}`,
        receiptImg: null,
      };

      setMyPayouts([newPayout, ...myPayouts]);
      safeStorage.setItem('organizer_payout_bills', JSON.stringify([newPayout, ...myPayouts]));
      addToast(lang === 'lo' ? 'ຂໍເບີກຈ່າຍສຳເລັດແລ້ວ! ກຳລັງລໍຖ້າການອະນຸມັດ 1-3 ມື້' : 'Claim submitted successfully! Pending approval (1-3 days).', 'success');
      setEventToClaim(null);
    }, 1200);"""

content = content.replace(target_handleConfirm, replacement_handleConfirm)

# 4. handleTwoFaSuccess
target_twoFa = """  const handleTwoFaSuccess = (code: string) => {
    setShowClaimTwoFaModal(false);
    
    const claimedAmt = unclaimedRevenue;
    setUnclaimedRevenue(0);
    setClaimOtpCode('');
    setClaimOtpError('');

    const newPayout: PayoutBill = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      event: 'Vientiane Music Festival 2026',
      grossAmount: claimedAmt,
      platformFee: claimedAmt * 0.05,
      amount: claimedAmt * 0.95,
      status: 'Pending',
      account: `${bankAccount?.bankName || 'JDB'} ${bankAccount?.accountNumber || '000000008899'}`,
      receiptImg: null,
    };

    setMyPayouts([newPayout, ...myPayouts]);
    safeStorage.setItem('organizer_payout_bills', JSON.stringify([newPayout, ...myPayouts]));
    addToast(lang === 'lo' ? 'ຂໍເບີກຈ່າຍສຳເລັດແລ້ວ! ກຳລັງລໍຖ້າການອະນຸມັດ 1-3 ມື້' : 'Claim submitted successfully! Pending approval (1-3 days).', 'success');
  };"""

replacement_twoFa = """  const handleTwoFaSuccess = (code: string) => {
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
      account: `${bankAccount?.bankName || 'JDB'} ${bankAccount?.accountNumber || '000000008899'}`,
      receiptImg: null,
    };

    setMyPayouts([newPayout, ...myPayouts]);
    safeStorage.setItem('organizer_payout_bills', JSON.stringify([newPayout, ...myPayouts]));
    addToast(lang === 'lo' ? 'ຂໍເບີກຈ່າຍສຳເລັດແລ້ວ! ກຳລັງລໍຖ້າການອະນຸມັດ 1-3 ມື້' : 'Claim submitted successfully! Pending approval (1-3 days).', 'success');
    setEventToClaim(null);
  };"""

content = content.replace(target_twoFa, replacement_twoFa)

with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Phase 1 applied.")
