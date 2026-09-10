import React, { useState, useEffect, useMemo, memo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import * as mammoth from 'mammoth';
import SmsManagerModal from './components/SmsManagerModal';
import {
  Building2, GraduationCap, CheckSquare,
  CreditCard, Settings, Moon, Sun, Edit2, Trash2, Plus, Check,
  AlertCircle, BookOpen, UserCheck, MessageSquare, Download,
  Search, Filter, Layers, Eye, LogOut, Lock, User, Menu, X,
  Clock, FileText, Upload, Loader2, Send, Copy, Archive, RefreshCw, Save, ArrowUp
} from 'lucide-react';
import StudentsManager from './components/StudentsManager';

const SUPABASE_URL = "https://qvtthgoeythyqdpslsqh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2dHRoZ29leXRoeXFkcHNsc3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NjYzNDUsImV4cCI6MjEwMjM0MjM0NX0.0xVgaUHGwJCuZVO1gLBn18hiP5cHwqQnLrA46SRi5Ao";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WEEK_DAYS = [
  { key: 'du', label: 'Dushanba' },
  { key: 'se', label: 'Seshanba' },
  { key: 'chor', label: 'Chorshanba' },
  { key: 'pay', label: 'Payshanba' },
  { key: 'juma', label: 'Juma' },
  { id: 'Shan', label: 'Shanba' },
  { id: 'Yak', label: 'Yakshanba' },
];

const MONTHS_LIST = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", 
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];

const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const currentYear = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

// OPTIMIZATSIYA: Butun sahifa har soniyada qayta render bo'lmasligi uchun soat
const LiveClock = memo(({ darkMode }) => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`mb-4 p-2.5 rounded-xl border flex items-center gap-2.5 ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-blue-50/70 border-blue-100'}`}>
      <Clock size={16} className="text-blue-500 shrink-0" />
      <div className="text-xs font-medium">
        <p className="font-bold text-blue-600 dark:text-blue-400">
          {dateTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {dateTime.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
});

// OPTIMIZATSIYA: Qidiruv maydoni
const FastSearchInput = React.memo(({ onSearch, darkMode }) => {
  const [text, setText] = useState('');

  return (
    <div className="relative">
      <input
        type="text"
        value={text}
        onChange={(e) => {
          const val = e.target.value;
          setText(val);
        }}
        onKeyUp={(e) => {
          if (e.key === 'Enter') onSearch(text);
        }}
        onBlur={() => onSearch(text)}
        placeholder="Qidirish (Enter bosing)..."
        className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
          darkMode ? 'bg-slate-700/60 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
        }`}
      />
      <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
    </div>
  );
});

// OPTIMIZATSIYA: Mustaqil DOCX Import Modali (Barcha asl algoritmlar to'liq saqlangan)
const DocxImportModal = React.memo(({ 
  isOpen, 
  onClose, 
  groups, 
  branches, 
  darkMode, 
  onSuccess 
}) => {
  const [docxGroupId, setDocxGroupId] = useState('');
  const [docxTextData, setDocxTextData] = useState('');
  const [singlePhoneRole, setSinglePhoneRole] = useState('parent');
  const [isDocxProcessing, setIsDocxProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDocxFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsDocxProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setDocxTextData(result.value);
    } catch (err) {
      alert("DOCX faylni o'qishda xatolik yuz berdi. Matnli Word fayl ekanligini tekshiring.");
    } finally {
      setIsDocxProcessing(false);
    }
  };

  const handleBulkImportStudents = async (e) => {
    e.preventDefault();
    if (!docxGroupId) {
      alert("Iltimos, o'quvchilar qo'shiladigan guruhni tanlang!");
      return;
    }
    if (!docxTextData.trim()) {
      alert("O'quvchilar ro'yxati matni bo'sh!");
      return;
    }

    const targetGroup = groups.find(g => g.id === Number(docxGroupId));

    let rawText = docxTextData
      .replace(/(\d{2,})([A-ZА-ЯЁҒҚҲЎ])/g, '$1\n$2')
      .replace(/([a-zA-Zа-яА-ЯёЁғқҳўҒҚҲЎ])(\d{9})/g, '$1 $2');

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const newStudentsToInsert = [];
    const phoneRegex = /(?:\+?998[\s-]?)?\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\b\d{9}\b/g;

    lines.forEach((line, index) => {
      const foundPhones = line.match(phoneRegex) || [];
      const cleanPhones = foundPhones.map(p => {
        let num = p.replace(/\D/g, '');
        if (num.length === 9) num = '998' + num;
        return num.startsWith('998') ? '+' + num : num;
      });

      let namePart = line;
      foundPhones.forEach(p => {
        namePart = namePart.replace(p, '');
      });

      namePart = namePart
        .replace(/^\d+[\.\)\-\s]+/, '')
        .replace(/[\,\;\:\-\|\/]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!namePart && cleanPhones.length === 0) return;

      const fullName = namePart || `O'quvchi ${index + 1}`;
      let studentPhone = "-";
      let parentPhone = "-";

      if (cleanPhones.length >= 2) {
        studentPhone = cleanPhones[0];
        parentPhone = cleanPhones[1];
      } else if (cleanPhones.length === 1) {
        if (singlePhoneRole === 'parent') {
          parentPhone = cleanPhones[0];
          studentPhone = "-";
        } else {
          studentPhone = cleanPhones[0];
          parentPhone = "-";
        }
      }

      newStudentsToInsert.push({
        full_name: fullName,
        phone: studentPhone,
        parent_phone: parentPhone,
        group_id: Number(docxGroupId),
        branch_id: targetGroup?.branch_id || 1,
        debt: 0,
        joined_date: new Date().toISOString().split('T')[0]
      });
    });

    if (newStudentsToInsert.length > 0) {
      const { data, error } = await supabase.from('students').insert(newStudentsToInsert).select();
      if (error) {
        alert("Bazaga kiritishda xatolik: " + error.message);
        return;
      }
      alert(`Muvaffaqiyatli! ${newStudentsToInsert.length} ta o'quvchi bazaga kiritildi.`);
      if (data) onSuccess(data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`w-full max-w-lg p-5 sm:p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center gap-2 mb-4 text-emerald-600">
          <FileText size={22} />
          <h3 className="text-base sm:text-lg font-bold">DOCX Fayl / Guruh O‘quvchilarini Import Qilish</h3>
        </div>

        <form onSubmit={handleBulkImportStudents} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">O‘quvchilar qaysi guruhga qo‘shilsin?</label>
            <select 
              required
              value={docxGroupId}
              onChange={(e) => setDocxGroupId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none font-semibold text-xs sm:text-sm"
            >
              <option value="">-- Guruhni tanlang --</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({branches.find(b => b.id === g.branch_id)?.name})</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-blue-50/50 dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 rounded-xl">
            <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">
              Agar o'quvchida faqat 1 ta raqam yozilgan bo'lsa:
            </label>
            <div className="flex items-center gap-4 text-xs font-medium">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="singlePhoneRoleModal" 
                  value="parent" 
                  checked={singlePhoneRole === 'parent'} 
                  onChange={() => setSinglePhoneRole('parent')} 
                />
                <span>Ota-onasining raqami deb olish (Tavsiya)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="singlePhoneRoleModal" 
                  value="student" 
                  checked={singlePhoneRole === 'student'} 
                  onChange={() => setSinglePhoneRole('student')} 
                />
                <span>O'quvchining shaxsiy raqami</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Word (.docx) faylini tanlang:</label>
            <input 
              type="file" 
              accept=".docx"
              onChange={handleDocxFileUpload}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            {isDocxProcessing && <p className="text-xs text-blue-500 mt-1">Fayl o‘qilmoqda...</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Yoki ro‘yxat matnini shu yerga qo‘ying:</label>
            <textarea
              rows="6"
              placeholder="Aliyev Vali 901234567 909876543&#10;Karimov Jasur 912345678&#10;Toshmatov Anvar"
              value={docxTextData}
              onChange={(e) => setDocxTextData(e.target.value)}
              className={`w-full p-3 rounded-xl border outline-none text-xs font-mono leading-relaxed ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3.5 py-2 text-slate-400 text-xs sm:text-sm">Bekor qilish</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow">Barcha O‘quvchilarni Qo‘shish</button>
          </div>
        </form>
      </div>
    </div>
  );
});

const StudentModal = React.memo(({ 
  isOpen, 
  onClose, 
  isEditing, 
  initialData, 
  groups, 
  branches, 
  systemSettings, 
  darkMode, 
  onSave 
}) => {
  // Faqat oylar tanlanganda ko'rinishi uchun kichik state
  const [debtMonths, setDebtMonths] = useState(initialData?.debt_months || '');
  const [selectedGroupId, setSelectedGroupId] = useState(initialData?.group_id || groups[0]?.id || '');

  useEffect(() => {
    setDebtMonths(initialData?.debt_months || '');
    setSelectedGroupId(initialData?.group_id || groups[0]?.id || '');
  }, [initialData, groups]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    // Qiymatlar faqat "Saqlash" bosilgandagina to'g'ridan-to'g'ri o'qib olinadi
    const payload = {
      ...initialData,
      full_name: form.full_name.value.trim(),
      group_id: Number(form.group_id.value),
      parent_phone: form.parent_phone.value.trim() || '-',
      phone: form.phone.value.trim() || '-',
      debt: form.debt.value === '' ? 0 : Number(form.debt.value),
      debt_months: debtMonths
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`w-full max-w-md p-5 sm:p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'} max-h-[90vh] overflow-y-auto`}>
        <h3 className="text-base sm:text-lg font-bold mb-4 capitalize">
          {isEditing ? 'Tahrirlash: O‘quvchi' : 'Yangi Qo‘shish: O‘quvchi'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">F.I.O</label>
            <input 
              required 
              name="full_name"
              type="text" 
              defaultValue={initialData?.full_name || ''} 
              className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Biriktirilgan Guruh</label>
            <select 
              name="group_id"
              value={selectedGroupId} 
              onChange={e => setSelectedGroupId(e.target.value)} 
              className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none font-medium text-xs sm:text-sm"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({branches.find(b => b.id === g.branch_id)?.name}) - {g.monthly_fee?.toLocaleString()} {systemSettings.currency}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Ota-onasi Telefoni</label>
            <input 
              name="parent_phone"
              type="text" 
              placeholder="+998..." 
              defaultValue={initialData?.parent_phone === '-' ? '' : (initialData?.parent_phone || '')} 
              className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">O‘quvchining Shaxsiy Telefoni</label>
            <input 
              name="phone"
              type="text" 
              placeholder="+998..." 
              defaultValue={initialData?.phone === '-' ? '' : (initialData?.phone || '')} 
              className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Qarzdorlik summasi ({systemSettings.currency})</label>
            <input
              name="debt"
              type="number"
              defaultValue={initialData?.debt ?? 0}
              placeholder="0"
              className={`w-full px-3 py-2 rounded-xl border outline-none text-sm font-semibold ${
                darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Qarzdorlik Oylari</label>
            <input
              type="text"
              placeholder="Iyun-Sentabr"
              value={debtMonths}
              onChange={(e) => setDebtMonths(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border outline-none text-sm font-semibold ${
                darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'
              }`}
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {MONTHS_UZ.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    const current = debtMonths ? debtMonths.split(', ').filter(Boolean) : [];
                    const updated = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
                    setDebtMonths(updated.join(', '));
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    debtMonths.includes(m)
                      ? 'bg-amber-500 text-white shadow-xs'
                      : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="px-3.5 py-2 text-slate-400 text-xs sm:text-sm">Bekor qilish</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold">Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default function App() {
  const [attendanceGroupId, setAttendanceGroupId] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('eduflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDocxModalOpen, setIsDocxModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('eduflow_dark') === 'true');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStudentGroup, setSelectedStudentGroup] = useState('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [paymentSelectedGroup, setPaymentSelectedGroup] = useState('ALL');
  const [showOnlyDebtors, setShowOnlyDebtors] = useState(false);

  // Guruhlararo Transfer State-lari
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [sourceGroupId, setSourceGroupId] = useState('');
  const [destGroupId, setDestGroupId] = useState('');
  const [transferStudentIds, setTransferStudentIds] = useState([]);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedSingleStudent, setSelectedSingleStudent] = useState(null);

  // To'lov tarixi
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);
  const [studentPaymentHistory, setStudentPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Supabase Baza Ma'lumotlari
  const [branches, setBranches] = useState([]);
  const [levels, setLevels] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Qidiruv inputiga debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [editingBranchId, setEditingBranchId] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [newBranchName, setNewBranchName] = useState('');

  const [newLevelName, setNewLevelName] = useState('');
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [editLevelName, setEditLevelName] = useState('');

  const [systemSettings, setSystemSettings] = useState({
    centerName: "EduFlow O‘quv Markazi",
    currency: "so'm",
    smsReminderDay: 5,
    billingDay: 1,
    lastBilledMonth: '',
  });
  const [smsSelectedGroup, setSmsSelectedGroup] = useState('ALL');
  const [billingProcessing, setBillingProcessing] = useState(false);
  const [smsTemplate, setSmsTemplate] = useState("Hurmatli ota-ona! {ism}ning \"{guruh}\" kursi bo'yicha to'lov muddati keldi. Oylik to'lov summasi: {summa}. Iltimos, o'z vaqtida to'lovni amalga oshirishingizni so'raymiz.");

  // Guruh qidirish filtrlari
  const [finderBranch, setFinderBranch] = useState('ALL');
  const [finderLevel, setFinderLevel] = useState('ALL');
  const [finderDay, setFinderDay] = useState('ALL');
  const [finderSearch, setFinderSearch] = useState('');

  // To'lov modali
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS_LIST[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [paymentCustomDate, setPaymentCustomDate] = useState(new Date().toISOString().split('T')[0]);

  // Modallar holati
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const handleScroll = (e) => {
      const scrollPos = window.scrollY || e.target?.scrollTop || document.documentElement.scrollTop;
      setShowScrollTop(scrollPos > 300);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchAttendanceFromDB = async () => {
      if (!attendanceGroupId) return;
      setAttendanceLoading(true);
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('group_id', Number(attendanceGroupId))
          .eq('date', attendanceDate);

        if (error) throw error;
        const loadedAtt = {};
        if (data) {
          data.forEach(item => {
            loadedAtt[`${item.group_id}-${item.student_id}-${item.date}`] = item.status;
          });
        }
        setAttendance(prev => ({ ...prev, ...loadedAtt }));
      } catch (err) {
        console.error("Davomatni yuklashda xatolik:", err);
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendanceFromDB();
  }, [attendanceGroupId, attendanceDate]);

  const groupsWithDebtInfo = useMemo(() => {
    return groups.map(group => {
      const groupStudents = students.filter(s => s.group_id === group.id);
      const totalDebt = groupStudents.reduce((sum, s) => sum + (Number(s.debt) || 0), 0);
      const debtorCount = groupStudents.filter(s => (Number(s.debt) || 0) > 0).length;
      return {
        ...group,
        totalDebt,
        debtorCount,
        studentCount: groupStudents.length
      };
    });
  }, [groups, students]);

  const displayedGroups = useMemo(() => {
    return groupsWithDebtInfo
      .filter(group => {
        const branchMatch = selectedBranch === 'ALL' || group.branch_id === selectedBranch;
        const debtMatch = !showOnlyDebtors || group.totalDebt > 0;
        const groupSelectMatch = paymentSelectedGroup === 'ALL' || group.id === Number(paymentSelectedGroup);
        return branchMatch && debtMatch && groupSelectMatch;
      })
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }, [groupsWithDebtInfo, selectedBranch, showOnlyDebtors, paymentSelectedGroup]);

  const filteredStudents = useMemo(() => {
    const baseList = selectedBranch === 'ALL'
      ? students.filter(s => s.status !== 'archived')
      : students.filter(s => {
          const grp = groups.find(g => g.id === s.group_id);
          return s.status !== 'archived' && grp && grp.branch_id === Number(selectedBranch);
        });

    return baseList.filter(student => {
      const groupMatch = selectedStudentGroup === 'ALL' || student.group_id === Number(selectedStudentGroup);
      if (!debouncedSearchQuery) return groupMatch;
      const q = debouncedSearchQuery.toLowerCase().trim();
      const nameMatch = student.full_name?.toLowerCase().includes(q);
      const phoneMatch = student.phone?.includes(q);
      const parentMatch = student.parent_phone?.includes(q);
      return groupMatch && (nameMatch || phoneMatch || parentMatch);
    });
  }, [students, selectedBranch, groups, selectedStudentGroup, debouncedSearchQuery]);

  const archivedStudents = useMemo(() => {
    return students.filter(s => s.status === 'archived');
  }, [students]);

  const filteredGroups = useMemo(() => {
    return selectedBranch === 'ALL' 
      ? groups 
      : groups.filter(g => g.branch_id === parseInt(selectedBranch));
  }, [selectedBranch, groups]);

  const getTeacherBranchIds = (t) => {
    if (Array.isArray(t.branch_ids) && t.branch_ids.length > 0) return t.branch_ids.map(Number);
    if (t.branch_id) return [Number(t.branch_id)];
    return [];
  };

  const filteredTeachers = useMemo(() => {
    return selectedBranch === 'ALL' 
      ? teachers 
      : teachers.filter(t => {
          const bIds = getTeacherBranchIds(t);
          return bIds.includes(parseInt(selectedBranch));
        });
  }, [selectedBranch, teachers]);

  const attendanceStudents = useMemo(() => {
    return students.filter(s => s.group_id === parseInt(attendanceGroupId));
  }, [students, attendanceGroupId]);

  const searchMatchedGroups = useMemo(() => {
    return groups.filter(g => {
      const matchBranch = finderBranch === 'ALL' || g.branch_id === Number(finderBranch);
      const matchLevel = finderLevel === 'ALL' || g.level_id === Number(finderLevel);
      const matchDay = finderDay === 'ALL' || (g.days && g.days.includes(finderDay));
      const matchText = g.name?.toLowerCase().includes(finderSearch.toLowerCase()) || 
                        teachers.find(t => t.id === g.teacher_id)?.full_name?.toLowerCase().includes(finderSearch.toLowerCase());
      return matchBranch && matchLevel && matchDay && matchText;
    });
  }, [groups, finderBranch, finderLevel, finderDay, finderSearch, teachers]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [brRes, lvlRes, tchRes, grpRes, stdRes, payRes, setRes] = await Promise.all([
        supabase.from('branches').select('*').order('id', { ascending: true }),
        supabase.from('levels').select('*').order('id', { ascending: true }),
        supabase.from('teachers').select('*').order('id', { ascending: true }),
        supabase.from('groups').select('*').order('id', { ascending: true }),
        supabase.from('students').select('*').order('id', { ascending: true }),
        supabase.from('payments').select('*').limit(500).order('id', { ascending: false }),
        supabase.from('system_settings').select('*').single()
      ]);

      if (brRes.data) setBranches(brRes.data);
      if (lvlRes.data) setLevels(lvlRes.data);
      if (tchRes.data) setTeachers(tchRes.data);
      if (grpRes.data) {
        setGroups(grpRes.data);
        if (grpRes.data.length > 0 && !attendanceGroupId) {
          setAttendanceGroupId(grpRes.data[0].id);
        }
      }
      if (stdRes.data) setStudents(stdRes.data);
      if (payRes.data) setPaymentsList(payRes.data);
      if (setRes.data) {
        setSystemSettings({
          centerName: setRes.data.center_name || "EduFlow O‘quv Markazi",
          currency: setRes.data.currency || "so'm",
          smsReminderDay: setRes.data.sms_reminder_day || 5,
          billingDay: setRes.data.billing_day || 1,
          lastBilledMonth: setRes.data.last_billed_month || '',
        });
        if (setRes.data.sms_template) setSmsTemplate(setRes.data.sms_template);
      }
    } catch (err) {
      console.error("Ma'lumotlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerMonthlyBilling = async (force = false) => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentDay = now.getDate();

    if (!force && systemSettings.lastBilledMonth === currentMonthKey) return;

    if (force || currentDay >= Number(systemSettings.billingDay)) {
      if (force && !confirm(`${MONTHS_LIST[now.getMonth()]} oyi uchun barcha faol o'quvchilarga guruh to'lovi miqdorida qarzdorlik qo'shilsinmi?`)) {
        return;
      }

      setBillingProcessing(true);
      try {
        const activeStudents = students.filter(s => s.status !== 'archived');
        const currentMonthName = new Date().toLocaleString('uz-UZ', { month: 'long' });
        const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

        const updates = activeStudents.map(student => {
          const group = groups.find(g => g.id === student.group_id);
          const fee = Number(group?.monthly_fee || 0);

          let existingMonths = student.debt_months 
            ? student.debt_months.split(',').map(m => m.trim()).filter(Boolean)
            : [];

          if (!existingMonths.includes(capitalizedMonth)) {
            existingMonths.push(capitalizedMonth);
          }

          return {
            ...student,
            debt: Number(student.debt || 0) + fee,
            debt_months: existingMonths.join(', ')
          };
        });

        for (const st of updates) {
          await supabase.from('students').update({ 
            debt: st.debt,
            debt_months: st.debt_months
          }).eq('id', st.id);
        }

        await supabase.from('system_settings').upsert({
          id: 1,
          billing_day: Number(systemSettings.billingDay),
          last_billed_month: currentMonthKey
        });

        setStudents(prev =>
          prev.map(s => {
            const updated = updates.find(u => u.id === s.id);
            return updated ? { ...s, debt: updated.debt, debt_months: updated.debt_months } : s;
          })
        );

        setSystemSettings(prev => ({ ...prev, lastBilledMonth: currentMonthKey }));
        alert(`Muvaffaqiyatli! ${MONTHS_LIST[now.getMonth()]} oyi uchun barcha o'quvchilarga qarzdorlik hisoblandi.`);
      } catch (err) {
        console.error("Qarzdorlik hisoblashda xatolik:", err);
        alert("Xatolik: " + err.message);
      } finally {
        setBillingProcessing(false);
      }
    }
  };

  useEffect(() => {
    if (students.length > 0 && groups.length > 0 && systemSettings.billingDay) {
      triggerMonthlyBilling(false);
    }
  }, [students.length, groups.length, systemSettings.billingDay]);

  useEffect(() => {
    localStorage.setItem('eduflow_dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('eduflow_attendance', JSON.stringify(attendance));
  }, [attendance]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      const authUser = {
        id: 1,
        username: 'admin',
        full_name: 'Bosh Administrator',
        role: 'superadmin'
      };
      setCurrentUser(authUser);
      localStorage.setItem('eduflow_user', JSON.stringify(authUser));
      setLoginError('');
    } else {
      setLoginError("Login yoki parol noto'g'ri!");
    }
  };

  const handleLogout = () => {
    if (confirm("Haqiqatan ham tizimdan chiqmoqchimisiz?")) {
      localStorage.removeItem('eduflow_user');
      setCurrentUser(null);
    }
  };

  const toggleDaySelection = (dayId) => {
    let currentDays = [];
    if (typeof modalData.days === 'string') {
      currentDays = modalData.days.split(',').map(d => d.trim()).filter(Boolean);
    } else if (Array.isArray(modalData.days)) {
      currentDays = [...modalData.days];
    }

    const exists = currentDays.some(d => d.toLowerCase() === String(dayId).toLowerCase());
    let updatedDays;
    if (exists) {
      updatedDays = currentDays.filter(d => d.toLowerCase() !== String(dayId).toLowerCase());
    } else {
      updatedDays = [...currentDays, dayId];
    }

    setModalData({ ...modalData, days: updatedDays });
  };

  const toggleTeacherBranchSelection = (branchId) => {
    const currentBranches = modalData.branch_ids || (modalData.branch_id ? [modalData.branch_id] : []);
    const numericBranchId = Number(branchId);
    if (currentBranches.includes(numericBranchId)) {
      setModalData({ ...modalData, branch_ids: currentBranches.filter(b => b !== numericBranchId) });
    } else {
      setModalData({ ...modalData, branch_ids: [...currentBranches, numericBranchId] });
    }
  };

  const generateSmsText = (student) => {
    const group = groups.find(g => g.id === student.group_id);
    const amount = (student.debt > 0 ? student.debt : group?.monthly_fee || 0).toLocaleString() + ` ${systemSettings.currency}`;
    const currentMonthName = MONTHS_LIST[new Date().getMonth()];

    return smsTemplate
      .replace(/{ism}/g, student.full_name)
      .replace(/{guruh}/g, group?.name || 'Guruh')
      .replace(/{summa}/g, amount)
      .replace(/{oy}/g, currentMonthName);
  };

  const handleAttendance = (groupId, studentId, status) => {
    const key = `${groupId}-${studentId}-${attendanceDate}`;
    setAttendance(prev => ({ ...prev, [key]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!attendanceGroupId) return alert("Iltimos, guruhni tanlang!");
    if (attendanceStudents.length === 0) return alert("Bu guruhda o'quvchilar yo'q!");

    setAttendanceSaving(true);
    try {
      const recordsToUpsert = attendanceStudents
        .map(student => {
          const key = `${attendanceGroupId}-${student.id}-${attendanceDate}`;
          const status = attendance[key];
          if (!status) return null; 
          return {
            student_id: student.id,
            group_id: Number(attendanceGroupId),
            date: attendanceDate,
            status: status
          };
        })
        .filter(Boolean);

      if (recordsToUpsert.length === 0) {
        alert("Saqlash uchun kamida 1 ta o'quvchiga davomat belgilang!");
        setAttendanceSaving(false);
        return;
      }

      await supabase
        .from('attendance')
        .delete()
        .eq('group_id', Number(attendanceGroupId))
        .eq('date', attendanceDate);

      const { error } = await supabase.from('attendance').insert(recordsToUpsert);
      if (error) throw error;

      alert(`Davomat muvaffaqiyatli saqlandi! (${attendanceDate})`);
    } catch (err) {
      console.error("Davomatni saqlashda xatolik:", err);
      alert("Saqlashda xatolik yuz berdi: " + err.message);
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleArchiveStudent = async (studentId) => {
    if (!window.confirm("Rostdan ham bu o'quvchini arxivga o'tkazmoqchimisiz?")) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('students')
        .update({ status: 'archived' })
        .eq('id', studentId);

      if (error) throw error;
      setStudents(prev => prev.map(s => (s.id === studentId ? { ...s, status: 'archived' } : s)));
    } catch (err) {
      console.error("Arxivlashda xatolik:", err);
      alert("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferStudents = async () => {
    if (!sourceGroupId || !destGroupId) return alert("Iltimos, eski va yangi guruhni tanlang!");
    if (sourceGroupId === destGroupId) return alert("Ikkala tarafga bir xil guruhni tanlab bo'lmaydi!");
    if (transferStudentIds.length === 0) return alert("Ko'chirish uchun kamida bitta o'quvchini belgilang!");

    try {
      setLoading(true);
      const { error } = await supabase
        .from('students')
        .update({ group_id: Number(destGroupId) })
        .in('id', transferStudentIds);

      if (error) throw error;

      setStudents(prev =>
        prev.map(s => transferStudentIds.includes(s.id) ? { ...s, group_id: Number(destGroupId) } : s)
      );
      const count = transferStudentIds.length;
      setTransferStudentIds([]);
      setIsTransferModalOpen(false);
      alert(`${count} ta o'quvchi muvaffaqiyatli ko'chirildi!`);
    } catch (err) {
      console.error("Transferda xatolik:", err);
      alert("Ko'chirishda xatolik yuz berdi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (!confirm(`Haqiqatan ham tanlangan ${selectedStudentIds.length} ta o'quvchini o'chirmoqchimisiz?`)) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('students').delete().in('id', selectedStudentIds);
      if (error) throw error;
      setStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)));
      setSelectedStudentIds([]);
      alert("O'quvchilar muvaffaqiyatli o'chirildi!");
    } catch (err) {
      console.error("O'chirishda xatolik:", err);
      alert("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkArchiveStudents = async () => {
    if (!confirm(`Tanlangan ${selectedStudentIds.length} ta o'quvchini arxivga o'tkazmoqchimisiz?`)) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('students').update({ status: 'archived' }).in('id', selectedStudentIds);
      if (error) throw error;
      setStudents(prev => prev.map(s => selectedStudentIds.includes(s.id) ? { ...s, status: 'archived' } : s));
      setSelectedStudentIds([]);
      alert("O'quvchilar arxivga o'tkazildi!");
    } catch (err) {
      console.error("Arxivlashda xatolik:", err);
      alert("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySelectedPhones = () => {
    const selectedList = students.filter(s => selectedStudentIds.includes(s.id));
    const phones = selectedList.map(s => `${s.full_name}: O'quvchi(${s.phone}), Ota-ona(${s.parent_phone})`).join('\n');
    navigator.clipboard.writeText(phones);
    alert(`${selectedStudentIds.length} ta o'quvchining raqamlari nusxalandi!`);
  };

  const handleDeleteGroup = async (id) => {
    if (confirm("Haqiqatan ham bu guruhni o'chirmoqchimisiz?")) {
      setGroups(groups.filter(g => g.id !== id));
      await supabase.from('groups').delete().eq('id', id);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (confirm("Haqiqatan ham bu o'qituvchini o'chirmoqchimisiz?")) {
      setTeachers(teachers.filter(t => t.id !== id));
      await supabase.from('teachers').delete().eq('id', id);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (confirm("Haqiqatan ham bu o'quvchini o'chirmoqchimisiz?")) {
      setStudents(students.filter(s => s.id !== id));
      await supabase.from('students').delete().eq('id', id);
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (modalType === 'student') {
        const form = e.target;
        const full_name = form.full_name ? form.full_name.value.trim() : (modalData.full_name || '');
        const group_id = form.group_id ? Number(form.group_id.value) : Number(modalData.group_id || groups[0]?.id || 1);
        const parent_phone = form.parent_phone ? form.parent_phone.value.trim() || '-' : (modalData.parent_phone || '-');
        const phone = form.phone ? form.phone.value.trim() || '-' : (modalData.phone || '-');
        const debt = form.debt && form.debt.value !== '' ? Number(form.debt.value) : Number(modalData.debt || 0);
        const debt_months = form.debt_months ? form.debt_months.value.trim() : (modalData.debt_months || '');

        const selectedG = groups.find(g => g.id === group_id);
        const branchId = selectedG ? selectedG.branch_id : Number(modalData.branch_id || branches[0]?.id || 1);

        if (isEditing) {
          const updated = { 
            full_name,
            phone,
            parent_phone,
            branch_id: branchId, 
            group_id, 
            debt,
            debt_months
          };
          const { error } = await supabase.from('students').update(updated).eq('id', modalData.id);
          if (error) return alert("Xatolik: " + error.message);
          setStudents(students.map(s => s.id === modalData.id ? { ...s, ...updated } : s));
        } else {
          const newObj = { 
            full_name,
            phone,
            parent_phone,
            branch_id: branchId, 
            group_id, 
            debt, 
            debt_months,
            joined_date: new Date().toISOString().split('T')[0] 
          };
          const { data, error } = await supabase.from('students').insert([newObj]).select();
          if (error) return alert("Xatolik: " + error.message);
          if (data) setStudents([...students, data[0]]);
        }
        setModalType(null);
        return;

      } else if (modalType === 'teacher') {
        const branchIds = modalData.branch_ids && modalData.branch_ids.length > 0 
          ? modalData.branch_ids 
          : [Number(branches[0]?.id || 1)];

        if (isEditing) {
          const { id, ...restData } = modalData;
          const updated = { 
            full_name: restData.full_name,
            subject: restData.subject,
            phone: restData.phone || '-',
            branch_ids: branchIds,
            branch_id: branchIds[0] 
          };
          const { error } = await supabase.from('teachers').update(updated).eq('id', modalData.id);
          if (error) return alert("Xatolik: " + error.message);
          setTeachers(teachers.map(t => t.id === modalData.id ? { ...t, ...updated } : t));
        } else {
          const newObj = { 
            full_name: modalData.full_name,
            subject: modalData.subject,
            phone: modalData.phone || '-',
            branch_ids: branchIds,
            branch_id: branchIds[0] 
          };
          const { data, error } = await supabase.from('teachers').insert([newObj]).select();
          if (error) return alert("Xatolik: " + error.message);
          if (data) setTeachers([...teachers, data[0]]);
        }
      } else if (modalType === 'group') {
        const cleanDays = Array.isArray(modalData.days)
          ? modalData.days.join(', ')
          : String(modalData.days || '');

        if (isEditing) {
          const { id, ...restData } = modalData;
          const payload = {
            name: restData.name,
            branch_id: Number(restData.branch_id),
            teacher_id: Number(restData.teacher_id),
            level_id: Number(restData.level_id || levels[0]?.id),
            days: cleanDays,
            time: restData.time || '14:00 - 16:00',
            monthly_fee: Number(restData.monthly_fee)
          };

          const { error: updateError } = await supabase.from('groups').update(payload).eq('id', modalData.id);
          if (updateError) return alert("Bazaga saqlashda xatolik: " + updateError.message);
          setGroups(groups.map(g => (g.id === modalData.id ? { ...g, ...payload } : g)));
        } else {
          const newObj = {
            name: modalData.name,
            branch_id: Number(modalData.branch_id || branches[0]?.id || 1),
            teacher_id: Number(modalData.teacher_id || teachers[0]?.id || 1),
            level_id: Number(modalData.level_id || levels[0]?.id || 1),
            days: cleanDays,
            time: modalData.time || '14:00 - 16:00',
            monthly_fee: Number(modalData.monthly_fee || 400000)
          };

          const { data, error: insertError } = await supabase.from('groups').insert([newObj]).select();
          if (insertError) return alert("Guruh yaratishda xatolik: " + insertError.message);
          if (data && data.length > 0) setGroups([...groups, data[0]]);
        }
      }
      setModalType(null);
    } catch (err) {
      console.error("Saqlashda xatolik:", err);
      alert("Xatolik: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentModalData) return;
    if (isSubmitting) return;

    const paidAmount = Number(
      paymentModalData.amount !== undefined && paymentModalData.amount !== ''
        ? paymentModalData.amount
        : (paymentModalData.debt > 0 ? paymentModalData.debt : paymentModalData.monthly_fee || 0)
    );

    if (!paidAmount || paidAmount <= 0) return alert("Iltimos, to'g'ri to'lov summasini kiriting!");

    setIsSubmitting(true);
    try {
      const studentId = paymentModalData.student_id || paymentModalData.id;
      const currentStudent = students.find(s => s.id === studentId);
      const currentDebt = Number(paymentModalData.debt ?? currentStudent?.debt ?? 0);
      const remainingDebt = Math.max(0, currentDebt - paidAmount);

      let updatedDebtMonths = currentStudent?.debt_months || paymentModalData.debt_months || '';
      if (remainingDebt === 0) {
        updatedDebtMonths = '';
      } else if (selectedMonth) {
        const monthsList = updatedDebtMonths.split(',').map(m => m.trim()).filter(Boolean);
        const filtered = monthsList.filter(m => !m.toLowerCase().includes(selectedMonth.toLowerCase()));
        updatedDebtMonths = filtered.join(', ');
      }

      const { error: studentErr } = await supabase.from('students').update({
        debt: remainingDebt,
        debt_months: updatedDebtMonths
      }).eq('id', studentId);

      if (studentErr) throw studentErr;

      await supabase.from('payments').insert([{
        student_id: studentId,
        amount: paidAmount,
        month: selectedMonth,
        year: selectedYear,
        payment_date: paymentCustomDate || new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString()
      }]);

      setStudents(prev =>
        prev.map(s => s.id === studentId ? { ...s, debt: remainingDebt, debt_months: updatedDebtMonths } : s)
      );
      setPaymentModalData(null);
      alert("To'lov muvaffaqiyatli saqlandi!");
    } catch (error) {
      console.error("To'lovni saqlashda xatolik:", error);
      alert("To'lovni saqlashda xatolik yuz berdi: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleExportDocxReport = async () => {
    try {
      const tableRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "№", alignment: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "F.I.O", alignment: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Guruh", alignment: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Qarzdorlik", alignment: AlignmentType.CENTER })] }),
          ],
        }),
        ...students.map((student, idx) => {
          const grp = groups.find(g => g.id === student.group_id);
          return new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: `${idx + 1}`, alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ text: student.full_name || "-" })] }),
              new TableCell({ children: [new Paragraph({ text: grp?.name || "-" })] }),
              new TableCell({ children: [new Paragraph({ text: `${(student.debt || 0).toLocaleString()} so'm`, alignment: AlignmentType.RIGHT })] }),
            ],
          });
        }),
      ];

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: "O'quvchilar va Qarzdorlik Hisoboti",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Hisobot_${new Date().toISOString().slice(0, 10)}.docx`);
    } catch (error) {
      console.error("Word hisobot yaratishda xatolik:", error);
      alert("Hisobotni yuklab olishda xatolik yuz berdi: " + error.message);
    }
  };

  const handleExportAttendanceDocx = async () => {
    try {
      // 1. Bazadan davomat yozuvlarini sanalar tartibida olish
      const { data: attData, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: true });

      if (attError) throw attError;

      // 2. Tanlangan filial bo'yicha faol o'quvchilarni saralash
      const activeStudentsList = selectedBranch === 'ALL'
        ? students.filter(s => s.status !== 'archived')
        : students.filter(s => {
            const grp = groups.find(g => g.id === s.group_id);
            return s.status !== 'archived' && grp && grp.branch_id === Number(selectedBranch);
          });

      if (activeStudentsList.length === 0) {
        alert("Hisobot yaratish uchun o'quvchilar topilmadi!");
        return;
      }

      // 3. Rasmiy jadval tuzilishi
      const tableRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "№", alignment: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "F.I.O", alignment: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Guruh", alignment: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Telefon", alignment: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: 21, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Qoldirilgan Sanalar (-)", alignment: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: 9, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Kelgan / Jami", alignment: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: 9, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Davomat %", alignment: AlignmentType.CENTER })] }),
          ],
        }),
        ...activeStudentsList.map((st, idx) => {
          const grp = groups.find(g => g.id === st.group_id);
          const studentAtt = (attData || []).filter(a => a.student_id === st.id);

          const presentDates = studentAtt.filter(a => a.status === '+');
          const absentDates = studentAtt
            .filter(a => a.status === '-')
            .map(a => a.date ? a.date.slice(5) : ''); // Masalan: "09-02"

          const presentCount = presentDates.length;
          const absentCount = absentDates.length;
          const totalLessons = presentCount + absentCount;
          const percentage = totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : 0;

          const absentText = absentDates.length > 0 
            ? absentDates.join(', ') 
            : (totalLessons > 0 ? "Qoldirmagan" : "-");

          return new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: `${idx + 1}`, alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ text: st.full_name || "-" })] }),
              new TableCell({ children: [new Paragraph({ text: grp?.name || "-" })] }),
              new TableCell({ children: [new Paragraph({ text: st.parent_phone !== '-' ? st.parent_phone : (st.phone || "-") })] }),
              new TableCell({ children: [new Paragraph({ text: absentText, alignment: AlignmentType.LEFT })] }),
              new TableCell({ children: [new Paragraph({ text: `${presentCount} / ${totalLessons}`, alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ text: totalLessons > 0 ? `${percentage}%` : "0%", alignment: AlignmentType.CENTER })] }),
            ],
          });
        })
      ];

      // 4. Word hujjati parametrlari
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: `${systemSettings.centerName || 'EduFlow CRM'}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: "O'quvchilar Davomati va Qoldirilgan Darslar Dalolatnomasi",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: `Hujjat sanasi: ${new Date().toLocaleDateString('uz-UZ')} | Filial: ${selectedBranch === 'ALL' ? 'Barcha filiallar' : (branches.find(b => b.id === Number(selectedBranch))?.name || '-')}`,
              alignment: AlignmentType.RIGHT,
              spacing: { after: 250 },
            }),
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({
              text: "\n\nMarkaz Ma'muriyati: _____________________        Imzo / Muhr: _____________________",
              spacing: { before: 400 },
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Rasmiy_Davomat_Dalili_${new Date().toISOString().slice(0, 10)}.docx`);
    } catch (err) {
      console.error("Word davomat hisoboti yaratishda xatolik:", err);
      alert("Hisobot yaratishda xatolik yuz berdi: " + err.message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await supabase.from('system_settings').upsert({
        id: 1,
        center_name: systemSettings.centerName,
        currency: systemSettings.currency,
        sms_reminder_day: systemSettings.smsReminderDay,
        billing_day: Number(systemSettings.billingDay),
        last_billed_month: systemSettings.lastBilledMonth,
        sms_template: smsTemplate
      });
      alert("Sozlamalar bazada muvaffaqiyatli saqlandi!");
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleSaveBillingDay = async () => {
    const day = Number(systemSettings.billingDay);
    if (!day || day < 1 || day > 28) return alert("Iltimos, 1 dan 28 gacha bo'lgan to'g'ri sana kiriting!");

    try {
      const { error } = await supabase.from('system_settings').upsert({
        id: 1,
        billing_day: day,
        last_billed_month: systemSettings.lastBilledMonth,
        center_name: systemSettings.centerName,
        currency: systemSettings.currency,
        sms_reminder_day: systemSettings.smsReminderDay,
        sms_template: smsTemplate
      });
      if (error) throw error;
      alert("Billing sanasi muvaffaqiyatli saqlandi!");
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleCopyAllPhones = () => {
    const phones = filteredStudents.map(s => `${s.full_name}: O'quvchi(${s.phone}), Ota-ona(${s.parent_phone})`).join('\n');
    navigator.clipboard.writeText(phones);
    alert("Barcha o'quvchilar va ularning ota-onalari telefon raqamlari nusxalandi!");
  };

  const exportToExcel = (dataType) => {
    let headers = [];
    let rows = [];
    let filename = "";

    if (dataType === 'students') {
      filename = `oquvchilar_hisoboti_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ["ID", "F.I.O", "O'quvchi Telefoni", "Ota-onasi Telefoni", "Guruh Nomi", "Guruh Darajasi", "O'qituvchisi", "Filial", "Qarzdorlik Summasi", "Qo'shilgan Sana"];
      rows = filteredStudents.map(s => {
        const gr = groups.find(g => g.id === s.group_id);
        const lvl = levels.find(l => l.id === gr?.level_id);
        const tch = teachers.find(t => t.id === gr?.teacher_id);
        const br = branches.find(b => b.id === s.branch_id);

        return [
          s.id, `"${s.full_name}"`, `"${s.phone}"`, `"${s.parent_phone}"`,
          `"${gr?.name || '-'}"`, `"${lvl?.name || '-'}"`, `"${tch?.full_name || '-'}"`,
          `"${br?.name || '-'}"`, s.debt, s.joined_date
        ];
      });
    } else if (dataType === 'payments') {
      filename = `tolovlar_tarixi_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ["To'lov ID", "O'quvchi F.I.O", "Guruhi", "To'langan Summa", "Qaysi Oy Uchun", "Qaysi Yil Uchun", "To'lov Qilingan Aniq Sana"];
      rows = paymentsList.map(p => [
        p.id, `"${p.student_name}"`, `"${p.group_name || '-'}"`,
        p.amount, `"${p.target_month}"`, p.target_year, `"${p.paid_date}"`
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    const { data, error } = await supabase.from('branches').insert([{ name: newBranchName }]).select();
    if (error) return alert("Xatolik: " + error.message);
    if (data) setBranches([...branches, data[0]]);
    setNewBranchName('');
  };

  const handleEditBranch = async (id) => {
    await supabase.from('branches').update({ name: editBranchName }).eq('id', id);
    setBranches(branches.map(b => b.id === id ? { ...b, name: editBranchName } : b));
    setEditingBranchId(null);
  };

  const handleAddLevel = async (e) => {
    e.preventDefault();
    if (!newLevelName.trim()) return;
    const { data, error } = await supabase.from('levels').insert([{ name: newLevelName }]).select();
    if (error) return alert("Xatolik: " + error.message);
    if (data) setLevels([...levels, data[0]]);
    setNewLevelName('');
  };

  const handleEditLevel = async (id) => {
    await supabase.from('levels').update({ name: editLevelName }).eq('id', id);
    setLevels(levels.map(l => l.id === id ? { ...l, name: editLevelName } : l));
    setEditingLevelId(null);
  };

  const handleDeleteLevel = async (id) => {
    if (confirm("Bu darajani o'chirmoqchimisiz?")) {
      setLevels(levels.filter(l => l.id !== id));
      await supabase.from('levels').delete().eq('id', id);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto shadow-lg shadow-blue-500/30 mb-4 tracking-wider">
              E
            </div>
            <h2 className="text-2xl font-black text-white">EduFlow CRM</h2>
            <p className="text-sm text-slate-400 mt-1">O‘quv markazi boshqaruv tizimi</p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold mb-5 text-center flex items-center justify-center gap-2">
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Foydalanuvchi nomi (Login)</label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  required
                  type="text"
                  placeholder="admin"
                  value={loginForm.username}
                  onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/60 border border-slate-600 rounded-xl text-white outline-none focus:border-blue-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Parol</label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/60 border border-slate-600 rounded-xl text-white outline-none focus:border-blue-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all mt-3 active:scale-[0.98]"
            >
              Tizimga Kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row relative ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Chap Menyu (Sidebar) */}
      <aside className={`
        w-72 lg:w-64 border-r p-5 flex flex-col justify-between shrink-0 fixed lg:sticky top-0 h-screen inset-y-0 left-0 z-50 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
      `}>
        <div className="overflow-y-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">E</div>
              <div>
                <h1 className="font-bold text-lg leading-none">{systemSettings.centerName.split(' ')[0] || 'EduFlow'}</h1>
                <span className="text-xs text-blue-500 font-medium">CRM Tizimi</span>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <LiveClock darkMode={darkMode} />

          <nav className="space-y-1">
            {[
              { id: 'profile', name: 'Dashboard', icon: Building2 },
              { id: 'finder', name: 'Guruh Tanlash', icon: Search },
              { id: 'attendance', name: 'Davomat', icon: CheckSquare },
              { id: 'groups', name: 'Guruhlar', icon: BookOpen },
              { id: 'teachers', name: 'O‘qituvchilar', icon: UserCheck },
              { id: 'students', name: 'O‘quvchilar', icon: GraduationCap },
              { id: 'payments', name: 'To‘lovlar', icon: CreditCard },
              { id: 'sms', name: 'SMS Xabarnoma', icon: MessageSquare },
              { id: 'reports', name: 'Hisobot & Excel', icon: Download },
              { id: 'settings', name: 'Sozlamalar', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const today = new Date().getDate();
              const reminderDay = Number(systemSettings.smsReminderDay || 5);
              const hasDebtors = students.some(s => Number(s.debt) > 0 && s.status !== 'archived');
              const showSmsAlert = item.id === 'sms' && today >= reminderDay && hasDebtors;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : darkMode
                      ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{item.name}</span>

                  {showSmsAlert && (
                    <span className="absolute right-3 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-100'}`}
          >
            <span className="flex items-center gap-2">
              {darkMode ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-slate-600" />}
              <span>{darkMode ? 'Kunduzgi rejim' : 'Tungi rejim'}</span>
            </span>
          </button>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <div className="overflow-hidden mr-2">
              <p className="text-xs font-bold truncate">{currentUser.full_name}</p>
              <span className="text-[10px] text-blue-500 uppercase font-semibold">{currentUser.role}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Tizimdan chiqish"
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Asosiy Qism */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <Menu size={22} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold capitalize">{activeTab === 'finder' ? 'Guruh Qidirish' : `${activeTab} bo‘limi`}</h2>
                {loading && <Loader2 size={18} className="animate-spin text-blue-500" />}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Filiallar va markaz boshqaruvi</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs sm:text-sm font-medium">Filial:</span>
            <select 
              value={selectedBranch} 
              onChange={(e) => setSelectedBranch(e.target.value)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border font-medium outline-none text-xs sm:text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
            >
              <option value="ALL">Barcha filiallar</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </header>

        {/* 1. DASHBOARD BO'LIMI */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div onClick={() => setActiveTab('students')} className={`p-4 sm:p-6 rounded-2xl border cursor-pointer transform hover:-translate-y-1 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span className="text-xs sm:text-sm">O‘quvchilar</span>
                  <GraduationCap size={18} className="text-blue-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold mt-2 text-blue-600">{filteredStudents.length} ta</p>
                <span className="text-[10px] sm:text-[11px] text-slate-400 mt-2 block">Bo‘limga o‘tish →</span>
              </div>

              <div onClick={() => setActiveTab('teachers')} className={`p-4 sm:p-6 rounded-2xl border cursor-pointer transform hover:-translate-y-1 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span className="text-xs sm:text-sm">O‘qituvchilar</span>
                  <UserCheck size={18} className="text-purple-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold mt-2 text-purple-600">{filteredTeachers.length} ta</p>
                <span className="text-[10px] sm:text-[11px] text-slate-400 mt-2 block">Bo‘limga o‘tish →</span>
              </div>

              <div onClick={() => setActiveTab('groups')} className={`p-4 sm:p-6 rounded-2xl border cursor-pointer transform hover:-translate-y-1 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span className="text-xs sm:text-sm">Guruhlar</span>
                  <BookOpen size={18} className="text-emerald-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold mt-2 text-emerald-600">{filteredGroups.length} ta</p>
                <span className="text-[10px] sm:text-[11px] text-slate-400 mt-2 block">Bo‘limga o‘tish →</span>
              </div>

              <div onClick={() => setActiveTab('payments')} className={`p-4 sm:p-6 rounded-2xl border cursor-pointer transform hover:-translate-y-1 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span className="text-xs sm:text-sm">Qarzdorlik</span>
                  <CreditCard size={18} className="text-rose-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold mt-2 text-rose-500">{filteredStudents.filter(s => s.debt > 0).length} ta</p>
                <span className="text-[10px] sm:text-[11px] text-slate-400 mt-2 block">Bo‘limga o‘tish →</span>
              </div>
            </div>

            <div className={`p-5 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-base sm:text-lg font-bold mb-4">Filiallar Ro‘yxati</h3>
              <div className="space-y-3">
                {branches.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    {editingBranchId === b.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-3">
                        <input
                          type="text"
                          value={editBranchName}
                          onChange={(e) => setEditBranchName(e.target.value)}
                          className={`w-full px-3 py-1.5 rounded-lg border text-sm outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                        />
                        <button 
                          onClick={() => handleEditBranch(b.id)}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shrink-0"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="font-semibold text-sm sm:text-base">{b.name}</p>
                    )}
                    {editingBranchId !== b.id && (
                      <button 
                        onClick={() => { setEditingBranchId(b.id); setEditBranchName(b.name); }}
                        className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. GURUH TOPISH FILTRI */}
        {activeTab === 'finder' && (
          <div className="space-y-6">
            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold text-base sm:text-lg">
                <Filter size={20} />
                <h3>Yangi O‘quvchi Talablari Bo‘yicha Guruh Izlash</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Filial</label>
                  <select value={finderBranch} onChange={e => setFinderBranch(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none font-medium ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}>
                    <option value="ALL">Barcha Filiallar</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Kurs Darajasi</label>
                  <select value={finderLevel} onChange={e => setFinderLevel(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none font-medium ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}>
                    <option value="ALL">Barcha Darajalar</option>
                    {levels.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Qulay Hafta Kuni</label>
                  <select value={finderDay} onChange={e => setFinderDay(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm outline-none font-medium ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}>
                    <option value="ALL">Istalgan kun</option>
                    {WEEK_DAYS.map(d => {
                      const id = d.id || d.key;
                      return <option key={id} value={id}>{d.label} ({id})</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Qidirish (Nomi / Ustoz)</label>
                  <input
                    type="text"
                    placeholder="Masalan: IELTS yoki Bobur..."
                    value={finderSearch}
                    onChange={e => setFinderSearch(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="font-bold text-sm sm:text-base mb-4">Mos Keladigan Guruhlar ({searchMatchedGroups.length} ta)</h3>
              {searchMatchedGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchMatchedGroups.map(g => {
                    const teacher = teachers.find(t => t.id === g.teacher_id);
                    const level = levels.find(l => l.id === g.level_id);
                    const groupStudentsCount = students.filter(s => s.group_id === g.id).length;

                    return (
                      <div key={g.id} className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              {level?.name || 'Darajasiz'}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {branches.find(b => b.id === g.branch_id)?.name}
                            </span>
                          </div>
                          
                          <h4 className="text-base sm:text-lg font-bold mt-2">{g.name}</h4>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Ustoz: <span className="font-semibold text-slate-700 dark:text-slate-200">{teacher?.full_name}</span>
                          </p>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 text-xs space-y-2 text-slate-500 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Kunlar: <b className="text-slate-800 dark:text-slate-200">{Array.isArray(g.days) ? g.days.join(', ') : (g.days || '')}</b> ({g.time})</span>
                            <span className="font-bold text-blue-500">{groupStudentsCount} ta o‘quvchi</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                            <span className="font-bold text-emerald-600 text-sm">{g.monthly_fee?.toLocaleString()} {systemSettings.currency}</span>
                            <button
                              onClick={() => {
                                setModalData({ 
                                  full_name: '', 
                                  phone: '', 
                                  parent_phone: '', 
                                  debt: 0, 
                                  group_id: g.id 
                                });
                                setIsEditing(false);
                                setModalType('student');
                              }}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs text-center shadow"
                            >
                              + Guruhga O‘quvchi Qo‘shish
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <p>Berilgan talablarga mos guruh topilmadi.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. DAVOMAT BO'LIMI */}
        {activeTab === 'attendance' && (
          <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  Guruh Davomati
                  {attendanceLoading && <Loader2 size={16} className="animate-spin text-blue-500" />}
                </h3>
                <p className="text-xs text-slate-400">Kerakli sana va guruhni tanlab davomatni belgilang</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Sana:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Guruh:</span>
                  <select 
                    value={attendanceGroupId || ''} 
                    onChange={(e) => setAttendanceGroupId(Number(e.target.value))}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300'
                    }`}
                  >
                    {filteredGroups.map(g => {
                      const teacher = teachers.find(t => t.id === g.teacher_id);
                      return (
                        <option key={g.id} value={g.id}>{g.name} ({teacher?.full_name || 'Ustozsiz'})</option>
                      );
                    })}
                  </select>
                </div>

                <button
                  onClick={handleSaveAttendance}
                  disabled={attendanceSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {attendanceSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{attendanceSaving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-xs sm:text-sm">
                    <th className="pb-3 px-3 sm:px-0 font-medium">O‘quvchi</th>
                    <th className="pb-3 font-medium">Aloqa (Ota-ona / Tel)</th>
                    <th className="pb-3 font-medium text-center">Davomat (+/-)</th>
                    <th className="pb-3 pr-3 sm:pr-0 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {attendanceStudents.length > 0 ? (
                    attendanceStudents.map(student => {
                      const attStatus = attendance[`${attendanceGroupId}-${student.id}-${attendanceDate}`];
                      const studentGroup = groups.find(g => g.id === student.group_id);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                          <td className="py-3 px-3 sm:px-0 font-semibold text-sm">{student.full_name}</td>
                          <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                            {student.parent_phone !== '-' ? student.parent_phone : student.phone}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleAttendance(attendanceGroupId, student.id, '+')}
                                className={`w-8 h-8 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                                  attStatus === '+' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-emerald-500'
                                }`}
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleAttendance(attendanceGroupId, student.id, '-')}
                                className={`w-8 h-8 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                                  attStatus === '-' ? 'bg-rose-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-rose-500'
                                }`}
                              >
                                -
                              </button>
                            </div>
                          </td>
                          <td className="py-3 pr-3 sm:pr-0 text-right">
                            <button
                              onClick={() => {
                                setPaymentModalData({
                                  student_id: student.id,
                                  student_name: student.full_name,
                                  group_id: studentGroup?.id,
                                  group_name: studentGroup?.name || 'Asosiy guruh',
                                  monthly_fee: studentGroup?.monthly_fee || 450000,
                                  debt: student.debt || 0,
                                  amount: (student.debt > 0 ? student.debt : (studentGroup?.monthly_fee || 450000))
                                });
                                setSelectedMonth(MONTHS_LIST[new Date().getMonth()]);
                                setSelectedYear(currentYear);
                                setPaymentCustomDate(new Date().toISOString().split('T')[0]);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                            >
                              To‘lov
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-slate-400 text-xs sm:text-sm">Bu guruhda o‘quvchilar yo‘q</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. GURUHLAR BO'LIMI */}
        {activeTab === 'groups' && (
          <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base sm:text-lg font-bold">Guruhlar Boshqaruvi</h3>
              <button
                onClick={() => {
                  setModalData({ 
                    name: '', 
                    teacher_id: teachers[0]?.id || 1, 
                    level_id: levels[0]?.id || 1,
                    days: [],
                    time: '14:00 - 16:00', 
                    monthly_fee: 450000, 
                    branch_id: branches[0]?.id || 1 
                  });
                  setIsEditing(false);
                  setModalType('group');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow"
              >
                <Plus size={15} /> Qo‘shish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroups.map(g => {
                const teacher = teachers.find(t => t.id === g.teacher_id);
                const level = levels.find(l => l.id === g.level_id);
                const groupStudentsCount = students.filter(s => s.group_id === g.id).length;

                return (
                  <div key={g.id} className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                            {branches.find(b => b.id === g.branch_id)?.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                            {level?.name || 'Darajasiz'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => { setModalData(g); setIsEditing(true); setModalType('group'); }}
                            className="text-slate-400 hover:text-blue-500 p-1"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGroup(g.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold mt-2">{g.name}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        O‘qituvchi: <span className="font-semibold text-slate-700 dark:text-slate-300">{teacher?.full_name || 'Biriktirilmagan'}</span>
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1 border-t pt-3 border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between">
                        <span>Kunlar: <b className="text-slate-700 dark:text-slate-300">{Array.isArray(g.days) ? g.days.join(', ') : (g.days || "Belgilanmagan")}</b> ({g.time})</span>
                        <span className="font-semibold text-blue-500">{groupStudentsCount} ta</span>
                      </div>
                      <p>To‘lov: {g.monthly_fee?.toLocaleString()} {systemSettings.currency} / oy</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. O'QITUVCHILAR BO'LIMI */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold">O‘qituvchilar (Filiallar kesimida)</h3>
                  <p className="text-xs text-slate-400">Jami o‘qituvchilar soni: {teachers.length} ta</p>
                </div>
                <button
                  onClick={() => {
                    setModalData({ 
                      full_name: '', 
                      subject: '', 
                      phone: '+998', 
                      branch_ids: branches[0]?.id ? [Number(branches[0].id)] : [] 
                    });
                    setIsEditing(false);
                    setModalType('teacher');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow self-start sm:self-auto"
                >
                  <Plus size={15} /> Yangi O‘qituvchi Qo‘shish
                </button>
              </div>

              <div className="space-y-6">
                {branches
                  .filter(b => selectedBranch === 'ALL' || Number(b.id) === Number(selectedBranch))
                  .map(branch => {
                    const branchTeachers = teachers.filter(t => {
                      const bIds = getTeacherBranchIds(t);
                      return bIds.includes(Number(branch.id));
                    });

                    return (
                      <div key={branch.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50/70 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-blue-500" />
                            <h4 className="font-bold text-sm sm:text-base text-blue-600 dark:text-blue-400">{branch.name}</h4>
                          </div>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold rounded-lg">
                            {branchTeachers.length} ta ustoz
                          </span>
                        </div>

                        {branchTeachers.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {branchTeachers.map(t => {
                              const teacherGroups = groups.filter(g => Number(g.teacher_id) === Number(t.id) && Number(g.branch_id) === Number(branch.id));

                              return (
                                <div key={`${branch.id}-${t.id}`} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col justify-between shadow-xs">
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center font-bold text-purple-600 text-xs">
                                        {t.full_name?.charAt(0) || 'U'}
                                      </div>
                                      <div className="flex gap-1">
                                        <button 
                                          onClick={() => { 
                                            setModalData({
                                              ...t,
                                              branch_ids: getTeacherBranchIds(t)
                                            }); 
                                            setIsEditing(true); 
                                            setModalType('teacher'); 
                                          }}
                                          className="text-slate-400 hover:text-blue-500 p-1"
                                          title="Tahrirlash"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteTeacher(t.id)}
                                          className="text-slate-400 hover:text-rose-500 p-1"
                                          title="O'chirish"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>

                                    <h5 className="font-bold text-xs sm:text-sm">{t.full_name}</h5>
                                    <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">{t.subject || 'Fan ko‘rsatilmagan'}</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Tel: <span className="text-slate-700 dark:text-slate-300 font-semibold">{t.phone}</span></p>
                                  </div>

                                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                                      <span>Shu filialdagi guruhlari:</span>
                                      <span className="font-bold text-slate-700 dark:text-slate-300">{teacherGroups.length} ta</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {teacherGroups.length > 0 ? (
                                        teacherGroups.map(g => (
                                          <span key={g.id} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-medium">
                                            {g.name}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">Guruh biriktirilmagan</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">Ushbu filialda hozircha biriktirilgan o‘qituvchi yo‘q.</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* 6. O'QUVCHILAR BO'LIMI */}
        {activeTab === 'students' && (
          <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold">O‘quvchilar Boshqaruvi</h3>
                <p className="text-xs text-slate-400">Jami ko'rsatilmoqda: {filteredStudents.length} ta o‘quvchi</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedStudentGroup}
                  onChange={(e) => {
                    setSelectedStudentGroup(e.target.value);
                    setSelectedStudentIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                    darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="ALL">Barcha Guruhlar</option>
                  {filteredGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>

                <FastSearchInput onSearch={setSearchQuery} darkMode={darkMode} />

                <button
                  onClick={() => setIsDocxModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  <FileText size={14} /> <span>DOCX Import</span>
                </button>
                <button
                  onClick={() => {
                    setTransferStudentIds([]);
                    setIsTransferModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  <Layers size={14} /> <span>Transfer</span>
                </button>
                <button
                  onClick={() => {
                    setArchiveSearchQuery('');
                    setIsArchiveModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shadow"
                >
                  <Archive size={14} /> <span>Arxiv ({archivedStudents.length})</span>
                </button>
                <button
                  onClick={() => {
                    setModalData({
                      full_name: '',
                      phone: '',
                      parent_phone: '',
                      debt: 0,
                      group_id: groups[0]?.id || 1
                    });
                    setIsEditing(false);
                    setModalType('student');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  <Plus size={14} /> <span>+ Qo‘shish</span>
                </button>
              </div>
            </div>

            {/* OMMAGAVIY AMALLAR PANEL */}
            <div className={`p-2.5 mb-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition-all ${
              selectedStudentIds.length > 0
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                : darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStudentIds(filteredStudents.map(s => s.id));
                    } else {
                      setSelectedStudentIds([]);
                    }
                  }}
                  className="rounded cursor-pointer"
                />
                <span>
                  {selectedStudentIds.length > 0 
                    ? `Tanlandi: ${selectedStudentIds.length} ta` 
                    : `Barchasini tanlash (${filteredStudents.length})`}
                </span>
              </label>

              {selectedStudentIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySelectedPhones}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium"
                  >
                    <Copy size={13} /> Raqamlarni olish
                  </button>
                  <button
                    onClick={handleBulkArchiveStudents}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium"
                  >
                    <Archive size={13} /> Arxivlash
                  </button>
                  <button
                    onClick={handleBulkDeleteStudents}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium"
                  >
                    <Trash2 size={13} /> O‘chirish
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {filteredStudents.map(s => {
                const studentGroup = groups.find(g => g.id === s.group_id);
                const teacher = teachers.find(t => t.id === studentGroup?.teacher_id);
                const level = levels.find(l => l.id === studentGroup?.level_id);
                const isChecked = selectedStudentIds.includes(s.id);

                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all ${
                      isChecked
                        ? 'bg-blue-500/5 border-blue-500/40'
                        : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden pr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds([...selectedStudentIds, s.id]);
                          } else {
                            setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id));
                          }
                        }}
                        className="rounded cursor-pointer shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-semibold text-sm sm:text-base truncate">{s.full_name}</p>
                          <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded text-[10px] sm:text-[11px] font-semibold">
                            {studentGroup?.name} ({level?.name})
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            • Ustoz: <b className="text-slate-700 dark:text-slate-300">{teacher?.full_name || 'Biriktirilmagan'}</b>
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                          {s.parent_phone && s.parent_phone !== '-' && (
                            <span className="mr-3">Ota-onasi: <b className="text-slate-700 dark:text-slate-300">{s.parent_phone}</b></span>
                          )}
                          {s.phone && s.phone !== '-' && (
                            <span>O‘quvchi tel: <b className="text-slate-700 dark:text-slate-300">{s.phone}</b></span>
                          )}
                          {(!s.phone || s.phone === '-') && (!s.parent_phone || s.parent_phone === '-') && (
                            <span className="italic text-slate-400">Telefon raqam kiritilmagan</span>
                          )}
                        </p>
                        {Number(s.debt) > 0 && (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md text-[11px] font-bold">
                              Qarz: {Number(s.debt).toLocaleString()} {systemSettings.currency}
                            </span>
                            {s.debt_months && (
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[11px] font-medium">
                                Davr: {s.debt_months}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          setSelectedStudentForHistory(s);
                          setIsPaymentHistoryOpen(true);
                          setHistoryLoading(true);
                          try {
                            const { data, error } = await supabase
                              .from('payments')
                              .select('*')
                              .eq('student_id', s.id)
                              .order('created_at', { ascending: false });

                            if (error) throw error;
                            setStudentPaymentHistory(data || []);
                          } catch (err) {
                            console.error("Tarixni yuklashda xatolik:", err);
                            alert("To'lov tarixini yuklashda xatolik yuz berdi");
                          } finally {
                            setHistoryLoading(false);
                          }
                        }}
                        title="To'lovlar tarixi"
                        className="text-slate-400 hover:text-emerald-500 p-1.5 transition-colors"
                      >
                        <CreditCard size={16} />
                      </button>
                      <button 
                        onClick={() => { setModalData(s); setIsEditing(true); setModalType('student'); }}
                        className="text-slate-400 hover:text-blue-500 p-1.5"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(s.id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => handleArchiveStudent(s.id)}
                        title="Arxivga o'tkazish"
                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-500/10 transition-colors"
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. TO'LOVLAR BO'LIMI */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold">To‘lovlar Boshqaruvi (Guruhlar bo‘yicha)</h3>
                  <p className="text-xs text-slate-400">Har bir guruh o‘quvchilarining to‘lov holati</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Guruh:</span>
                    <select
                      value={paymentSelectedGroup}
                      onChange={(e) => setPaymentSelectedGroup(e.target.value)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium outline-none ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="ALL">Barcha guruhlar</option>
                      {groups
                        .filter(g => selectedBranch === 'ALL' || g.branch_id === selectedBranch)
                        .map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setShowOnlyDebtors(!showOnlyDebtors)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      showOnlyDebtors
                        ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-500/20'
                        : darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-rose-500/50'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-rose-500/50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${showOnlyDebtors ? 'bg-white' : 'bg-rose-500'}`}></span>
                    Faqat qarzdorlar ({groupsWithDebtInfo.filter(g => g.totalDebt > 0).length} ta)
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {displayedGroups.map(group => {
                  const groupStudents = students.filter(s => s.group_id === group.id);
                  const teacher = teachers.find(t => t.id === group.teacher_id);

                  return (
                    <div key={group.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50/70 border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700 gap-2">
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-blue-600 dark:text-blue-400">{group.name}</h4>
                          <span className="text-xs text-slate-400">Ustoz: {teacher?.full_name || '-'} | Oylik to‘lov: {group.monthly_fee?.toLocaleString()} {systemSettings.currency}</span>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg self-start sm:self-auto">
                          {groupStudents.length} ta o‘quvchi
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {groupStudents.length > 0 ? (
                          groupStudents.map(student => {
                            const lastPayment = paymentsList.find(p => p.student_id === student.id);
                            const contactPhone = student.parent_phone !== '-' ? student.parent_phone : student.phone;

                            return (
                              <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 gap-2">
                                <div>
                                  <p className="font-semibold text-xs sm:text-sm">{student.full_name}</p>
                                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 mt-0.5">
                                    <span>Aloqa: {contactPhone}</span>
                                    {lastPayment && (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        • Oxirgi to‘lov: <b>{lastPayment.target_month} {lastPayment.target_year}</b> uchun ({lastPayment.paid_date} da)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                                  <span className={`text-xs font-bold ${student.debt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {student.debt > 0 ? `${student.debt.toLocaleString()} ${systemSettings.currency} qarz` : "To'langan"}
                                  </span>

                                  <button
                                    onClick={() => {
                                      setPaymentModalData({
                                        student_id: student.id,
                                        student_name: student.full_name,
                                        group_id: group.id,
                                        group_name: group.name,
                                        monthly_fee: group.monthly_fee,
                                        debt: student.debt || 0,
                                        amount: (student.debt > 0 ? student.debt : group.monthly_fee)
                                      });
                                      setSelectedMonth(MONTHS_LIST[new Date().getMonth()]);
                                      setSelectedYear(currentYear);
                                      setPaymentCustomDate(new Date().toISOString().split('T')[0]);
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow"
                                  >
                                    To‘lov Qilish
                                  </button>

                                  {student.debt > 0 && contactPhone !== '-' && (
                                    <button 
                                      onClick={() => alert(`SMS yuborildi (${contactPhone}):\n\n"${generateSmsText(student)}"`)}
                                      className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold"
                                      title="SMS Eslatma"
                                    >
                                      <Send size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-400 italic py-1">Bu guruhda o‘quvchilar mavjud emas.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 8. SMS BO'LIMI */}
        {activeTab === 'sms' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-500" />
                  SMS Xabarnomalar va Bildirishnomalar
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  TextUP orqali ota-onalarga avtomatik va qo'lda SMS eslatmalar yuborish tizimi
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedSingleStudent(null);
                  setIsSmsModalOpen(true);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                SMS Yuborish & Sozlamalar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" /> Har Oylik Eslatma
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                      Faol: {(students || []).filter(s => s.status === 'active').length} ta
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Barcha faol o'quvchilarning ota-onalariga dars to'lovi sanasi yaqinlashgani haqida eslatma jo'natish.
                  </p>
                </div>
                <button
                  onClick={() => setIsSmsModalOpen(true)}
                  className="mt-4 w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Oylik SMS Jo'natishni Sozlash →
                </button>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-800/60 border-red-950/40' : 'bg-red-50/50 border-red-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" /> 2 Oylik Qarzdorlik
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                      Qarzdorlar: {(students || []).filter(s => Number(s.debt || 0) >= (s.monthly_fee || 300000) * 2).length} ta
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    To'lov qarzi 2 oydan oshgan o'quvchilarga ogohlantirish SMS xabari yuborish.
                  </p>
                </div>
                <button
                  onClick={() => setIsSmsModalOpen(true)}
                  className="mt-4 w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Qarzdorlarga SMS Jo'natish →
                </button>
              </div>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border space-y-4 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Guruh filtri:</span>
                  <select
                    value={smsSelectedGroup}
                    onChange={(e) => setSmsSelectedGroup(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="ALL">Barcha Guruhlar</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  {/* Tanlangan guruh qarzdorlariga SMS yuborish tugmasi */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSingleStudent(null);
                  setIsSmsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {smsSelectedGroup === 'ALL'
                    ? "Barcha qarzdorlarga yuborish"
                    : "Shu guruh qarzdorlariga yuborish"} (
                  {(students || []).filter(s => 
                    Number(s.debt || 0) > 0 && 
                    s.status === 'active' && 
                    (smsSelectedGroup === 'ALL' || String(s.group_id) === String(smsSelectedGroup))
                  ).length} ta)
                </span>
              </button>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-300">Qarzdor va Eslatma Belgilangan O'quvchilar</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                      <th className="p-3">F.I.O</th>
                      <th className="p-3">Guruh</th>
                      <th className="p-3">Ota-onasi raqami</th>
                      <th className="p-3">Qarzdorlik</th>
                      <th className="p-3">Eslatma sanasi</th>
                      <th className="p-3 text-right">SMS Yuborish</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-700/60' : 'divide-slate-100'}`}>
                    {(students || [])
                      .filter(s => {
                        const isDebtor = Number(s.debt || 0) > 0 || s.sms_scheduled_date;
                        const matchGroup = smsSelectedGroup === 'ALL' || String(s.group_id) === String(smsSelectedGroup);
                        return isDebtor && matchGroup;
                      })
                      .map(st => (
                        <tr key={st.id} className="hover:bg-slate-750/30">
                          <td className="p-3 font-medium">{st.name || st.full_name}</td>
                          <td className="p-3">{st.group_name || groups.find(g => g.id === st.group_id)?.name || '-'}</td>
                          <td className="p-3 font-mono">{st.parent_phone || st.phone || '-'}</td>
                          <td className="p-3 font-semibold text-red-400">
                            <div>{Number(st.debt || 0).toLocaleString()} {systemSettings.currency}</div>
                            {st.debt_months && (
                              <div className="text-[10px] text-amber-400 font-normal">Davr: {st.debt_months}</div>
                            )}
                          </td>
                          <td className="p-3">{st.sms_scheduled_date || '-'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedSingleStudent(st);
                                setIsSmsModalOpen(true);
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                            >
                              Yuborish
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 9. HISOBOT VA EXCEL BO'LIMI */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-base sm:text-lg font-bold mb-2">Excel / CSV Formatida Hisobotlar</h3>
              <p className="text-xs text-slate-400 mb-6">Chalkashliklarsiz, to‘liq va aniq ustunlar bilan shakllantirilgan hisobotlar:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between gap-3 bg-slate-50 dark:bg-slate-800/40">
                  <div>
                    <h4 className="font-bold text-sm">O‘quvchilar To‘liq Ro‘yxati Hisoboti</h4>
                    <p className="text-xs text-slate-400 mt-1">Ustunlar: F.I.O, O‘quvchi teli, Ota-onasi teli, Guruhi, Darajasi, O‘qituvchisi, Filial va Qarz.</p>
                  </div>
                  <button
                    onClick={() => exportToExcel('students')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow self-start"
                  >
                    <Download size={15} /> O‘quvchilar Ro‘yxatini Yuklash (CSV)
                  </button>
                </div>

                <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between gap-3 bg-slate-50 dark:bg-slate-800">
                  <div>
                    <h4 className="font-bold text-sm">O'quvchilar Jadvali (Word .docx)</h4>
                    <p className="text-xs text-slate-400 mt-1">Word formatidagi toza jadval: F.I.O, Guruh, Telefon va Qarzdorlik.</p>
                  </div>
                  <button
                    onClick={handleExportDocxReport}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-all"
                  >
                    <FileText size={15} /> Word Jadvalini Yuklash (.docx)
                  </button>
                </div>
              <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between gap-3 bg-slate-50 dark:bg-slate-800">
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <CheckSquare size={16} /> O'quvchilar Davomati Hisoboti (Word .docx)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Rasmiy dalil uchun jadval: F.I.O, Guruh, Qoldirilgan aniq sanalar (-), Kelgan/Jami darslar va foiz (%).
                    </p>
                  </div>
                  <button
                    onClick={handleExportAttendanceDocx}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all self-start cursor-pointer"
                  >
                    <Download size={15} /> Davomat Dalolatnomasini Yuklash (.docx)
                  </button>
                </div>
                <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between gap-3 bg-slate-50 dark:bg-slate-800">
                  <div>
                    <h4 className="font-bold text-sm">Barcha Raqamlarni Nusxalash</h4>
                    <p className="text-xs text-slate-400 mt-1">O'quvchilar va ularning ota-onalari telefon raqamlarini bitta matn qilib olish.</p>
                  </div>
                  <button
                    onClick={handleCopyAllPhones}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all"
                  >
                    <Copy size={15} /> Raqamlarni Nusxalash (Clipboard)
                  </button>
                </div>

                <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between gap-3 bg-slate-50 dark:bg-slate-800/40">
                  <div>
                    <h4 className="font-bold text-sm">To‘lovlar Tarixi va Sanalari Hisoboti</h4>
                    <p className="text-xs text-slate-400 mt-1">Ustunlar: O‘quvchi, Guruhi, Summa, To‘langan Oy/Yil hamda To‘lov qilingan aniq sana.</p>
                  </div>
                  <button
                    onClick={() => exportToExcel('payments')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow self-start"
                  >
                    <Download size={15} /> To‘lovlar Tarixini Yuklash (CSV)
                  </button>
                </div>
              </div>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h4 className="font-bold text-sm sm:text-base mb-4">Oxirgi Qabul Qilingan To‘lovlar Tarixi</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[550px] text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                      <th className="pb-2.5 font-medium">O‘quvchi</th>
                      <th className="pb-2.5 font-medium">Guruhi</th>
                      <th className="pb-2.5 font-medium">Summasi</th>
                      <th className="pb-2.5 font-medium">Qaysi Oy Uchun</th>
                      <th className="pb-2.5 font-medium text-right">To‘langan Sana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {paymentsList.length > 0 ? (
                      paymentsList.slice(0, 15).map(pay => (
                        <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                          <td className="py-2.5 font-semibold">{pay.student_name}</td>
                          <td className="py-2.5 text-slate-500">{pay.group_name}</td>
                          <td className="py-2.5 font-bold text-emerald-600">{pay.amount?.toLocaleString()} {systemSettings.currency}</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 rounded text-xs font-semibold">{pay.target_month} {pay.target_year}</span></td>
                          <td className="py-2.5 text-right text-slate-400 font-mono">{pay.paid_date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-slate-400 text-xs">To‘lovlar tarixi mavjud emas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 10. SOZLAMALAR BO'LIMI */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {(() => {
              const now = new Date();
              const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
              const isBilledThisMonth = systemSettings.lastBilledMonth === currentMonthKey;
              const currentMonthName = MONTHS_LIST[now.getMonth()];

              return (
                <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="text-blue-500" size={20} />
                    <h3 className="text-base sm:text-lg font-bold">Oylik Qarzdorlikni Avtomatik Hisoblash</h3>
                  </div>
                  
                  <div className={`p-3.5 rounded-xl mb-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isBilledThisMonth 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    <div>
                      <p className="text-xs sm:text-sm font-bold flex items-center gap-2">
                        <span>{isBilledThisMonth ? '✓ Holat:' : '⏳ Holat:'}</span>
                        <span>{currentMonthName} {now.getFullYear()} uchun qarzdorlik {isBilledThisMonth ? 'qo‘shilgan' : 'hali qo‘shilmagan'}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isBilledThisMonth 
                          ? 'Ushbu oy uchun guruhlar to‘lov miqdori o‘quvchilar hisobiga yozib bo‘lingan.' 
                          : `Reja: har oyning ${systemSettings.billingDay}-sanasida tizimga kirilganda avtomatik qo‘shiladi.`}
                      </p>
                    </div>

                    <button
                      onClick={() => triggerMonthlyBilling(true)}
                      disabled={billingProcessing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 shadow transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {billingProcessing ? 'Hisoblanmoqda...' : `${currentMonthName} uchun hozir hisoblash`}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Qarzdorlik qo‘shiladigan oy sanasi (1-28):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="28"
                          placeholder="1"
                          value={systemSettings.billingDay ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSystemSettings({
                              ...systemSettings,
                              billingDay: val === '' ? '' : Number(val)
                            });
                          }}
                          className={`w-full px-3 py-2 rounded-xl border outline-none text-sm font-semibold ${
                            darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleSaveBillingDay}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-all shrink-0"
                        >
                          Saqlash
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-base sm:text-lg font-bold mb-4">Markaz Sozlamalari</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">O‘quv Markazi Nomi</label>
                  <input
                    type="text"
                    value={systemSettings.centerName}
                    onChange={(e) => setSystemSettings({ ...systemSettings, centerName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Pul Birligi (Valyuta)</label>
                  <input
                    type="text"
                    value={systemSettings.currency}
                    onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold mt-4 shadow"
              >
                <Save size={15} /> Saqlash
              </button>
            </div>

            {/* Guruh Darajalari */}
            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={18} className="text-purple-500" />
                <h3 className="text-base sm:text-lg font-bold">Guruh Darajalari (Levels)</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Guruhlarga biriktiriladigan darajalar</p>

              <form onSubmit={handleAddLevel} className="flex gap-2 max-w-md mb-4">
                <input
                  required
                  type="text"
                  placeholder="Yangi daraja (masalan: Pre-Intermediate)"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl border outline-none text-xs sm:text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shrink-0"
                >
                  <Plus size={15} /> Qo‘shish
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {levels.map(lvl => (
                  <div key={lvl.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {editingLevelId === lvl.id ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <input
                          type="text"
                          value={editLevelName}
                          onChange={(e) => setEditLevelName(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border dark:bg-slate-700 dark:border-slate-600 outline-none"
                        />
                        <button
                          onClick={() => handleEditLevel(lvl.id)}
                          className="p-1 bg-emerald-600 text-white rounded"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold">{lvl.name}</span>
                    )}

                    <div className="flex gap-1">
                      {editingLevelId !== lvl.id && (
                        <button 
                          onClick={() => { setEditingLevelId(lvl.id); setEditLevelName(lvl.name); }}
                          className="p-1 text-slate-400 hover:text-blue-500"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteLevel(lvl.id)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filial Ochish */}
            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-base sm:text-lg font-bold mb-2">Yangi Filial Ochish</h3>
              <form onSubmit={handleAddBranch} className="flex gap-2 max-w-md mt-3">
                <input
                  required
                  type="text"
                  placeholder="Filial nomi"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl border outline-none text-xs sm:text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0"
                >
                  <Plus size={15} /> Qo‘shish
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* DOCX IMPORT MODALI */}
      <DocxImportModal
        isOpen={isDocxModalOpen}
        onClose={() => setIsDocxModalOpen(false)}
        groups={groups}
        branches={branches}
        darkMode={darkMode}
        onSuccess={(newStudents) => setStudents(prev => [...prev, ...newStudents])}
      />

      {/* UNIVERSAL QO'SHISH / TAHRIRLASH MODALI */}
      {modalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`w-full max-w-md p-5 sm:p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'} max-h-[90vh] overflow-y-auto`}>
            <h3 className="text-base sm:text-lg font-bold mb-4 capitalize">
              {isEditing ? 'Tahrirlash' : 'Yangi Qo‘shish'}: {modalType === 'student' ? 'O‘quvchi' : modalType === 'teacher' ? 'O‘qituvchi' : 'Guruh'}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-3 text-sm">
              {modalType === 'student' && (
  <>
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">F.I.O</label>
      <input 
        required 
        name="full_name"
        type="text" 
        defaultValue={modalData.full_name || ''} 
        className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" 
      />
    </div>

    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">Biriktirilgan Guruh</label>
      <select 
        name="group_id"
        defaultValue={modalData.group_id || groups[0]?.id || ''} 
        className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none font-medium text-xs sm:text-sm"
      >
        {groups.map(g => (
          <option key={g.id} value={g.id}>
            {g.name} ({branches.find(b => b.id === g.branch_id)?.name}) - {g.monthly_fee?.toLocaleString()} {systemSettings.currency}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">Ota-onasi Telefoni</label>
      <input 
        name="parent_phone"
        type="text" 
        placeholder="+998..." 
        defaultValue={modalData.parent_phone === '-' ? '' : (modalData.parent_phone || '')} 
        className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" 
      />
    </div>

    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">O‘quvchining Shaxsiy Telefoni</label>
      <input 
        name="phone"
        type="text" 
        placeholder="+998..." 
        defaultValue={modalData.phone === '-' ? '' : (modalData.phone || '')} 
        className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" 
      />
    </div>

    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">Qarzdorlik summasi ({systemSettings.currency})</label>
      <input
        name="debt"
        type="number"
        defaultValue={modalData.debt ?? 0}
        placeholder="0"
        className={`w-full px-3 py-2 rounded-xl border outline-none text-sm font-semibold ${
          darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'
        }`}
      />
    </div>

    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">Qarzdorlik Oylari</label>
      <input
        name="debt_months"
        type="text"
        placeholder="Iyun-Sentabr"
        defaultValue={modalData.debt_months || ''}
        className={`w-full px-3 py-2 rounded-xl border outline-none text-sm font-semibold ${
          darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'
        }`}
      />
    </div>
  </>
)}

              {modalType === 'group' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Guruh Nomi</label>
                    <input required type="text" value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Guruh Darajasi (Level)</label>
                    <select 
                      value={modalData.level_id || levels[0]?.id || ''} 
                      onChange={e => setModalData({...modalData, level_id: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none font-medium text-xs sm:text-sm"
                    >
                      {levels.map(lvl => (
                        <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Filial</label>
                    <select value={modalData.branch_id || branches[0]?.id || ''} onChange={e => setModalData({...modalData, branch_id: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm">
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">O‘qituvchi</label>
                    <select 
                      value={modalData.teacher_id || teachers[0]?.id || ''} 
                      onChange={e => setModalData({...modalData, teacher_id: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none font-medium text-xs sm:text-sm"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dars Kunlari:</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {WEEK_DAYS.map(day => {
                        const dayKey = typeof day === 'object' ? (day.id || day.key) : day;
                        const dayLabel = typeof day === 'object' ? (day.label || day.name || day.id) : day;
                        const isChecked = (modalData.days || []).includes(dayKey);

                        return (
                          <button
                            type="button"
                            key={dayKey}
                            onClick={() => toggleDaySelection(dayKey)}
                            className={`px-1.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                              isChecked
                                ? 'bg-blue-600 border-blue-600 text-white shadow'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isChecked && <Check size={12} />}
                            <span>{dayLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Dars Vaqti</label>
                    <input required type="text" placeholder="14:00 - 16:00" value={modalData.time || ''} onChange={e => setModalData({...modalData, time: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Oylik To‘lov ({systemSettings.currency})</label>
                    <input required type="number" value={modalData.monthly_fee ?? ''} onChange={e => { const val = e.target.value; setModalData({ ...modalData, monthly_fee: val === '' ? '' : Number(val) }); }} className={`w-full px-3 py-2 rounded-xl border outline-none text-sm font-semibold ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`} />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setModalType(null)} className="px-3.5 py-2 text-slate-400 text-xs sm:text-sm">Bekor qilish</button>
                <button 
  type="submit" 
  disabled={isSubmitting}
  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
>
  {isSubmitting ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      <span>Saqlanmoqda...</span>
    </>
  ) : (
    <span>Saqlash</span>
  )}
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TO'LOV TASDIQLASH VA ANIQ SANA MODALI */}
      {paymentModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md p-5 sm:p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2.5 text-blue-500 mb-4">
              <CreditCard size={22} />
              <h3 className="text-base sm:text-lg font-bold">To‘lovni Qabul Qilish</h3>
            </div>
            
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-400">O‘quvchi:</span>
                <span className="font-semibold">{paymentModalData.student_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-400">Guruh:</span>
                <span className="font-semibold">{paymentModalData.group_name}</span>
              </div>
              <div className="py-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 text-xs font-medium">To'lov Summasi (so'm):</label>
                  {paymentModalData.debt > 0 && (
                    <span className="text-[11px] text-red-400 font-semibold">
                      Qarz: {Number(paymentModalData.debt).toLocaleString()} so'm
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={paymentModalData.amount ?? ''}
                  onChange={(e) => setPaymentModalData({ ...paymentModalData, amount: e.target.value === '' ? '' : Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold outline-none ${
                    darkMode ? 'bg-slate-700/50 border-slate-600 text-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-600'
                  }`}
                  placeholder="Summani kiriting..."
                />
              </div>

              <div className="py-1.5">
                <label className="block text-slate-400 text-xs mb-1 font-medium">Qaysi oy uchun to‘lanmoqda?</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs sm:text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300'}`}
                  >
                    {MONTHS_LIST.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs sm:text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300'}`}
                  >
                    {YEARS_LIST.map((y) => (
                      <option key={y} value={y}>{y}-yil</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="py-1.5">
                <label className="block text-slate-400 text-xs mb-1 font-medium">To‘lov qilingan aniq sana:</label>
                <input
                  type="date"
                  value={paymentCustomDate}
                  onChange={(e) => setPaymentCustomDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs sm:text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300'}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setPaymentModalData(null)}
                className="px-3.5 py-2 rounded-xl text-slate-400 text-xs sm:text-sm font-medium"
              >
                Bekor qilish
              </button>
              <button
  onClick={handleConfirmPayment}
  disabled={isSubmitting}
  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs sm:text-sm font-semibold shadow transition-all cursor-pointer disabled:cursor-not-allowed"
>
  {isSubmitting ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      <span>Saqlanmoqda...</span>
    </>
  ) : (
    <span>To‘lovni Saqlash</span>
  )}
</button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER MODALI */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl p-4 sm:p-6 rounded-2xl border shadow-2xl flex flex-col my-auto max-h-[95vh] ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-3 border-slate-700/50 flex-shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Layers className="text-indigo-500" size={20} /> Guruhlararo Transfer
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  O'quvchilarni yangi guruhlarga tezkor o'tkazish.
                </p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 text-lg font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto pr-1 flex-1 min-h-0">
              <div className={`p-3 sm:p-4 rounded-xl border flex flex-col ${
                darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="mb-2 flex-shrink-0">
                  <label className="text-xs font-bold text-slate-400 block mb-1">1. Qaysi Guruhdan? (Eski)</label>
                  <select
                    value={sourceGroupId}
                    onChange={(e) => {
                      setSourceGroupId(e.target.value);
                      setTransferStudentIds([]);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">-- Eski guruhni tanlang --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({students.filter(s => s.group_id === g.id).length} ta o'quvchi)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-y-auto space-y-1.5 pr-1 max-h-48 sm:max-h-64 flex-1">
                  {sourceGroupId ? (
                    (() => {
                      const sourceStudents = students.filter(s => s.group_id === Number(sourceGroupId));
                      if (sourceStudents.length === 0) {
                        return <p className="text-xs text-slate-400 text-center py-6">Bu guruhda o'quvchilar yo'q</p>;
                      }
                      return (
                        <>
                          <div className="sticky top-0 bg-inherit flex justify-between items-center pb-1.5 pt-0.5 border-b border-slate-700/40 text-[11px] font-semibold text-slate-400 z-10">
                            <span>O'quvchilar ({sourceStudents.length} ta)</span>
                            <button
                              onClick={() => {
                                if (transferStudentIds.length === sourceStudents.length) {
                                  setTransferStudentIds([]);
                                } else {
                                  setTransferStudentIds(sourceStudents.map(s => s.id));
                                }
                              }}
                              className="text-indigo-400 hover:underline"
                            >
                              {transferStudentIds.length === sourceStudents.length ? 'Bekor qilish' : 'Barchasini tanlash'}
                            </button>
                          </div>
                          {sourceStudents.map(st => {
                            const isChecked = transferStudentIds.includes(st.id);
                            return (
                              <label
                                key={st.id}
                                className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-indigo-600/20 border-indigo-500 font-semibold'
                                    : darkMode ? 'bg-slate-700/40 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTransferStudentIds([...transferStudentIds, st.id]);
                                      } else {
                                        setTransferStudentIds(transferStudentIds.filter(id => id !== st.id));
                                      }
                                    }}
                                    className="rounded cursor-pointer"
                                  />
                                  <span className="truncate">{st.full_name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 ml-2">{st.phone || '-'}</span>
                              </label>
                            );
                          })}
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">Avval eski guruhni tanlang</p>
                  )}
                </div>
              </div>

              <div className={`p-3 sm:p-4 rounded-xl border flex flex-col ${
                darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="mb-2 flex-shrink-0">
                  <label className="text-xs font-bold text-slate-400 block mb-1">2. Qaysi Guruhga? (Yangi)</label>
                  <select
                    value={destGroupId}
                    onChange={(e) => setDestGroupId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">-- Yangi guruhni tanlang --</option>
                    {groups
                      .filter(g => g.id !== Number(sourceGroupId))
                      .map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({students.filter(s => s.group_id === g.id).length} ta o'quvchi)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="overflow-y-auto space-y-1.5 pr-1 max-h-48 sm:max-h-64 flex-1">
                  {destGroupId ? (
                    (() => {
                      const destStudents = students.filter(s => s.group_id === Number(destGroupId));
                      return (
                        <>
                          <div className="sticky top-0 bg-inherit flex justify-between items-center pb-1.5 pt-0.5 border-b border-slate-700/40 text-[11px] font-semibold text-slate-400 z-10">
                            <span>Mavjud a'zolar ({destStudents.length} ta)</span>
                            {transferStudentIds.length > 0 && (
                              <span className="text-emerald-400 font-bold">+{transferStudentIds.length} ta qo'shiladi</span>
                            )}
                          </div>
                          {destStudents.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">Bu yangi guruh hali bo'sh</p>
                          ) : (
                            destStudents.map((st, i) => (
                              <div
                                key={st.id}
                                className={`p-2 rounded-lg border text-xs flex justify-between items-center ${
                                  darkMode ? 'bg-slate-700/20 border-slate-700/60' : 'bg-white border-slate-200'
                                }`}
                              >
                                <span className="truncate">{i + 1}. {st.full_name}</span>
                                <span className="text-[10px] text-slate-400 ml-2">{st.phone || '-'}</span>
                              </div>
                            ))
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">Yangi guruhni tanlang</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 mt-3 border-slate-700/50 flex-shrink-0">
              <span className="text-xs font-semibold text-indigo-400">
                {transferStudentIds.length > 0 ? `${transferStudentIds.length} ta tanlandi` : "O'quvchilarni tanlang"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleTransferStudents}
                  disabled={transferStudentIds.length === 0 || !destGroupId}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Ko'chirish ➡️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARXIVLANGAN O'QUVCHILAR MODALI */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl p-4 sm:p-6 rounded-2xl border shadow-2xl flex flex-col my-auto max-h-[90vh] ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Archive size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">Arxivlangan O'quvchilar</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    O'qishni tugatgan yoki vaqtincha to'xtatgan o'quvchilar ({archivedStudents.length} ta)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 text-lg font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 flex-shrink-0">
              <input
                type="text"
                placeholder="Arxivdan qidirish (ism yoki telefon)..."
                value={archiveSearchQuery}
                onChange={(e) => setArchiveSearchQuery(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 pr-1 space-y-2">
              {(() => {
                const q = archiveSearchQuery.toLowerCase();
                const list = archivedStudents.filter(s =>
                  !q ||
                  s.full_name?.toLowerCase().includes(q) ||
                  s.phone?.includes(q) ||
                  s.parent_phone?.includes(q)
                );

                if (list.length === 0) {
                  return (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      {archiveSearchQuery ? "Qidiruv bo'yicha hech kim topilmadi" : "Arxiv bo'sh"}
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-slate-700/40">
                    {list.map((st) => {
                      const grp = groups.find(g => g.id === st.group_id);
                      return (
                        <div
                          key={st.id}
                          className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-800/40 rounded-lg transition-colors gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{st.full_name}</p>
                            <p className="text-[11px] text-slate-400">
                              Oxirgi guruhi: <span className="text-indigo-400">{grp?.name || 'Nomaʼlum'}</span> | Tel: {st.phone || st.parent_phone || '-'}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const { error } = await supabase
                                  .from('students')
                                  .update({ status: 'active' })
                                  .eq('id', st.id);

                                if (error) throw error;
                                setStudents(prev =>
                                  prev.map(item => (item.id === st.id ? { ...item, status: 'active' } : item))
                                );
                              } catch (err) {
                                alert("Tiklashda xatolik: " + err.message);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                          >
                            <RefreshCw size={12} />
                            <span>Qayta Tiklash</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="border-t pt-3 mt-3 border-slate-700/50 flex justify-end flex-shrink-0">
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TO'LOVLAR TARIXI MODALI */}
      {isPaymentHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl p-4 sm:p-6 rounded-2xl border shadow-2xl flex flex-col my-auto max-h-[85vh] ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">{selectedStudentForHistory?.full_name}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Barcha amalga oshirilgan to'lovlar tarixi</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentHistoryOpen(false)}
                className="text-slate-400 hover:text-rose-500 text-lg font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 space-y-2 pr-1">
              {historyLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-emerald-500" size={28} />
                </div>
              ) : studentPaymentHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Ushbu o'quvchi bo'yicha hali to'lovlar qayd etilmagan.
                </div>
              ) : (
                <div className="divide-y divide-slate-700/40">
                  {studentPaymentHistory.map((pm) => (
                    <div key={pm.id} className="flex items-center justify-between py-3 px-2 hover:bg-slate-800/30 rounded-lg transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-500">
                            +{Number(pm.amount || 0).toLocaleString()} {systemSettings?.currency || "so'm"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">
                            {pm.payment_method || pm.method || 'Naqd'}
                          </span>
                        </div>
                        {pm.comment && (
                          <p className="text-[11px] text-slate-400 mt-0.5">Izoh: {pm.comment}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">
                          {pm.payment_date ? new Date(pm.payment_date).toLocaleDateString('uz-UZ') : (pm.created_at ? new Date(pm.created_at).toLocaleDateString('uz-UZ') : '-')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-3 mt-3 border-slate-700/50 flex justify-end flex-shrink-0">
              <button
                onClick={() => setIsPaymentHistoryOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Xabarnoma Modali */}
      {isSmsModalOpen && (
        <SmsManagerModal
          isOpen={isSmsModalOpen}
          onClose={() => {
            setIsSmsModalOpen(false);
            setSelectedSingleStudent(null);
          }}
          students={(students || []).filter(s => 
  smsSelectedGroup === 'ALL' || String(s.group_id) === String(smsSelectedGroup)
)}
          groups={groups}
          singleStudent={selectedSingleStudent}
        />
      )}

      {/* Sahifa tepasiga qaytish tugmasi */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          title="Sahifa boshiga qaytish"
          className="fixed bottom-6 right-6 z-50 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center border border-indigo-400/30 cursor-pointer animate-bounce"
        >
          <ArrowUp size={22} />
        </button>
      )}
    </div>
  );
}
