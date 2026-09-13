const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Login.tsx', 'utf-8');

// Update lengths and translations
content = content.replace("verifyPlaceholder: '123456',", "verifyPlaceholder: '1234',");
content = content.replace("verifyPlaceholder: '123456',", "verifyPlaceholder: '1234',");
content = content.replace("length={6}", "length={4}");
content = content.replace("if (otp.length < 6) {", "if (otp.length < 4) {");
content = content.replace("'Please enter the 6-digit verification code' : 'ກະລຸນາໃສ່ລະຫັດຢືນຢັນ 6 ຕົວເລກ'", "'Please enter the 4-digit verification code' : 'ກະລຸນາໃສ່ລະຫັດຢືນຢັນ 4 ຕົວເລກ'");

// Update handleSendOtp
const sendRegex = /setIsLoading\(true\);\s*await new Promise\(resolve => setTimeout\(resolve, 1000\)\);\s*setIsLoading\(false\);\s*setStep\('otp'\);\s*setCountdown\(60\);\s*setResendMessage\(null\);/g;
const sendReplacement = `setIsLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setStep('otp');
      setCountdown(60);
      setResendMessage(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }`;
content = content.replace(sendRegex, sendReplacement);

// Update handleResendOtp
const resendRegex = /setIsLoading\(true\);\s*setError\(null\);\s*setResendMessage\(null\);\s*await new Promise\(resolve => setTimeout\(resolve, 1000\)\);\s*setIsLoading\(false\);\s*setCountdown\(60\);\s*setResendMessage\(t\.codeResent\);/g;
const resendReplacement = `setIsLoading(true);
    setError(null);
    setResendMessage(null);
    try {
      const digits = phoneNumber.replace(/\\D/g, '');
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
      setCountdown(60);
      setResendMessage(t.codeResent);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }`;
content = content.replace(resendRegex, resendReplacement);

// Update handleVerifyOtp
const verifyRegex = /if \(otp !== '123456'\) {\s*setError\(t\.incorrectOtp\);\s*return;\s*}\s*setIsLoading\(true\);\s*try {/g;
const verifyReplacement = `setIsLoading(true);
    try {
      const digits = phoneNumber.replace(/\\D/g, '');
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, code: otp })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(t.incorrectOtp);
        setIsLoading(false);
        return;
      }
`;
content = content.replace(verifyRegex, verifyReplacement);

fs.writeFileSync('Frontend/src/pages/Login.tsx', content);
