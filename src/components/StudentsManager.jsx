import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { generateStudentReportDocx } from '../utils/exportDocx';
import StudentProfileModal from './StudentProfileModal';

export default function StudentsManager({ students, groups, refreshData }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  const [activeProfileStudent, setActiveProfileStudent] = useState(null);
  const [manualSmsDate, setManualSmsDate] = useState('');

  // DAVOMAT UCHUN SANA VA MA'LUMOTLAR HOLATI
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState({}); // { studentId: 'kelgan' | 'kelmagan' }

  const filtered = students.filter(s => statusFilter === 'all' ? true : (s.status || 'active') === statusFilter);

  // SANAGA QARAB SUPABASE'DAN DAVOMATNI YUKLASH (Tarixni ko'rish)
  useEffect(() => {
    const fetchAttendance = async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('date', selectedDate);
      
      if (!error && data) {
        const attMap = {};
        data.forEach(item => { attMap[item.student_id] = item.status; });
        setAttendanceState(attMap);
      }
    };
    fetchAttendance();
  }, [selectedDate]);

  // DAVOMATNI EKRANDA BELGILASH (+ / -)
  const toggleAttendance = (studentId, status) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  // DAVOMATNI SUPABASE'GA SAQLASH (Barcha qurilmalar uchun)
  const handleSaveAttendance = async () => {
    setLoading(true);
    const studentIds = Object.keys(attendanceState);
    
    if (studentIds.length === 0) {
      alert("Hech qanday davomat belgilanmagan!");
      setLoading(false);
      return;
    }

    try {
      // 1. Shu sanadagi eski belgilarni tozalash (dublikat bo'lmasligi uchun)
      await supabase
        .from('attendance')
        .delete()
        .eq('date', selectedDate)
        .in('student_id', studentIds);

      // 2. Yangi holatni yozish
      const insertData = studentIds.map(id => ({
        student_id: id,
        date: selectedDate,
        status: attendanceState[id]
      }));

      const { error } = await supabase.from('attendance').insert(insertData);

      if (error) throw error;
      alert(`${selectedDate} sanasi uchun davomat muvaffaqiyatli saqlandi!`);
    } catch (error) {
      console.error(error);
      alert("Xatolik: Davomat saqlanmadi.");
    } finally {
      setLoading(false);
    }
  };

  // Checkbox boshqaruvi
  const handleSelectAll = (e) => setSelectedIds(e.target.checked ? filtered.map(s => s.id) : []);
  const handleSelectOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleBulkStatus = async (status) => {
    if (!window.confirm(`${selectedIds.length} ta o'quvchi statusini o'zgartirasizmi?`)) return;
    setLoading(true);
    await supabase.from('students').update({ status }).in('id', selectedIds);
    setLoading(false);
    setSelectedIds([]);
    refreshData();
  };

  const handleBulkMove = async (targetGroupId) => {
    if (!targetGroupId || !window.confirm(`${selectedIds.length} ta o'quvchini ko'chirasizmi?`)) return;
    setLoading(true);
    const targetGroup = groups.find(g => g.id.toString() === targetGroupId.toString());
    await supabase.from('students').update({ group_id: targetGroupId }).in('id', selectedIds);
    const historyEntries = selectedIds.map(stId => ({
      student_id: stId,
      group_id: targetGroupId,
      group_name: targetGroup ? targetGroup.name : 'Yangi guruh',
      joined_at: new Date().toISOString()
    }));
    await supabase.from('student_group_history').insert(historyEntries);
    setLoading(false);
    setSelectedIds([]);
    refreshData();
  };

  const handleBulkSetSmsDate = async () => {
    if (!manualSmsDate) return alert("Iltimos, sanani tanlang!");
    setLoading(true);
    await supabase.from('students').update({ sms_scheduled_date: manualSmsDate }).in('id', selectedIds);
    setLoading(false);
    alert(`${selectedIds.length} ta o'quvchi uchun SMS sanasi ${manualSmsDate} ga belgilandi.`);
    setSelectedIds([]);
    refreshData();
  };

  return (
    <div className="space-y-4">
      {/* Yuqori Filtrlar, Kalendar va Davomat Saqlash */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border">
        <div className="flex gap-2">
          <button onClick={() => setStatusFilter('active')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Faollar</button>
          <button onClick={() => setStatusFilter('graduated')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === 'graduated' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>Arxiv (Bitirganlar)</button>
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Hammasi</button>
        </div>

        {/* DAVOMAT KALENDARI VA SAQLASH TUGMASI */}
        <div className="flex flex-wrap items-center gap-3 border-l pl-4 border-gray-200">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-gray-300 rounded-lg text-sm px-3 py-1.5 font-medium text-gray-700 shadow-sm outline-none ring-blue-500 focus:ring-2"
          />
          <button
            onClick={handleSaveAttendance}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Saqlanmoqda...' : '💾 Davomatni saqlash'}
          </button>
          <button
            onClick={() => generateStudentReportDocx(`Eduflow CRM - ${statusFilter.toUpperCase()} O'quvchilar Ro'yxati`, filtered)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            📄 DOCX
          </button>
        </div>
      </div>

      {/* Multitanlov Paneli (Checkbox bosilganda paydo bo'ladi) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <span className="text-sm font-bold text-indigo-900">Tanlandi: {selectedIds.length} ta o‘quvchi</span>
          <div className="flex flex-wrap items-center gap-2">
            <select disabled={loading} onChange={(e) => { handleBulkMove(e.target.value); e.target.value = ""; }} defaultValue="" className="bg-white border text-sm rounded-lg px-2.5 py-1.5">
              <option value="" disabled>Guruhga o‘tkazish...</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
              <input type="date" value={manualSmsDate} onChange={(e) => setManualSmsDate(e.target.value)} className="text-xs text-gray-700 outline-none" />
              <button onClick={handleBulkSetSmsDate} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded">SMS kunini qo‘yish</button>
            </div>
            <button onClick={() => handleBulkStatus(statusFilter === 'graduated' ? 'active' : 'graduated')} className="bg-gray-700 hover:bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg">
              {statusFilter === 'graduated' ? 'Faollashtirish' : 'Arxivga olish'}
            </button>
          </div>
        </div>
      )}

      {/* Jadval */}
      <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
        <table className="min-w-full text-sm text-left divide-y">
          <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
            <tr>
              <th className="p-3 w-4"><input type="checkbox" checked={filtered.length > 0 && selectedIds.length === filtered.length} onChange={handleSelectAll} className="rounded border-gray-300 text-blue-600" /></th>
              <th className="p-3">F.I.SH</th>
              <th className="p-3">Telefon</th>
              <th className="p-3">Guruh</th>
              <th className="p-3 text-center bg-blue-50 border-x">Davomat</th>
              <th className="p-3">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {filtered.map(st => (
              <tr key={st.id} className="hover:bg-gray-50 transition">
                <td className="p-3"><input type="checkbox" checked={selectedIds.includes(st.id)} onChange={() => handleSelectOne(st.id)} className="rounded border-gray-300 text-blue-600" /></td>
                <td className="p-3 font-medium text-gray-900">{st.full_name}</td>
                <td className="p-3">{st.phone}</td>
                <td className="p-3">{st.groups?.name || 'Guruhsiz'}</td>
                
                {/* DAVOMAT TUGMALARI */}
                <td className="p-3 bg-blue-50/30 border-x align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => toggleAttendance(st.id, 'kelgan')}
                      className={`px-3 py-1 text-xs font-bold rounded shadow-sm border transition-all ${attendanceState[st.id] === 'kelgan' ? 'bg-green-500 text-white border-green-600 scale-105' : 'bg-white text-gray-500 hover:bg-green-50'}`}
                    >
                      ✓ Keldi
                    </button>
                    <button 
                      onClick={() => toggleAttendance(st.id, 'kelmagan')}
                      className={`px-3 py-1 text-xs font-bold rounded shadow-sm border transition-all ${attendanceState[st.id] === 'kelmagan' ? 'bg-red-500 text-white border-red-600 scale-105' : 'bg-white text-gray-500 hover:bg-red-50'}`}
                    >
                      ✕ Yo'q
                    </button>
                  </div>
                </td>

                <td className="p-3">
                  <button onClick={() => setActiveProfileStudent(st)} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded hover:bg-blue-100 font-medium">Profil / Tarix</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeProfileStudent && (
        <StudentProfileModal student={activeProfileStudent} onClose={() => setActiveProfileStudent(null)} />
      )}
    </div>
  );
}