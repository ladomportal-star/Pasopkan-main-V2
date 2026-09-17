import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """    setIsClaiming(true);
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
        account: bankAccount ? `${bankAccount.bankName} *${bankAccount.accountNumber.slice(-4)}` : 'BCEL Bank *8899',
        accountName: bankAccount?.accountName || 'Sirithida Souksavat',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'
      };"""

replacement1 = """    setIsClaiming(true);
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
        account: bankAccount ? `${bankAccount.bankName} *${bankAccount.accountNumber.slice(-4)}` : 'BCEL Bank *8899',
        accountName: bankAccount?.accountName || 'Sirithida Souksavat',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'
      };"""

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Replaced handleConfirmClaimPayout")

target2 = """  const handleTwoFaSuccess = (code: string) => {
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
      account: bankAccount ? `${bankAccount.bankName} *${bankAccount.accountNumber.slice(-4)}` : 'BCEL Bank *8899',
      accountName: bankAccount?.accountName || 'Sirithida Souksavat',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'
    };"""

replacement2 = """  const handleTwoFaSuccess = (code: string) => {
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
    };"""

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced handleTwoFaSuccess")

with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
