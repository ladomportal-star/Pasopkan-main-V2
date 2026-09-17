import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """    setIsClaiming(true);
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
          ? `ຢືນຢັນ OTP ສຳເລັດ! ຂໍເບີກຈ່າຍເງິນ ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ ຮຽບຮ້ອຍແລ້ວ`
          : `OTP verified! Payout claim of ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ transferred successfully!`,
        'success',
        5000
      );
    }, 800);"""

replacement1 = """    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setShowClaimOtpModal(false);
      setShowClaimTwoFaModal(true); // Proceed to 2FA step
    }, 800);"""

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Replaced handleConfirmClaimPayout logic")
else:
    print("Could not find target1")

target2 = """  const handleTwoFaSuccess = (code: string) => {
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

    addToast(
      lang === 'lo'
        ? `ຢືນຢັນ 2FA ສຳເລັດ! ຂໍເບີກຈ່າຍເງິນ ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ ຮຽບຮ້ອຍແລ້ວ`
        : `2FA verified! Payout claim of ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ transferred successfully!`,
      'success',
      5000
    );
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

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced handleTwoFaSuccess logic")
else:
    print("Could not find target2")

with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
