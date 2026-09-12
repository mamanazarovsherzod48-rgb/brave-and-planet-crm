// smsService.js - TextUP API bilan to'liq integratsiya

const AUTH_URL = 'https://api-auth.textup.uz/v1/login';
const SMS_URL = 'https://sms-api.textup.uz/v1/send';

let cachedToken = null;
let tokenExpiry = null;

// Raqamni to'g'ri formatga keltirish (998901234567)
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  const cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 9) return '998' + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('998')) return cleaned;
  return null;
};

// 1. TextUP ga login qilib Token olish
export const getAuthToken = async (email, password) => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok && data?.data?.accessToken) {
      cachedToken = data.data.accessToken;
      // Tokenni 12 soatga saqlaymiz
      tokenExpiry = Date.now() + 12 * 60 * 60 * 1000;
      return cachedToken;
    } else {
      throw new Error(data.message || 'TextUP login xatosi');
    }
  } catch (error) {
    console.error('TextUP Auth Error:', error);
    throw error;
  }
};

// 2. Bitta yoki bir nechta raqamga SMS yuborish
export const sendSMS = async ({ email, password, recipients, message }) => {
  try {
    const token = await getAuthToken(email, password);

    // Raqamlarni tozalash
    const validRecipients = recipients
      .map(formatPhoneNumber)
      .filter((phone) => phone !== null);

    if (validRecipients.length === 0) {
      throw new Error("Yaroqli telefon raqamlari topilmadi");
    }

    const response = await fetch(SMS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipients: validRecipients,
        message: message
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('SMS yuborishda xatolik:', error);
    throw error;
  }
};