import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as mammoth from 'mammoth';
import { 
  Building2, GraduationCap, CheckSquare, 
  CreditCard, Settings, Moon, Sun, Edit2, Trash2, Plus, Check, Send, 
  AlertCircle, BookOpen, UserCheck, MessageSquare, Download, Copy, Save, 
  Search, Filter, Layers, Eye, LogOut, Lock, User, Menu, X, Loader2,
  Clock, FileText, Upload
} from 'lucide-react';

const SUPABASE_URL = "https://qvtthgoeythyqdpslsqh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Nopc4YysCA65DMZ-_HNlnw_qyfMjlPG";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WEEK_DAYS = [
  { id: 'Du', label: 'Dushanba' },
  { id: 'Se', label: 'Seshanba' },
  { id: 'Chor', label: 'Chorshanba' },
  { id: 'Pay', label: 'Payshanba' },
  { id: 'Ju', label: 'Juma' },
  { id: 'Shan', label: 'Shanba' },
  { id: 'Yak', label: 'Yakshanba' },
];

const MONTHS_LIST = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", 
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];

const currentYear = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('eduflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('eduflow_dark') === 'true');
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Jonli Soat & Sana
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Supabase Baza Ma'lumotlari
  const [branches, setBranches] = useState([]);
  const [levels, setLevels] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [newBranchName, setNewBranchName] = useState('');

  const [newLevelName, setNewLevelName] = useState('');
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [editLevelName, setEditLevelName] = useState('');

  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem('eduflow_attendance');
    return saved ? JSON.parse(saved) : {};
  });

  const [systemSettings, setSystemSettings] = useState({
    centerName: "EduFlow O‘quv Markazi",
    currency: "so'm",
    smsReminderDay: 5,
  });

  const [smsTemplate, setSmsTemplate] = useState("Hurmatli ota-ona! {ism}ning \"{guruh}\" kursi bo'yicha to'lov muddati keldi. Oylik to'lov summasi: {summa}. Iltimos, o'z vaqtida to'lovni amalga oshirishingizni so'raymiz.");

  // Guruh qidirish filtrlari
  const [finderBranch, setFinderBranch] = useState('ALL');
  const [finderLevel, setFinderLevel] = useState('ALL');
  const [finderDay, setFinderDay] = useState('ALL');
  const [finderSearch, setFinderSearch] = useState('');

  // Davomat holati
  const [attendanceGroupId, setAttendanceGroupId] = useState(null);

  // To'lov modali
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS_LIST[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [paymentCustomDate, setPaymentCustomDate] = useState(new Date().toISOString().split('T')[0]);

  // DOCX Ommaviy Import Modali
  const [isDocxModalOpen, setIsDocxModalOpen] = useState(false);
  const [docxGroupId, setDocxGroupId] = useState('');
  const [docxTextData, setDocxTextData] = useState('');
  const [singlePhoneRole, setSinglePhoneRole] = useState('parent'); // 'parent' yoki 'student'
  const [isDocxProcessing, setIsDocxProcessing] = useState(false);

  // Modallar holati
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // ---------------------------------------------------------
  // BAZADAN MA'LUMOTLARNI YUKLAB OLISH
  // ---------------------------------------------------------
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [brRes, lvlRes, tchRes, grpRes, stdRes, payRes, setRes] = await Promise.all([
        supabase.from('branches').select('*').order('id', { ascending: true }),
        supabase.from('levels').select('*').order('id', { ascending: true }),
        supabase.from('teachers').select('*').order('id', { ascending: true }),
        supabase.from('groups').select('*').order('id', { ascending: true }),
        supabase.from('students').select('*').order('id', { ascending: true }),
        supabase.from('payments').select('*').order('id', { ascending: false }),
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
          smsReminderDay: setRes.data.sms_reminder_day || 5
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

  // O'qituvchilarning barcha filiallarini xavfsiz aniqlash
  const getTeacherBranchIds = (t) => {
    if (Array.isArray(t.branch_ids) && t.branch_ids.length > 0) {
      return t.branch_ids.map(Number);
    }
    if (t.branch_id) {
      return [Number(t.branch_id)];
    }
    return [];
  };

  // Filtrlangan ma'lumotlar
  const filteredStudents = selectedBranch === 'ALL' 
    ? students 
    : students.filter(s => s.branch_id === parseInt(selectedBranch));

  const filteredGroups = selectedBranch === 'ALL' 
    ? groups 
    : groups.filter(g => g.branch_id === parseInt(selectedBranch));

  const filteredTeachers = selectedBranch === 'ALL' 
    ? teachers 
    : teachers.filter(t => {
        const bIds = getTeacherBranchIds(t);
        return bIds.includes(parseInt(selectedBranch));
      });

  const attendanceStudents = students.filter(s => s.group_id === parseInt(attendanceGroupId));

  const searchMatchedGroups = groups.filter(g => {
    const matchBranch = finderBranch === 'ALL' || g.branch_id === Number(finderBranch);
    const matchLevel = finderLevel === 'ALL' || g.level_id === Number(finderLevel);
    const matchDay = finderDay === 'ALL' || (g.days && g.days.includes(finderDay));
    const matchText = g.name?.toLowerCase().includes(finderSearch.toLowerCase()) || 
                      teachers.find(t => t.id === g.teacher_id)?.full_name?.toLowerCase().includes(finderSearch.toLowerCase());
    return matchBranch && matchLevel && matchDay && matchText;
  });

  const toggleDaySelection = (dayId) => {
    const currentDays = modalData.days || [];
    if (currentDays.includes(dayId)) {
      setModalData({ ...modalData, days: currentDays.filter(d => d !== dayId) });
    } else {
      setModalData({ ...modalData, days: [...currentDays, dayId] });
    }
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
    const today = new Date().toISOString().split('T')[0];
    const key = `${groupId}-${studentId}-${today}`;
    setAttendance(prev => ({ ...prev, [key]: status }));
  };

  // ---------------------------------------------------------
  // INTELLEKTUAL DOCX VA MATN PARSER ALGORITMI
  // ---------------------------------------------------------
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

    // Yopishib ketgan so'z va raqamlarni avtomatik ajratish (Pre-processing)
    let rawText = docxTextData
      // Raqamdan keyin darhol harf kelgan bo'lsa yangi qatorga tushirish (masalan: 9485Dilshodov -> 9485 \n Dilshodov)
      .replace(/(\d{2,})([A-ZА-ЯЁҒҚҲЎ])/g, '$1\n$2')
      // Harfdan keyin darhol raqam yopishgan bo'lsa ajratish (masalan: Бегубор945959989 -> Бегубор 945959989)
      .replace(/([a-zA-Zа-яА-ЯёЁғқҳўҒҚҲЎ])(\d{9})/g, '$1 $2');

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newStudentsToInsert = [];

    // Telefon raqamlarini qidirish
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
        id: Date.now() + index,
        full_name: fullName,
        phone: studentPhone,
        parent_phone: parentPhone,
        group_id: Number(docxGroupId),
        branch_id: targetGroup?.branch_id || 1,
        debt: Number(targetGroup?.monthly_fee || 0),
        joined_date: new Date().toISOString().split('T')[0]
      });
    });

    if (newStudentsToInsert.length > 0) {
      setStudents(prev => [...prev, ...newStudentsToInsert]);
      await supabase.from('students').insert(newStudentsToInsert);
      alert(`Muvaffaqiyatli! ${newStudentsToInsert.length} ta o'quvchi bazaga kiritildi.`);
      setIsDocxModalOpen(false);
      setDocxTextData('');
    }
  };

  // ---------------------------------------------------------
  // SUPABASE BAZA CRUD
  // ---------------------------------------------------------
  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    const newId = Date.now();
    const newObj = { id: newId, name: newBranchName };
    setBranches([...branches, newObj]);
    setNewBranchName('');
    await supabase.from('branches').insert([newObj]);
  };

  const handleEditBranch = async (id) => {
    setBranches(branches.map(b => b.id === id ? { ...b, name: editBranchName } : b));
    setEditingBranchId(null);
    await supabase.from('branches').update({ name: editBranchName }).eq('id', id);
  };

  const handleAddLevel = async (e) => {
    e.preventDefault();
    if (!newLevelName.trim()) return;
    const newId = Date.now();
    const newObj = { id: newId, name: newLevelName };
    setLevels([...levels, newObj]);
    setNewLevelName('');
    await supabase.from('levels').insert([newObj]);
  };

  const handleEditLevel = async (id) => {
    setLevels(levels.map(l => l.id === id ? { ...l, name: editLevelName } : b));
    setEditingLevelId(null);
    await supabase.from('levels').update({ name: editLevelName }).eq('id', id);
  };

  const handleDeleteLevel = async (id) => {
    if (confirm("Bu darajani o'chirmoqchimisiz?")) {
      setLevels(levels.filter(l => l.id !== id));
      await supabase.from('levels').delete().eq('id', id);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (confirm("Haqiqatan ham bu o'quvchini o'chirmoqchimisiz?")) {
      setStudents(students.filter(s => s.id !== id));
      await supabase.from('students').delete().eq('id', id);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (confirm("Haqiqatan ham bu o'qituvchini o'chirmoqchimisiz?")) {
      setTeachers(teachers.filter(t => t.id !== id));
      await supabase.from('teachers').delete().eq('id', id);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (confirm("Haqiqatan ham bu guruhni o'chirmoqchimisiz?")) {
      setGroups(groups.filter(g => g.id !== id));
      await supabase.from('groups').delete().eq('id', id);
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();

    if (modalType === 'student') {
      const selectedG = groups.find(g => g.id === Number(modalData.group_id || groups[0]?.id));
      const branchId = selectedG ? selectedG.branch_id : Number(modalData.branch_id || branches[0]?.id || 1);

      if (isEditing) {
        const updated = { 
          ...modalData, 
          phone: modalData.phone || '-',
          parent_phone: modalData.parent_phone || '-',
          branch_id: branchId, 
          group_id: Number(modalData.group_id), 
          debt: Number(modalData.debt || 0) 
        };
        setStudents(students.map(s => s.id === modalData.id ? updated : s));
        await supabase.from('students').update(updated).eq('id', modalData.id);
      } else {
        const newObj = { 
          id: Date.now(),
          full_name: modalData.full_name,
          phone: modalData.phone || '-',
          parent_phone: modalData.parent_phone || '-',
          branch_id: branchId, 
          group_id: Number(modalData.group_id || groups[0]?.id || 1), 
          debt: Number(modalData.debt || 0), 
          joined_date: new Date().toISOString().split('T')[0] 
        };
        setStudents([...students, newObj]);
        await supabase.from('students').insert([newObj]);
      }
    } else if (modalType === 'teacher') {
      const branchIds = modalData.branch_ids && modalData.branch_ids.length > 0 
        ? modalData.branch_ids 
        : [Number(branches[0]?.id || 1)];

      if (isEditing) {
        const updated = { 
          ...modalData, 
          branch_ids: branchIds,
          branch_id: branchIds[0] 
        };
        setTeachers(teachers.map(t => t.id === modalData.id ? updated : t));
        await supabase.from('teachers').update(updated).eq('id', modalData.id);
      } else {
        const newObj = { 
          id: Date.now(), 
          full_name: modalData.full_name,
          subject: modalData.subject,
          phone: modalData.phone || '-',
          branch_ids: branchIds,
          branch_id: branchIds[0] 
        };
        setTeachers([...teachers, newObj]);
        await supabase.from('teachers').insert([newObj]);
      }
    } else if (modalType === 'group') {
      if (isEditing) {
        const updated = { 
          ...modalData, 
          branch_id: Number(modalData.branch_id), 
          teacher_id: Number(modalData.teacher_id),
          level_id: Number(modalData.level_id || levels[0]?.id),
          days: modalData.days || [],
          monthly_fee: Number(modalData.monthly_fee) 
        };
        setGroups(groups.map(g => g.id === modalData.id ? updated : g));
        await supabase.from('groups').update(updated).eq('id', modalData.id);
      } else {
        const newObj = { 
          id: Date.now(), 
          name: modalData.name,
          branch_id: Number(modalData.branch_id || branches[0]?.id || 1), 
          teacher_id: Number(modalData.teacher_id || teachers[0]?.id || 1),
          level_id: Number(modalData.level_id || levels[0]?.id || 1),
          days: modalData.days || ['Du', 'Chor', 'Ju'],
          time: modalData.time || '14:00 - 16:00', 
          monthly_fee: Number(modalData.monthly_fee || 400000) 
        };
        setGroups([...groups, newObj]);
        await supabase.from('groups').insert([newObj]);
      }
    }
    setModalType(null);
  };

  const handleConfirmPayment = async () => {
    if (!paymentModalData) return;

    const newPaymentRecord = {
      id: Date.now(),
      student_id: paymentModalData.student_id,
      student_name: paymentModalData.student_name,
      group_id: paymentModalData.group_id,
      group_name: paymentModalData.group_name,
      amount: Number(paymentModalData.monthly_fee || 0),
      target_month: selectedMonth,
      target_year: Number(selectedYear),
      paid_date: paymentCustomDate || new Date().toISOString().split('T')[0]
    };

    setPaymentsList([newPaymentRecord, ...paymentsList]);
    setStudents(students.map(s => s.id === paymentModalData.student_id ? { ...s, debt: 0 } : s));

    await Promise.all([
      supabase.from('payments').insert([newPaymentRecord]),
      supabase.from('students').update({ debt: 0 }).eq('id', paymentModalData.student_id)
    ]);

    alert(`To'lov muvaffaqiyatli saqlandi!\n\nTo'lov sanasi: ${newPaymentRecord.paid_date}\nQaysi oy uchun: ${newPaymentRecord.target_month} ${newPaymentRecord.target_year}`);
    setPaymentModalData(null);
  };

  const handleSaveSettings = async () => {
    await supabase.from('system_settings').upsert({
      id: 1,
      center_name: systemSettings.centerName,
      currency: systemSettings.currency,
      sms_reminder_day: systemSettings.smsReminderDay,
      sms_template: smsTemplate
    });
    alert("Sozlamalar bazada muvaffaqiyatli saqlandi!");
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
          s.id, 
          `"${s.full_name}"`, 
          `"${s.phone}"`, 
          `"${s.parent_phone}"`, 
          `"${gr?.name || '-'}"`, 
          `"${lvl?.name || '-'}"`, 
          `"${tch?.full_name || '-'}"`, 
          `"${br?.name || '-'}"`, 
          s.debt, 
          s.joined_date
        ];
      });
    } else if (dataType === 'payments') {
      filename = `tolovlar_tarixi_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ["To'lov ID", "O'quvchi F.I.O", "Guruhi", "To'langan Summa", "Qaysi Oy Uchun", "Qaysi Yil Uchun", "To'lov Qilingan Aniq Sana"];
      rows = paymentsList.map(p => [
        p.id,
        `"${p.student_name}"`,
        `"${p.group_name || '-'}"`,
        p.amount,
        `"${p.target_month}"`,
        p.target_year,
        `"${p.paid_date}"`
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        w-72 lg:w-64 border-r p-5 flex flex-col justify-between shrink-0 fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
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

          {/* Real Vaqt va Sana Bloki */}
          <div className={`mb-4 p-2.5 rounded-xl border flex items-center gap-2.5 ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-blue-50/70 border-blue-100'}`}>
            <Clock size={16} className="text-blue-500 shrink-0" />
            <div className="text-xs font-medium">
              <p className="font-bold text-blue-600 dark:text-blue-400">
                {currentDateTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentDateTime.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

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
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm"
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
                    {WEEK_DAYS.map(d => (
                      <option key={d.id} value={d.id}>{d.label} ({d.id})</option>
                    ))}
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
                            <span>Kunlar: <b className="text-slate-800 dark:text-slate-200">{g.days?.join(', ')}</b> ({g.time})</span>
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
                <h3 className="text-base sm:text-lg font-bold">Guruh Davomati</h3>
                <p className="text-xs text-slate-400">Kerakli guruhni tanlang</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium">Guruh:</span>
                <select 
                  value={attendanceGroupId || ''}
                  onChange={(e) => setAttendanceGroupId(Number(e.target.value))}
                  className={`w-full sm:w-auto px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300'}`}
                >
                  {filteredGroups.map(g => {
                    const teacher = teachers.find(t => t.id === g.teacher_id);
                    return (
                      <option key={g.id} value={g.id}>{g.name} ({teacher?.full_name || 'Ustozsiz'})</option>
                    );
                  })}
                </select>
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
                      const today = new Date().toISOString().split('T')[0];
                      const attStatus = attendance[`${attendanceGroupId}-${student.id}-${today}`];
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
                                className={`w-8 h-8 rounded-lg font-bold text-sm transition-all ${
                                  attStatus === '+' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-emerald-500'
                                }`}
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleAttendance(attendanceGroupId, student.id, '-')}
                                className={`w-8 h-8 rounded-lg font-bold text-sm transition-all ${
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
                                  monthly_fee: studentGroup?.monthly_fee || 450000
                                });
                                setSelectedMonth(MONTHS_LIST[new Date().getMonth()]);
                                setSelectedYear(currentYear);
                                setPaymentCustomDate(new Date().toISOString().split('T')[0]);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0"
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
                    days: ['Du', 'Chor', 'Ju'], 
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
                        <span>Kunlar: <b className="text-slate-700 dark:text-slate-300">{g.days?.join(', ')}</b> ({g.time})</span>
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

              {/* Filiallar bo'yicha bloklar */}
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

                {/* Filialsiz o'qituvchilar uchun xavfsizlik bloki */}
                {teachers.filter(t => {
                  const bIds = getTeacherBranchIds(t);
                  return !branches.some(b => bIds.includes(Number(b.id)));
                }).length > 0 && (
                  <div className={`p-4 rounded-xl border border-dashed border-amber-400/60 ${darkMode ? 'bg-amber-950/20' : 'bg-amber-50/60'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400">Filiali belgilanmagan / Boshqa o‘qituvchilar</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {teachers
                        .filter(t => {
                          const bIds = getTeacherBranchIds(t);
                          return !branches.some(b => bIds.includes(Number(b.id)));
                        })
                        .map(t => (
                          <div key={t.id} className="p-3 rounded-lg border bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-800 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-xs">{t.full_name}</p>
                              <span className="text-[10px] text-slate-400">{t.subject} ({t.phone})</span>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => { 
                                  setModalData({
                                    ...t,
                                    branch_ids: branches.length > 0 ? [Number(branches[0].id)] : []
                                  }); 
                                  setIsEditing(true); 
                                  setModalType('teacher'); 
                                }}
                                className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                title="Filialga biriktirish"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTeacher(t.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                title="O'chirish"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. O'QUVCHILAR BO'LIMI */}
        {activeTab === 'students' && (
          <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold">O‘quvchilar Boshqaruvi</h3>
                <p className="text-xs text-slate-400">Jami: {filteredStudents.length} ta o‘quvchi</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopyAllPhones}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
                >
                  <Copy size={14} /> <span className="hidden sm:inline">Raqamlarni Olish</span>
                </button>
                <button
                  onClick={() => setIsDocxModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  <FileText size={15} /> <span>DOCX / Guruh Import</span>
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
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  <Plus size={15} /> Yagona Qo‘shish
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredStudents.map(s => {
                const studentGroup = groups.find(g => g.id === s.group_id);
                const teacher = teachers.find(t => t.id === studentGroup?.teacher_id);
                const level = levels.find(l => l.id === studentGroup?.level_id);

                return (
                  <div key={s.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <div className="overflow-hidden pr-2">
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
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
              </div>

              {/* Guruhlar kesimida to'lovlar */}
              <div className="space-y-6">
                {filteredGroups.map(group => {
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
                                        monthly_fee: group.monthly_fee
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

        {/* 8. SMS XABARNOMA BO'LIMI */}
        {activeTab === 'sms' && (
          <div className="space-y-6">
            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <MessageSquare size={20} />
                <h3 className="text-base sm:text-lg font-bold">SMS Xabarnoma Tizimi</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Dinamik teglardan foydalaning:</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[11px] bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 px-2 py-1 rounded font-mono">&#123;ism&#125;</span>
                <span className="text-[11px] bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300 px-2 py-1 rounded font-mono">&#123;guruh&#125;</span>
                <span className="text-[11px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-1 rounded font-mono">&#123;summa&#125;</span>
                <span className="text-[11px] bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300 px-2 py-1 rounded font-mono">&#123;oy&#125;</span>
              </div>

              <div className="space-y-4 max-w-2xl">
                <div>
                  <textarea
                    rows="4"
                    value={smsTemplate}
                    onChange={(e) => setSmsTemplate(e.target.value)}
                    className={`w-full p-3 rounded-xl border outline-none text-xs sm:text-sm font-medium leading-relaxed ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>

                <button 
                  onClick={() => {
                    const debtors = filteredStudents.filter(s => s.debt > 0);
                    if (debtors.length === 0) {
                      alert("Qarzdor o'quvchilar yo'q!");
                      return;
                    }
                    const smsList = debtors.map(s => `Kimga: ${s.parent_phone !== '-' ? s.parent_phone : s.phone} (${s.full_name})\nMatn: ${generateSmsText(s)}`).join('\n\n---\n\n');
                    alert(`Barcha qarzdorlarga SMS yuborildi!\n\nNamuna xabarlar:\n\n${smsList}`);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow"
                >
                  <Send size={15} /> Qarzdorlarga SMS Yuborish ({filteredStudents.filter(s => s.debt > 0).length} ta)
                </button>
              </div>
            </div>

            {/* Jonli SMS Ko'rinishi */}
            <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-4 text-emerald-600 font-bold text-sm sm:text-base">
                <Eye size={18} />
                <h4>Shakllanadigan SMS Xabarlar</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.filter(s => s.debt > 0).map(s => {
                  const studentGroup = groups.find(g => g.id === s.group_id);
                  const generatedMsg = generateSmsText(s);
                  const contact = s.parent_phone !== '-' ? s.parent_phone : s.phone;

                  return (
                    <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between gap-2.5">
                      <div>
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{s.full_name}</span>
                          <span>{contact}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200">
                          {generatedMsg}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                        <span className="text-blue-600 font-medium truncate">{studentGroup?.name}</span>
                        <button
                          onClick={() => alert(`SMS yuborildi (${contact}):\n\n"${generatedMsg}"`)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 shrink-0"
                        >
                          <Send size={11} /> Yuborish
                        </button>
                      </div>
                    </div>
                  );
                })}
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

            {/* Oxirgi to'lovlar jadvali */}
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

            {/* Filial Qo'shish */}
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

      {/* DOCX / GURUH INTELLEKTUAL IMPORT MODALI */}
      {isDocxModalOpen && (
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

              {/* Faqat 1 ta raqam bo'lsa kimga tegishli deb hisoblansin? */}
              <div className="p-3 bg-blue-50/50 dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 rounded-xl">
                <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">
                  Agar o'quvchida faqat 1 ta raqam yozilgan bo'lsa:
                </label>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="singlePhoneRole" 
                      value="parent" 
                      checked={singlePhoneRole === 'parent'} 
                      onChange={() => setSinglePhoneRole('parent')} 
                    />
                    <span>Ota-onasining raqami deb olish (Tavsiya)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="singlePhoneRole" 
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
                <p className="text-[11px] text-slate-400 mt-1">
                  * Algoritm har bir qatordan ism, 1-raqam va 2-raqamni avtomatik topib tozalab ajratadi.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsDocxModalOpen(false)} className="px-3.5 py-2 text-slate-400 text-xs sm:text-sm">Bekor qilish</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow">Barcha O‘quvchilarni Qo‘shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <input required type="text" value={modalData.full_name || ''} onChange={e => setModalData({...modalData, full_name: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Biriktirilgan Guruh</label>
                    <select 
                      value={modalData.group_id || groups[0]?.id || ''} 
                      onChange={e => setModalData({...modalData, group_id: e.target.value})} 
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
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Ota-onasi Telefoni (SMS va Aloqa uchun)</label>
                    <input type="text" placeholder="+998..." value={modalData.parent_phone === '-' ? '' : (modalData.parent_phone || '')} onChange={e => setModalData({...modalData, parent_phone: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">O‘quvchining Shaxsiy Telefoni (Mavjud bo'lsa)</label>
                    <input type="text" placeholder="+998..." value={modalData.phone === '-' ? '' : (modalData.phone || '')} onChange={e => setModalData({...modalData, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Qarzdorlik summasi ({systemSettings.currency})</label>
                    <input type="number" value={modalData.debt || 0} onChange={e => setModalData({...modalData, debt: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                </>
              )}

              {modalType === 'teacher' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">F.I.O</label>
                    <input required type="text" value={modalData.full_name || ''} onChange={e => setModalData({...modalData, full_name: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Fani / Yo‘nalishi</label>
                    <input required type="text" value={modalData.subject || ''} onChange={e => setModalData({...modalData, subject: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Telefon Raqami</label>
                    <input required type="text" value={modalData.phone || ''} onChange={e => setModalData({...modalData, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ishlaydigan Filiallari (Bir nechtasini tanlash mumkin):</label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 border rounded-xl dark:border-slate-700">
                      {branches.map(b => {
                        const isChecked = (modalData.branch_ids || [modalData.branch_id]).includes(b.id);
                        return (
                          <label key={b.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTeacherBranchSelection(b.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{b.name}</span>
                          </label>
                        );
                      })}
                    </div>
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
                        const isChecked = (modalData.days || []).includes(day.id);
                        return (
                          <button
                            type="button"
                            key={day.id}
                            onClick={() => toggleDaySelection(day.id)}
                            className={`px-1.5 py-1 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                              isChecked 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {isChecked && <Check size={11} />}
                            <span>{day.id}</span>
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
                    <input required type="number" value={modalData.monthly_fee || 0} onChange={e => setModalData({...modalData, monthly_fee: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none text-xs sm:text-sm" />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setModalType(null)} className="px-3.5 py-2 text-slate-400 text-xs sm:text-sm">Bekor qilish</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold">Saqlash</button>
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
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-400">Summa:</span>
                <span className="font-semibold text-emerald-500">{paymentModalData.monthly_fee?.toLocaleString()} {systemSettings.currency}</span>
              </div>

              {/* Qaysi oy uchun */}
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

              {/* To'lov amalga oshirilgan aniq sana */}
              <div className="py-1.5">
                <label className="block text-slate-400 text-xs mb-1 font-medium">To‘lov qilingan aniq sana (Kvitansiya sanasi):</label>
                <div className="relative">
                  <input
                    type="date"
                    value={paymentCustomDate}
                    onChange={(e) => setPaymentCustomDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs sm:text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300'}`}
                  />
                </div>
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow"
              >
                To‘lovni Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
