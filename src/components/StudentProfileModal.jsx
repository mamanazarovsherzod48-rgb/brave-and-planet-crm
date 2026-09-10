import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function StudentProfileModal({ student, onClose }) {
  const [payments, setPayments] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'history'

  useEffect(() => {
    if (!student) return;
    fetchDetails();
  }, [student]);

  const fetchDetails = async () => {
    // To'lovlar tarixini olish
    const { data: pData } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', student.id)
      .order('payment_date', { ascending: false });
    if (pData) setPayments(pData);

    // Guruhlar o'tish tarixini olish
    const { data: hData } = await supabase
      .from('student_group_history')
      .select('*')
      .eq('student_id', student.id)
      .order('joined_at', { ascending: false });
    if (hData) setHistory(hData);
  };

  // Telegram yoki SMS ilovasiga to'g'ridan-to'g'ri o'tish havolalari
  const targetPhone = student.parent_phone || student.phone || "";
  const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
  const defaultMsg = encodeURIComponent(`Assalomu alaykum, hurmatli ota-ona! ${student.full_name} bo'yicha Eduflow o'quv markazidan xabarnoma...`);

  const telegramUrl = `https://t.me/+${cleanPhone}`;
  const smsUrl = `sms:${targetPhone}?body=${defaultMsg}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Yuqori qism */}
        <div className="p-4 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{student.full_name}</h2>
            <p className="text-sm text-gray-500">Tel: {student.phone} | Ota-onasi: {student.parent_phone || "Mavjud emas"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {/* Tezkor Aloqa Tugmalari (Telegram & SMS ilovasiga o'tish) */}
        <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">Aloqa:</span>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600 transition"
          >
            ✈️ Telegram orqali yozish
          </a>
          <a
            href={smsUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
          >
            💬 SMS ilovasida ochish
          </a>
        </div>

        {/* Tablar */}
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-2.5 text-sm font-semibold border-b-2 ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            To‘lovlar Tarixi
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-sm font-semibold border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            O‘qigan Guruhlari Tarixi
          </button>
        </div>

        {/* Ro'yxatlar maydoni */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {activeTab === 'payments' ? (
            payments.length > 0 ? (
              payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border text-sm">
                  <div>
                    <p className="font-semibold text-gray-800">{Number(p.amount).toLocaleString()} so‘m</p>
                    <p className="text-xs text-gray-500">{new Date(p.payment_date).toLocaleDateString()} • {p.payment_type}</p>
                  </div>
                  <span className="text-xs text-gray-500">{p.notes || "Izohsiz"}</span>
                </div>
              ))
            ) : <p className="text-sm text-gray-400 text-center py-4">To‘lovlar mavjud emas</p>
          ) : (
            history.length > 0 ? (
              history.map((h) => (
                <div key={h.id} className="p-2.5 bg-gray-50 rounded-lg border text-sm flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{h.group_name || "Noma'lum guruh"}</p>
                    <p className="text-xs text-gray-500">Qo‘shilgan: {new Date(h.joined_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {h.left_at ? `Tugagan: ${new Date(h.left_at).toLocaleDateString()}` : "Hozir shu guruhda"}
                  </span>
                </div>
              ))
            ) : <p className="text-sm text-gray-400 text-center py-4">Guruhlar almashinuvi qayd etilmagan</p>
          )}
        </div>
      </div>
    </div>
  );
}