import React, { useState } from 'react';
import { 
  Building2, Users, GraduationCap, CheckSquare, 
  CreditCard, Settings, Moon, Sun, Edit2, Trash2, Plus, Check, Send, 
  AlertCircle, BookOpen, UserCheck, MessageSquare, Download, Copy, Save, 
  ChevronRight, Search, Filter, Layers, Eye, LogOut, Lock, User
} from 'lucide-react';

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
  // Autentifikatsiya holati
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('eduflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Filiallar
  const [branches, setBranches] = useState([
    { id: 1, name: "1-Filial (Markaziy)" },
    { id: 2, name: "2-Filial (Gʻarbiy)" }
  ]);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [newBranchName, setNewBranchName] = useState('');

  // Dinamik Guruh Darajalari
  const [levels, setLevels] = useState([
    { id: 1, name: "Beginner (A1)" },
    { id: 2, name: "Elementary (A2)" },
    { id: 3, name: "Intermediate (B1)" },
    { id: 4, name: "Upper-Intermediate (B2)" },
    { id: 5, name: "Advanced / IELTS" }
  ]);
  const [newLevelName, setNewLevelName] = useState('');
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [editLevelName, setEditLevelName] = useState('');

  // O'qituvchilar
  const [teachers, setTeachers] = useState([
    { id: 1, branch_id: 1, full_name: "Bobur Usmonov", subject: "IELTS & General English", phone: "+998901112233" },
    { id: 2, branch_id: 2, full_name: "Zilola Ergasheva", subject: "Kids English & B1", phone: "+998935556677" },
    { id: 3, branch_id: 1, full_name: "Sanjar Qodirov", subject: "Web Development", phone: "+998978889900" }
  ]);

  // Guruhlar
  const [groups, setGroups] = useState([
    { id: 1, branch_id: 1, teacher_id: 1, level_id: 5, name: "IELTS Intensive", days: ["Du", "Chor", "Ju"], time: "14:00 - 16:00", monthly_fee: 450000 },
    { id: 2, branch_id: 2, teacher_id: 2, level_id: 3, name: "General English B1", days: ["Se", "Pay", "Shan"], time: "10:00 - 12:00", monthly_fee: 400000 },
    { id: 3, branch_id: 1, teacher_id: 3, level_id: 4, name: "Front-end React", days: ["Du", "Chor", "Ju"], time: "18:00 - 20:00", monthly_fee: 600000 },
    { id: 4, branch_id: 1, teacher_id: 1, level_id: 2, name: "Grammar Starter", days: ["Se", "Pay", "Shan"], time: "16:00 - 18:00", monthly_fee: 380000 }
  ]);

  // O'quvchilar
  const [students, setStudents] = useState([
    { id: 1, branch_id: 1, group_id: 1, full_name: "Aziz Rahimov", phone: "+998901234567", parent_phone: "+998909876543", debt: 450000, joined_date: "2026-01-10" },
    { id: 2, branch_id: 1, group_id: 1, full_name: "Madina Aliyeva", phone: "+998911112233", parent_phone: "+998919998877", debt: 0, joined_date: "2026-01-15" },
    { id: 3, branch_id: 2, group_id: 2, full_name: "Javohir Toshmatov", phone: "+998934445566", parent_phone: "+998938887766", debt: 400000, joined_date: "2026-02-01" },
    { id: 4, branch_id: 1, group_id: 3, full_name: "Rustam Karimov", phone: "+998941231122", parent_phone: "+998945554433", debt: 600000, joined_date: "2026-02-10" }
  ]);

  // Guruh qidirish filtrlari
  const [finderBranch, setFinderBranch] = useState('ALL');
  const [finderLevel, setFinderLevel] = useState('ALL');
  const [finderDay, setFinderDay] = useState('ALL');
  const [finderSearch, setFinderSearch] = useState('');

  // Tizim sozlamalari
  const [systemSettings, setSystemSettings] = useState({
    centerName: "EduFlow O‘quv Markazi",
    currency: "so'm",
    smsReminderDay: 5,
  });

  // Davomat holati
  const [attendanceGroupId, setAttendanceGroupId] = useState(1);
  const [attendance, setAttendance] = useState({});

  // To'lov modali
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS_LIST[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // SMS Shablon
  const [smsTemplate, setSmsTemplate] = useState("Hurmatli ota-ona! {ism}ning \"{guruh}\" kursi bo'yicha to'lov muddati keldi. Oylik to'lov summasi: {summa}. Iltimos, o'z vaqtida to'lovni amalga oshirishingizni so'raymiz.");

  // Modallar holati
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Login qilish funksiyasi
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
      setLoginError("Login yoki parol noto'g'ri! (Sinov uchun: admin / admin123)");
    }
  };

  // Chiqish funksiyasi
  const handleLogout = () => {
    if (confirm("Haqiqatan ham tizimdan chiqmoqchimisiz?")) {
      localStorage.removeItem('eduflow_user');
      setCurrentUser(null);
    }
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
    : teachers.filter(t => t.branch_id === parseInt(selectedBranch));

  const attendanceStudents = students.filter(s => s.group_id === parseInt(attendanceGroupId));

  // Guruh qidiruv natijalari
  const searchMatchedGroups = groups.filter(g => {
    const matchBranch = finderBranch === 'ALL' || g.branch_id === Number(finderBranch);
    const matchLevel = finderLevel === 'ALL' || g.level_id === Number(finderLevel);
    const matchDay = finderDay === 'ALL' || g.days?.includes(finderDay);
    const matchText = g.name.toLowerCase().includes(finderSearch.toLowerCase()) || 
                      teachers.find(t => t.id === g.teacher_id)?.full_name.toLowerCase().includes(finderSearch.toLowerCase());
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

  const handleDeleteStudent = (id) => {
    if (confirm("Haqiqatan ham bu o'quvchini o'chirmoqchimisiz?")) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleDeleteTeacher = (id) => {
    if (confirm("Haqiqatan ham bu o'qituvchini o'chirmoqchimisiz?")) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const handleDeleteGroup = (id) => {
    if (confirm("Haqiqatan ham bu guruhni o'chirmoqchimisiz?")) {
      setGroups(groups.filter(g => g.id !== id));
    }
  };

  const handleAddBranch = (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    setBranches([...branches, { id: Date.now(), name: newBranchName }]);
    setNewBranchName('');
    alert("Yangi filial muvaffaqiyatli qo'shildi!");
  };

  const handleAddLevel = (e) => {
    e.preventDefault();
    if (!newLevelName.trim()) return;
    setLevels([...levels, { id: Date.now(), name: newLevelName }]);
    setNewLevelName('');
  };

  const handleDeleteLevel = (id) => {
    if (confirm("Bu darajani o'chirmoqchimisiz?")) {
      setLevels(levels.filter(l => l.id !== id));
    }
  };

  const handleOpenGroupSettings = (group) => {
    setModalData(group);
    setIsEditing(true);
    setModalType('group');
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (modalType === 'student') {
      const selectedG = groups.find(g => g.id === Number(modalData.group_id || 1));
      const branchId = selectedG ? selectedG.branch_id : Number(modalData.branch_id || 1);

      if (isEditing) {
        setStudents(students.map(s => s.id === modalData.id ? { 
          ...modalData, 
          branch_id: branchId, 
          group_id: Number(modalData.group_id), 
          debt: Number(modalData.debt) 
        } : s));
      } else {
        setStudents([...students, { 
          ...modalData, 
          id: Date.now(), 
          branch_id: branchId, 
          group_id: Number(modalData.group_id || groups[0]?.id || 1), 
          debt: Number(modalData.debt || 0), 
          joined_date: new Date().toISOString().split('T')[0] 
        }]);
      }
    } else if (modalType === 'teacher') {
      if (isEditing) {
        setTeachers(teachers.map(t => t.id === modalData.id ? { ...modalData, branch_id: Number(modalData.branch_id) } : t));
      } else {
        setTeachers([...teachers, { ...modalData, id: Date.now(), branch_id: Number(modalData.branch_id || 1) }]);
      }
    } else if (modalType === 'group') {
      if (isEditing) {
        setGroups(groups.map(g => g.id === modalData.id ? { 
          ...modalData, 
          branch_id: Number(modalData.branch_id), 
          teacher_id: Number(modalData.teacher_id),
          level_id: Number(modalData.level_id || levels[0]?.id),
          days: modalData.days || [],
          monthly_fee: Number(modalData.monthly_fee) 
        } : g));
      } else {
        setGroups([...groups, { 
          ...modalData, 
          id: Date.now(), 
          branch_id: Number(modalData.branch_id || 1), 
          teacher_id: Number(modalData.teacher_id || teachers[0]?.id || 1),
          level_id: Number(modalData.level_id || levels[0]?.id || 1),
          days: modalData.days || ['Du', 'Chor', 'Ju'],
          monthly_fee: Number(modalData.monthly_fee || 400000) 
        }]);
      }
    }
    setModalType(null);
  };

  const handleCopyAllPhones = () => {
    const phones = filteredStudents.map(s => `${s.full_name}: ${s.phone} (Ota-ona: ${s.parent_phone})`).join('\n');
    navigator.clipboard.writeText(phones);
    alert("Barcha o'quvchilar va ularning ota-onalari telefon raqamlari nusxalandi!");
  };

  const exportToExcel = (dataType) => {
    let headers = [];
    let rows = [];
    let filename = "";

    if (dataType === 'students') {
      filename = "oquvchilar_hisoboti.csv";
      headers = ["ID", "F.I.O", "Guruh", "Darajasi", "Telefon", "Ota-onasi tel", "Qarzdorlik", "Sana"];
      rows = filteredStudents.map(s => {
        const gr = groups.find(g => g.id === s.group_id);
        const lvl = levels.find(l => l.id === gr?.level_id);
        return [
          s.id, 
          s.full_name, 
          gr?.name || '-',
          lvl?.name || '-',
          s.phone, 
          s.parent_phone, 
          s.debt, 
          s.joined_date
        ];
      });
    } else if (dataType === 'payments') {
      filename = "tolovlar_hisoboti.csv";
      headers = ["ID", "F.I.O", "Filial", "Holati", "Summa (som)"];
      rows = filteredStudents.map(s => [
        s.id, 
        s.full_name, 
        branches.find(b => b.id === s.branch_id)?.name || '-', 
        s.debt > 0 ? "Qarzdor" : "To'langan", 
        s.debt
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

  // ----------------------------------------------------
  // AGAR FOYDALANUVCHI KIRMAGAN BO'LSA: LOGIN OYNASI
  // ----------------------------------------------------
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

          <div className="mt-6 text-center text-xs text-slate-500">
            Sinov login: <b className="text-slate-400">admin</b> | Parol: <b className="text-slate-400">admin123</b>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ASOSIY CRM TIZIMI
  // ----------------------------------------------------
  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Chap Menyu (Sidebar) */}
      <aside className={`w-64 border-r p-5 flex flex-col justify-between shrink-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">E</div>
            <div>
              <h1 className="font-bold text-lg leading-none">{systemSettings.centerName.split(' ')[0] || 'EduFlow'}</h1>
              <span className="text-xs text-blue-500 font-medium">CRM Tizimi</span>
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
                  onClick={() => setActiveTab(item.id)}
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

        {/* Quyi qism: Rejim + Foydalanuvchi + Chiqish */}
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

          {/* Foydalanuvchi profili va Logout */}
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

      {/* Asosiy qism */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold capitalize">{activeTab === 'finder' ? 'Yangi O‘quvchilarga Guruh Topish' : `${activeTab} bo‘limi`}</h2>
            <p className="text-sm text-slate-500">Filiallar, guruhlar va o‘quv markazini boshqarish</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Filial:</span>
            <select 
              value={selectedBranch} 
              onChange={(e) => setSelectedBranch(e.target.value)}
              className={`px-4 py-2 rounded-xl border font-medium outline-none transition-all text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div 
                onClick={() => setActiveTab('students')}
                className={`p-6 rounded-2xl border cursor-pointer transform hover:-translate-y-1 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:shadow-lg hover:border-blue-400'}`}
              >
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span className="text-sm">O‘quvchilar</span>
                  <GraduationCap size={20} className="text-blue-500" />
                </div>
                <p className="text-3xl font-bold mt-2 text-blue-600">{filteredStudents.length} ta</p>
                <span className="text-[11px] text-slate-400 mt-2 block">O‘quvchilar bo‘limiga o‘tish →</span>
              </div>

              <div 
                onClick={() => setActiveTab('teachers')}
                className={`p-6 rounded-2xl border cursor-pointer transform hover:-translate-y-1 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-purple-500' : 'bg-white border-slate-200 hover:shadow-lg hover:border-purple-400'}`}
              >
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span className="text-sm">O‘qituvchilar</span>
                  <UserCheck size={20} className="text-purple-500" />
                </div>
                <p className="text-3xl font-bold mt-2 text-purple-600">{filteredTeachers.length} ta</p>
                <span className="text-[11px] text-slate-400 mt-2 block">O‘qituvchilar ro‘yxatiga o‘tish →</span>
              </div>

              <div 
                onClick={() => setActiveTab('groups')}
                className={`p-6 rounded-2xl border cursor-pointer transform hover:-translate-y-1 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-emerald-500' : 'bg-white border-slate-200 hover:shadow-lg hover:border-emerald-400'}`}
              >
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span className="text-sm">Faol Guruhlar</span>
                  <BookOpen size={20} className="text-emerald-500" />
                </div>
                <p className="text-3xl font-bold mt-2 text-emerald-600">{filteredGroups.length} ta</p>
                <span className="text-[11px] text-slate-400 mt-2 block">Guruhlar bo‘limiga o‘tish →</span>
              </div>

              <div 
                onClick={() => setActiveTab('payments')}
                className={`p-6 rounded-2xl border cursor-pointer transform hover:-translate-y-1 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-rose-500' : 'bg-white border-slate-200 hover:shadow-lg hover:border-rose-400'}`}
              >
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span className="text-sm">Qarzdorliklar</span>
                  <CreditCard size={20} className="text-rose-500" />
                </div>
                <p className="text-3xl font-bold mt-2 text-rose-500">
                  {filteredStudents.filter(s => s.debt > 0).length} ta
                </p>
                <span className="text-[11px] text-slate-400 mt-2 block">To‘lovlar jadvaliga o‘tish →</span>
              </div>

            </div>

            {/* Filiallar */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-bold mb-4">Filiallar Ro‘yxati</h3>
              <div className="space-y-3">
                {branches.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    {editingBranchId === b.id ? (
                      <div className="flex items-center gap-3 flex-1 mr-4">
                        <input
                          type="text"
                          value={editBranchName}
                          onChange={(e) => setEditBranchName(e.target.value)}
                          className={`w-full px-3 py-1.5 rounded-lg border outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                        />
                        <button 
                          onClick={() => {
                            setBranches(branches.map(br => br.id === b.id ? { ...br, name: editBranchName } : br));
                            setEditingBranchId(null);
                          }}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold">{b.name}</p>
                      </div>
                    )}
                    {editingBranchId !== b.id && (
                      <button 
                        onClick={() => { setEditingBranchId(b.id); setEditBranchName(b.name); }}
                        className="p-2 text-slate-400 hover:text-blue-500 rounded-lg"
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
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold text-lg">
                <Filter size={20} />
                <h3>Yangi O‘quvchi Talablari Bo‘yicha Guruh Izlash</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Filial</label>
                  <select 
                    value={finderBranch} 
                    onChange={e => setFinderBranch(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none font-medium ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value="ALL">Barcha Filiallar</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Kurs Darajasi</label>
                  <select 
                    value={finderLevel} 
                    onChange={e => setFinderLevel(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none font-medium ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value="ALL">Barcha Darajalar</option>
                    {levels.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Qulay Hafta Kuni</label>
                  <select 
                    value={finderDay} 
                    onChange={e => setFinderDay(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none font-medium ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                  >
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

            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-base">Mos Keladigan Guruhlar ({searchMatchedGroups.length} ta topildi)</h3>
              </div>

              {searchMatchedGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchMatchedGroups.map(g => {
                    const teacher = teachers.find(t => t.id === g.teacher_id);
                    const level = levels.find(l => l.id === g.level_id);
                    const groupStudentsCount = students.filter(s => s.group_id === g.id).length;

                    return (
                      <div key={g.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              {level?.name || 'Darajasiz'}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {branches.find(b => b.id === g.branch_id)?.name}
                            </span>
                          </div>
                          
                          <h4 className="text-lg font-bold mt-2">{g.name}</h4>
                          <p className="text-sm text-slate-500 mt-1">
                            O‘qituvchi: <span className="font-semibold text-slate-700 dark:text-slate-200">{teacher?.full_name}</span>
                          </p>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Kunlar: <b className="text-slate-800 dark:text-slate-200">{g.days?.join(', ')}</b> ({g.time})</span>
                            <span className="font-bold text-blue-500">{groupStudentsCount} ta o‘quvchi</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-emerald-600 text-sm">{g.monthly_fee?.toLocaleString()} {systemSettings.currency} / oy</span>
                            <button
                              onClick={() => {
                                setModalData({ 
                                  full_name: '', 
                                  phone: '+998', 
                                  parent_phone: '+998', 
                                  debt: 0, 
                                  group_id: g.id 
                                });
                                setIsEditing(false);
                                setModalType('student');
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow"
                            >
                              + Shu Guruhga O‘quvchi Qo‘shish
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p>Berilgan talablarga mos guruh topilmadi.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. DAVOMAT BO'LIMI */}
        {activeTab === 'attendance' && (
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold">Guruh Davomati</h3>
                <p className="text-xs text-slate-400">Kerakli guruhni tanlab davomatni belgilang</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Guruh:</span>
                <select 
                  value={attendanceGroupId}
                  onChange={(e) => setAttendanceGroupId(Number(e.target.value))}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300'}`}
                >
                  {filteredGroups.map(g => {
                    const teacher = teachers.find(t => t.id === g.teacher_id);
                    return (
                      <option key={g.id} value={g.id}>{g.name} ({teacher?.full_name || 'Ustoz biriktirilmagan'})</option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-sm">
                    <th className="pb-3 font-medium">O‘quvchi</th>
                    <th className="pb-3 font-medium">Telefon</th>
                    <th className="pb-3 font-medium text-center">Bugungi Davomat (+ / -)</th>
                    <th className="pb-3 font-medium text-right">Amallar</th>
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
                          <td className="py-4 font-semibold">{student.full_name}</td>
                          <td className="py-4 text-sm text-slate-400">{student.phone}</td>
                          <td className="py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleAttendance(attendanceGroupId, student.id, '+')}
                                className={`w-9 h-9 rounded-lg font-bold transition-all ${
                                  attStatus === '+' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-emerald-500'
                                }`}
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleAttendance(attendanceGroupId, student.id, '-')}
                                className={`w-9 h-9 rounded-lg font-bold transition-all ${
                                  attStatus === '-' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-rose-500'
                                }`}
                              >
                                -
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => {
                                setPaymentModalData({
                                  student_id: student.id,
                                  student_name: student.full_name,
                                  group_name: studentGroup?.name || 'Asosiy guruh',
                                  monthly_fee: studentGroup?.monthly_fee || 450000
                                });
                                setSelectedMonth(MONTHS_LIST[new Date().getMonth()]);
                                setSelectedYear(currentYear);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                            >
                              To‘lov Qabul Qilish
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-slate-400 text-sm">Ushbu guruhda hali o‘quvchilar mavjud emas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. GURUHLAR BO'LIMI */}
        {activeTab === 'groups' && (
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Guruhlar Boshqaruvi</h3>
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                <Plus size={16} /> Guruh Qo‘shish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroups.map(g => {
                const teacher = teachers.find(t => t.id === g.teacher_id);
                const level = levels.find(l => l.id === g.level_id);
                const groupStudentsCount = students.filter(s => s.group_id === g.id).length;

                return (
                  <div key={g.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                            {branches.find(b => b.id === g.branch_id)?.name || 'Filial'}
                          </span>
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                            {level?.name || 'Darajasiz'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setModalData(g); setIsEditing(true); setModalType('group'); }}
                            className="text-slate-400 hover:text-blue-500 p-1"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGroup(g.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold mt-2">{g.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        O‘qituvchi: <span className="font-semibold text-slate-700 dark:text-slate-300">{teacher?.full_name || 'Biriktirilmagan'}</span>
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1 border-t pt-3 border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between">
                        <span>Kunlar: <b className="text-slate-700 dark:text-slate-300">{g.days?.join(', ') || 'Belgilanmagan'}</b> ({g.time})</span>
                        <span className="font-semibold text-blue-500">{groupStudentsCount} ta o‘quvchi</span>
                      </div>
                      <p>Oylik to‘lov: {g.monthly_fee?.toLocaleString()} {systemSettings.currency}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. O'QITUVCHILAR BO'LIMI */}
        {activeTab === 'teachers' && (
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">O‘qituvchilar Ro‘yxati</h3>
                <p className="text-xs text-slate-400">Guruh sozlamalarini ochish uchun guruh nomi ustiga bosing</p>
              </div>
              <button
                onClick={() => {
                  setModalData({ full_name: '', subject: '', phone: '+998', branch_id: branches[0]?.id || 1 });
                  setIsEditing(false);
                  setModalType('teacher');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
              >
                <Plus size={16} /> O‘qituvchi Qo‘shish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {filteredTeachers.map(t => {
                const teacherGroups = groups.filter(g => g.teacher_id === t.id);

                return (
                  <div key={t.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center font-bold text-purple-600">
                          {t.full_name?.charAt(0)}
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => { setModalData(t); setIsEditing(true); setModalType('teacher'); }}
                            className="text-slate-400 hover:text-blue-500 p-1"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeacher(t.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-base">{t.full_name}</h4>
                      <p className="text-xs text-blue-500 font-medium">{t.subject}</p>
                      
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 space-y-1">
                        <p>Tel: <span className="font-medium text-slate-700 dark:text-slate-300">{t.phone}</span></p>
                        <p>Filial: <span className="font-medium text-slate-700 dark:text-slate-300">{branches.find(b => b.id === t.branch_id)?.name}</span></p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Faol Guruhlari:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          {teacherGroups.length} ta
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {teacherGroups.length > 0 ? (
                          teacherGroups.map(g => (
                            <button
                              key={g.id}
                              onClick={() => handleOpenGroupSettings(g)}
                              title="Guruh sozlamalarini tahrirlash uchun bosing"
                              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 dark:bg-slate-700 dark:hover:bg-blue-900/40 text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-300 transition-all border border-transparent hover:border-blue-300"
                            >
                              <span>{g.name}</span>
                              <ChevronRight size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Hali guruh biriktirilmagan</span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. O'QUVCHILAR BO'LIMI */}
        {activeTab === 'students' && (
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold">O‘quvchilar Boshqaruvi</h3>
                <p className="text-xs text-slate-400">Jami o‘quvchilar soni: {filteredStudents.length} ta</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyAllPhones}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  <Copy size={15} /> Barcha Raqamlarni Olish
                </button>
                <button
                  onClick={() => {
                    setModalData({ 
                      full_name: '', 
                      phone: '+998', 
                      parent_phone: '+998', 
                      debt: 0, 
                      group_id: groups[0]?.id || 1 
                    });
                    setIsEditing(false);
                    setModalType('student');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  <Plus size={16} /> O‘quvchi Qo‘shish
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredStudents.map(s => {
                const studentGroup = groups.find(g => g.id === s.group_id);
                const level = levels.find(l => l.id === studentGroup?.level_id);

                return (
                  <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{s.full_name}</p>
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded text-[11px] font-semibold">
                          {studentGroup?.name || 'Guruhsiz'} ({level?.name || 'Darajasiz'})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Tel: <span className="font-medium text-slate-700 dark:text-slate-300">{s.phone}</span> | 
                        Ota-onasi: <span className="font-medium text-slate-700 dark:text-slate-300">{s.parent_phone}</span> | 
                        Qo‘shilgan: {s.joined_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium">
                        {branches.find(b => b.id === s.branch_id)?.name}
                      </span>
                      <button 
                        title="Guruhini o'zgartirish yoki ma'lumotlarni tahrirlash"
                        onClick={() => { setModalData(s); setIsEditing(true); setModalType('student'); }}
                        className="text-slate-400 hover:text-blue-500 p-1"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(s.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
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
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="text-lg font-bold mb-4">Qarzdorliklar Ro‘yxati</h3>
            <div className="space-y-4">
              {filteredStudents.map(student => {
                const group = groups.find(g => g.id === student.group_id);
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{student.full_name}</p>
                        <span className="text-xs text-blue-500 font-medium">({group?.name})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Ota-onasi: {student.parent_phone}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-bold ${student.debt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {student.debt > 0 ? `${student.debt.toLocaleString()} ${systemSettings.currency} qarz` : "To'langan"}
                      </span>
                      {student.debt > 0 && (
                        <button 
                          onClick={() => {
                            const customSms = generateSmsText(student);
                            alert(`SMS yuborildi (${student.parent_phone}):\n\n"${customSms}"`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm"
                        >
                          <Send size={13} /> SMS Eslatma
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 8. SMS XABARNOMA BO'LIMI */}
        {activeTab === 'sms' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <MessageSquare size={20} />
                <h3 className="text-lg font-bold">Dinamik SMS Xabarnoma Tizimi</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Shablon ichida teglardan foydalaning. Tizim har bir o‘quvchining guruhi va to‘lov summasini alohida hisoblab, shaxsiy SMS yuboradi.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 px-2 py-1 rounded-md font-mono">&#123;ism&#125;</span>
                <span className="text-xs bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300 px-2 py-1 rounded-md font-mono">&#123;guruh&#125;</span>
                <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-1 rounded-md font-mono">&#123;summa&#125;</span>
                <span className="text-xs bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300 px-2 py-1 rounded-md font-mono">&#123;oy&#125;</span>
              </div>

              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SMS Shablon Matni:</label>
                  <textarea
                    rows="4"
                    value={smsTemplate}
                    onChange={(e) => setSmsTemplate(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border outline-none text-sm font-medium leading-relaxed ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const debtors = filteredStudents.filter(s => s.debt > 0);
                      if (debtors.length === 0) {
                        alert("Qarzdor o'quvchilar mavjud emas!");
                        return;
                      }
                      const smsList = debtors.map(s => `Kimga: ${s.parent_phone} (${s.full_name})\nMatn: ${generateSmsText(s)}`).join('\n\n---\n\n');
                      alert(`Barcha ${debtors.length} ta qarzdorlarga moslashtirilgan shaxsiy SMS yuborildi!\n\nNamuna xabarlar:\n\n${smsList}`);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20"
                  >
                    <Send size={16} /> Barcha Qarzdorlarga SMS Yuborish ({filteredStudents.filter(s => s.debt > 0).length} ta)
                  </button>
                </div>
              </div>
            </div>

            {/* Jonli SMS Ko'rinishi */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-4 text-emerald-600 font-bold text-base">
                <Eye size={18} />
                <h4>Qarzdorlar Uchun Shakllanadigan SMS Xabarlar (Jonli Ko‘rinish)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.filter(s => s.debt > 0).map(s => {
                  const studentGroup = groups.find(g => g.id === s.group_id);
                  const generatedMsg = generateSmsText(s);

                  return (
                    <div key={s.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{s.full_name}</span>
                          <span>Tel: {s.parent_phone}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200">
                          {generatedMsg}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                        <span className="text-blue-600 font-medium">Guruh: {studentGroup?.name} ({studentGroup?.monthly_fee?.toLocaleString()} {systemSettings.currency})</span>
                        <button
                          onClick={() => alert(`SMS yuborildi (${s.parent_phone}):\n\n"${generatedMsg}"`)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm"
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
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="text-lg font-bold mb-2">Hisobotlarni Excel (CSV) Formatida Yuklab Olish</h3>
            <p className="text-xs text-slate-400 mb-6">O‘quvchilar bazasi yoki oylik to‘lovlar hisobotini yuklab oling.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">O‘quvchilar To‘liq Ro‘yxati</h4>
                  <p className="text-xs text-slate-400 mt-1">F.I.O, guruhlari, darajasi, telefon raqamlari</p>
                </div>
                <button
                  onClick={() => exportToExcel('students')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  <Download size={15} /> Excel Yuklash
                </button>
              </div>

              <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">To‘lovlar & Balans Hisoboti</h4>
                  <p className="text-xs text-slate-400 mt-1">Qarzdorlar va to‘langan summalar</p>
                </div>
                <button
                  onClick={() => exportToExcel('payments')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  <Download size={15} /> Excel Yuklash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 10. SOZLAMALAR BO'LIMI */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-bold mb-4">Tizim va Markaz Sozlamalari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
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
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Oylik To‘lov Muddati (Har oyning kuni)</label>
                  <input
                    type="number"
                    value={systemSettings.smsReminderDay}
                    onChange={(e) => setSystemSettings({ ...systemSettings, smsReminderDay: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <button
                onClick={() => alert("Sozlamalar muvaffaqiyatli saqlandi!")}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold mt-5 shadow-md"
              >
                <Save size={16} /> Sozlamalarni Saqlash
              </button>
            </div>

            {/* Guruh Darajalari */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={18} className="text-purple-500" />
                <h3 className="text-lg font-bold">Guruh Darajalari Ro‘yxati (Levels)</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Guruh qo‘shayotganda tanlanadigan dinamik darajalarni boshqaring.</p>

              <form onSubmit={handleAddLevel} className="flex gap-3 max-w-md mb-4">
                <input
                  required
                  type="text"
                  placeholder="Yangi daraja (masalan: Pre-Intermediate)"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl border outline-none text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shrink-0"
                >
                  <Plus size={16} /> Qo‘shish
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {levels.map(lvl => (
                  <div key={lvl.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {editingLevelId === lvl.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editLevelName}
                          onChange={(e) => setEditLevelName(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border dark:bg-slate-700 dark:border-slate-600 outline-none"
                        />
                        <button
                          onClick={() => {
                            setLevels(levels.map(l => l.id === lvl.id ? { ...l, name: editLevelName } : l));
                            setEditingLevelId(null);
                          }}
                          className="p-1 bg-emerald-600 text-white rounded"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold">{lvl.name}</span>
                    )}

                    <div className="flex gap-1">
                      {editingLevelId !== lvl.id && (
                        <button 
                          onClick={() => { setEditingLevelId(lvl.id); setEditLevelName(lvl.name); }}
                          className="p-1 text-slate-400 hover:text-blue-500"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteLevel(lvl.id)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filial Qo'shish */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-bold mb-2">Yangi Filial Ochish</h3>
              <p className="text-xs text-slate-400 mb-4">Markazning yangi filialini qo‘shing.</p>

              <form onSubmit={handleAddBranch} className="flex gap-3 max-w-md">
                <input
                  required
                  type="text"
                  placeholder="Filial nomi (masalan: 3-Filial Sergeli)"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl border outline-none text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0"
                >
                  <Plus size={16} /> Qo‘shish
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* UNIVERSAL QO'SHISH / TAHRIRLASH MODALI */}
      {modalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'} max-h-[90vh] overflow-y-auto`}>
            <h3 className="text-lg font-bold mb-4 capitalize">
              {isEditing ? 'Tahrirlash' : 'Yangi Qo‘shish'}: {modalType === 'student' ? 'O‘quvchi' : modalType === 'teacher' ? 'O‘qituvchi' : 'Guruh'}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-3 text-sm">
              {modalType === 'student' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">F.I.O</label>
                    <input required type="text" value={modalData.full_name || ''} onChange={e => setModalData({...modalData, full_name: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Biriktirilgan Guruh</label>
                    <select 
                      value={modalData.group_id || groups[0]?.id} 
                      onChange={e => setModalData({...modalData, group_id: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none font-medium"
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({branches.find(b => b.id === g.branch_id)?.name}) - {g.monthly_fee?.toLocaleString()} {systemSettings.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">O‘quvchi Telefoni</label>
                    <input required type="text" value={modalData.phone || ''} onChange={e => setModalData({...modalData, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Ota-onasi Telefoni</label>
                    <input required type="text" value={modalData.parent_phone || ''} onChange={e => setModalData({...modalData, parent_phone: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Qarzdorlik summasi ({systemSettings.currency})</label>
                    <input type="number" value={modalData.debt || 0} onChange={e => setModalData({...modalData, debt: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                </>
              )}

              {modalType === 'teacher' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">F.I.O</label>
                    <input required type="text" value={modalData.full_name || ''} onChange={e => setModalData({...modalData, full_name: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Dars beradigan fani / Yo‘nalishi</label>
                    <input required type="text" value={modalData.subject || ''} onChange={e => setModalData({...modalData, subject: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Telefon Raqami</label>
                    <input required type="text" value={modalData.phone || ''} onChange={e => setModalData({...modalData, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Filial</label>
                    <select value={modalData.branch_id || branches[0]?.id} onChange={e => setModalData({...modalData, branch_id: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none">
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {modalType === 'group' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Guruh Nomi</label>
                    <input required type="text" value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Guruh Darajasi (Level)</label>
                    <select 
                      value={modalData.level_id || levels[0]?.id} 
                      onChange={e => setModalData({...modalData, level_id: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none font-medium"
                    >
                      {levels.map(lvl => (
                        <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">O‘qituvchini Tanlang</label>
                    <select 
                      value={modalData.teacher_id || teachers[0]?.id} 
                      onChange={e => setModalData({...modalData, teacher_id: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none font-medium"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dars Kunlari (Bittalab tanlang):</label>
                    <div className="grid grid-cols-4 gap-2">
                      {WEEK_DAYS.map(day => {
                        const isChecked = (modalData.days || []).includes(day.id);
                        return (
                          <button
                            type="button"
                            key={day.id}
                            onClick={() => toggleDaySelection(day.id)}
                            className={`px-2 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                              isChecked 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {isChecked && <Check size={12} />}
                            <span>{day.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Dars Vaqti</label>
                    <input required type="text" placeholder="Masalan: 14:00 - 16:00" value={modalData.time || ''} onChange={e => setModalData({...modalData, time: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Oylik To‘lov Miqdori ({systemSettings.currency})</label>
                    <input required type="number" value={modalData.monthly_fee || 0} onChange={e => setModalData({...modalData, monthly_fee: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Filial</label>
                    <select value={modalData.branch_id || branches[0]?.id} onChange={e => setModalData({...modalData, branch_id: e.target.value})} className="w-full px-3 py-2 rounded-xl border dark:bg-slate-700 dark:border-slate-600 outline-none">
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Bekor qilish</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TO'LOV TASDIQLASH MODALI */}
      {paymentModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 text-blue-500 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">To‘lovni Tasdiqlash</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-400">O‘quvchi:</span>
                <span className="font-semibold">{paymentModalData.student_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-400">Guruh:</span>
                <span className="font-semibold">{paymentModalData.group_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-400">Summa:</span>
                <span className="font-semibold text-emerald-500">{paymentModalData.monthly_fee?.toLocaleString()} {systemSettings.currency}</span>
              </div>

              <div className="py-2">
                <label className="block text-slate-400 text-xs mb-2 font-medium">Qaysi davr uchun to‘lov qabul qilinmoqda?</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Oy:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300'}`}
                    >
                      {MONTHS_LIST.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Yil:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300'}`}
                    >
                      {YEARS_LIST.map((y) => (
                        <option key={y} value={y}>{y}-yil</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setPaymentModalData(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  setStudents(students.map(s => s.id === paymentModalData.student_id ? { ...s, debt: 0 } : s));
                  alert(`To'lov ${selectedMonth} ${selectedYear}-yil uchun muvaffaqiyatli saqlandi!`);
                  setPaymentModalData(null);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20"
              >
                Tasdiqlash va Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}