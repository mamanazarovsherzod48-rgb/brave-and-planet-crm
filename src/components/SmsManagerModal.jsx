import React, { useState, useMemo } from 'react';
import { X, Send, AlertCircle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SmsManagerModal({ isOpen, onClose, students = [], singleStudent = null, student = null }) {
  const currentStudent = singleStudent || student;

  // 1. FAQAT faol va haqiqiy qarzdorlarni ajratib olamiz
  const debtorsList = useMemo(() => {
    return (students || []).filter(s => Number(s?.debt) > 0 && s?.status === 'active');
  }, [students]);

  const studentName = currentStudent?.full_name || currentStudent?.name || currentStudent?.first_name || 'Talaba';
  const studentPhone = currentStudent?.parent_phone || currentStudent?.parentPhone || currentStudent?.phone || '';

  const [email, setEmail] = useState('elbek3695@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [sentSuccessIds, setSentSuccessIds] = useState([]);

  // Hali SMS bormagan qarzdorlar soni
  const pendingDebtorsCount = debtorsList.filter(s => !sentSuccessIds.includes(s.id)).length;
  const recipientCount = currentStudent ? 1 : pendingDebtorsCount;

  // TextUP panelidagi rasmiy tasdiqlangan shablon matni:
  const defaultTemplate = "Hurmatli ota-ona, farzandingizning to'lovi amalga oshirilmagan. Iltimos to'lovni amalga oshiring. Brave and Planet o'quv markazi.";
  const [messageText, setMessageText] = useState(defaultTemplate);

  if (!isOpen) return null;

  // 1. TextUP tizimiga Login qilish
  const loginTextUp = async () => {
    const { data: res, error } = await supabase.rpc('send_textup_request', {
      full_url: 'https://api-auth.textup.uz/v1/login',
      request_method: 'POST',
      auth_token: null,
      body: {
        email: email.trim(),
        password: password.trim()
      }
    });

    if (error || (res && res.status >= 400)) {
      const errMsg = res?.data?.message || res?.data?.raw_response || error?.message || 'Login yoki parol xato!';
      throw new Error(errMsg);
    }

    const token = res?.data?.accessToken;
    const userId = res?.data?.user?.id;

    if (!token || !userId) {
      throw new Error("Token yoki UserId olinmadi. Login parolni tekshiring.");
    }

    return { token, userId };
  };

  // 2. TextUP orqali SMS yuborish
  const sendTextUpSms = async (token, userId, phoneList, text) => {
    const formattedRecipients = phoneList.map((p) => {
      const clean = String(p).replace(/[^0-9]/g, '');
      return clean.startsWith('998') ? `+${clean}` : `+998${clean}`;
    });

    const { data: res, error } = await supabase.rpc('send_textup_request', {
      full_url: 'https://sms-api.textup.uz/v1/send',
      request_method: 'POST',
      auth_token: `Bearer ${token}`,
      body: {
        userId: userId,
        message: text,
        name: 'qarzdor_eslatma',
        recipients: formattedRecipients
      }
    });

    if (error || (res && res.status >= 400)) {
      const detail = res?.data?.error || res?.data?.message || JSON.stringify(res?.data) || error?.message;
      throw new Error(`TextUP xatosi (${res?.status || 500}): ${detail}`);
    }

    return res.data;
  };

  // 3. Yuborish tugmasi
  const handleSend = async () => {
    if (!email || !password) {
      setStatusMessage({ text: 'Email va Parolni kiriting!', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMessage({ text: 'SMS yuborilmoqda...', type: '' });

    try {
      const { token, userId } = await loginTextUp();

      // Yakka o'quvchiga yuborish
      if (currentStudent) {
        if (!studentPhone) {
          throw new Error("Bu o'quvchida telefon raqam topilmadi!");
        }

        if (sentSuccessIds.includes(currentStudent.id)) {
          throw new Error("Bu o'quvchiga hozirgina SMS jo'natildi!");
        }

        await sendTextUpSms(token, userId, [studentPhone], messageText);

        await supabase
          .from('students')
          .update({ last_sms_sent_at: new Date().toISOString() })
          .eq('id', currentStudent.id);

        setSentSuccessIds(prev => [...prev, currentStudent.id]);
        setStatusMessage({ text: `${studentName}ning ota-onasiga SMS muvaffaqiyatli yetkazildi!`, type: 'success' });
        setLoading(false);
        return;
      }

      // Ommaviy yuborish - FAQAT QARZDORLAR (debtorsList)
      if (!debtorsList || debtorsList.length === 0) {
        throw new Error("Qarzdor o'quvchilar ro'yxati bo'sh! Hammada to'lov amalga oshirilgan.");
      }

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < debtorsList.length; i++) {
        const st = debtorsList[i];

        // HIMOYА: Agar bu o'quvchiga allaqachon muvaffaqiyatli ketgan bo'lsa, tashlab o'tamiz
        if (sentSuccessIds.includes(st.id)) {
          continue;
        }

        const phone = st?.parent_phone || st?.phone;

        if (!phone) {
          failCount++;
          continue;
        }

        setProgress({ current: i + 1, total: debtorsList.length });

        try {
          await sendTextUpSms(token, userId, [phone], messageText);
          
          await supabase
            .from('students')
            .update({ last_sms_sent_at: new Date().toISOString() })
            .eq('id', st.id);

          // Muvaffaqiyatli ketganini ro'yxatga kiritib boramiz
          setSentSuccessIds(prev => [...prev, st.id]);
          successCount++;
        } catch (err) {
          console.error(`${st.full_name || st.name} uchun SMS xatosi:`, err);
          failCount++;
        }

        await new Promise((r) => setTimeout(r, 200));
      }

      setStatusMessage({
        text: `Jarayon yakunlandi. Yangi yuborildi: ${successCount} ta, Ketmaganlar: ${failCount} ta.`,
        type: successCount > 0 ? 'success' : 'error'
      });
    } catch (err) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative text-white">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {currentStudent ? `SMS: ${studentName}` : `Qarzdorlarga SMS (${recipientCount} ta qoldi)`}
            </h2>
            <p className="text-xs text-gray-400">Brave and Planet o'quv markazi xabarnomasi</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">TextUP Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">TextUP Parol</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parol..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Tasdiqlangan Shablon Matni</label>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {statusMessage.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {loading && !currentStudent && progress.total > 0 && (
            <div className="text-xs text-center text-gray-400">
              Yuborilmoqda: {progress.current} / {progress.total}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={loading || recipientCount === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Yuborilmoqda...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {currentStudent
                    ? `${studentName}ning ota-onasiga yuborish`
                    : recipientCount === 0 
                      ? "Barcha qarzdorlarga SMS yetkazildi"
                      : `Faqat qolgan qarzdorlarga yuborish (${recipientCount} ta)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
