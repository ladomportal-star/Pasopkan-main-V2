import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add claimTwoFaCode state
state_search = "  const [claimOtpError, setClaimOtpError] = useState('');\n"
state_replacement = state_search + "  const [claimTwoFaCode, setClaimTwoFaCode] = useState('');\n"

if state_search in content:
    content = content.replace(state_search, state_replacement)
    print("Added claimTwoFaCode state")
else:
    print("Failed to add claimTwoFaCode state")

# 2. Merge handleConfirmClaimPayout and handleTwoFaSuccess
# We'll replace the block from "const handleConfirmClaimPayout = () => {"
# up to "const handleSimulateBankDate" with the new logic

regex = re.compile(r"  const handleConfirmClaimPayout = \(\) => \{.*?  const handleSimulateBankDate = \(daysAgo: number\) => \{", re.DOTALL)

def replacer(match):
    return """  const handleConfirmClaimPayout = () => {
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
    } else if (claimTwoFaCode !== '123456') {
      setClaimOtpError(lang === 'lo' ? 'ລະຫັດ 2FA ບໍ່ຖືກຕ້ອງ ກະລຸນາກວດສອບຄືນ' : 'Invalid 2FA code. Please verify and try again.');
      hasError = true;
    }

    if (hasError) return;

    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setShowClaimOtpModal(false);
      
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
    }, 800);
  };

  const handleSimulateBankDate = (daysAgo: number) => {"""

if regex.search(content):
    content = regex.sub(replacer, content)
    print("Replaced handleConfirmClaimPayout logic")
else:
    print("Failed to replace handleConfirmClaimPayout logic")
    
with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

