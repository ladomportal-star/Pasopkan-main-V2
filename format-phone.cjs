const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Login.tsx', 'utf-8');

// Function to replace in handleSendOtp
const sendOtpRegex = /const digits = phoneNumber\.replace\(\/\\D\/g, ''\);\n([\s\S]*?)setIsLoading\(true\);\s*try {\s*const res = await fetch\('\/api\/otp\/send', {\s*method: 'POST',\s*headers: { 'Content-Type': 'application\/json' },\s*body: JSON\.stringify\({ phone: digits }\)\s*}\);/g;

const sendReplacement = `const digits = phoneNumber.replace(/\\D/g, '');
$1
    let formattedPhone = digits;
    if (formattedPhone.startsWith('856020')) {
      formattedPhone = '85620' + formattedPhone.substring(6);
    } else if (formattedPhone.startsWith('020')) {
      formattedPhone = '85620' + formattedPhone.substring(3);
    } else if (formattedPhone.startsWith('20')) {
      formattedPhone = '85620' + formattedPhone.substring(2);
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });`;

content = content.replace(sendOtpRegex, sendReplacement);

// Function to replace in handleResendOtp
const resendOtpRegex = /const digits = phoneNumber\.replace\(\/\\D\/g, ''\);\s*const res = await fetch\('\/api\/otp\/send', {\s*method: 'POST',\s*headers: { 'Content-Type': 'application\/json' },\s*body: JSON\.stringify\({ phone: digits }\)\s*}\);/g;

const resendReplacement = `const digits = phoneNumber.replace(/\\D/g, '');
      let formattedPhone = digits;
      if (formattedPhone.startsWith('856020')) formattedPhone = '85620' + formattedPhone.substring(6);
      else if (formattedPhone.startsWith('020')) formattedPhone = '85620' + formattedPhone.substring(3);
      else if (formattedPhone.startsWith('20')) formattedPhone = '85620' + formattedPhone.substring(2);

      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });`;

content = content.replace(resendOtpRegex, resendReplacement);

// Function to replace in handleVerifyOtp
const verifyOtpRegex = /const digits = phoneNumber\.replace\(\/\\D\/g, ''\);\s*const res = await fetch\('\/api\/otp\/verify', {\s*method: 'POST',\s*headers: { 'Content-Type': 'application\/json' },\s*body: JSON\.stringify\({ phone: digits, code: otp }\)/g;

const verifyReplacement = `const digits = phoneNumber.replace(/\\D/g, '');
      let formattedPhone = digits;
      if (formattedPhone.startsWith('856020')) formattedPhone = '85620' + formattedPhone.substring(6);
      else if (formattedPhone.startsWith('020')) formattedPhone = '85620' + formattedPhone.substring(3);
      else if (formattedPhone.startsWith('20')) formattedPhone = '85620' + formattedPhone.substring(2);

      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, code: otp })`;

content = content.replace(verifyOtpRegex, verifyReplacement);

fs.writeFileSync('Frontend/src/pages/Login.tsx', content);
