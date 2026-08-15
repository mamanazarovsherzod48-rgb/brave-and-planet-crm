require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { calculateNextTargetMonth } = require('./utils/paymentHelper');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL (Supabase) bazasiga ulanish
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Supabase bulutli ulanishi uchun kerak
  }
});

// ==========================================
// 1. FILIALLAR (Branches) BO'LIMI
// ==========================================

// Barcha filiallarni olish
app.get('/api/branches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branches ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Filial nomini yoki manzilini o'zgartirish (Update Branch)
app.put('/api/branches/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;
  try {
    const result = await pool.query(
      'UPDATE branches SET name = COALESCE($1, name), address = COALESCE($2, address), updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, address, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Filial topilmadi" });
    }
    res.json({ message: "Filial ma'lumotlari yangilandi", branch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. AQLLI TO'LOV TIZIMI (Payments)
// ==========================================

// O'quvchi to'lov qilmoqchi bo'lganda navbatdagi oyni avtomatik ko'rsatish
app.get('/api/payments/preview/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const studentQuery = await pool.query(`
      SELECT s.id, s.full_name, s.joined_date, g.id as group_id, g.name as group_name, g.start_date, g.monthly_fee
      FROM students s
      JOIN groups g ON s.group_id = g.id
      WHERE s.id = $1
    `, [studentId]);

    if (studentQuery.rows.length === 0) {
      return res.status(404).json({ error: "O'quvchi yoki uning guruhi topilmadi" });
    }

    const student = studentQuery.rows[0];

    // Ushbu o'quvchining avvalgi to'lovlari sonini sanaymiz
    const paymentsCountQuery = await pool.query(
      'SELECT COUNT(*) FROM payments WHERE student_id = $1 AND group_id = $2',
      [student.id, student.group_id]
    );
    const paidCount = parseInt(paymentsCountQuery.rows[0].count, 10);

    // Mantiq bo'yicha navbatdagi oyni aniqlash
    const suggestedMonth = calculateNextTargetMonth(student.start_date, student.joined_date, paidCount);

    res.json({
      student_id: student.id,
      student_name: student.full_name,
      group_name: student.group_name,
      monthly_fee: student.monthly_fee,
      total_payments_made: paidCount,
      suggested_month: suggestedMonth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// To'lovni saqlash (Tasdiqlangandan so'ng)
app.post('/api/payments', async (req, res) => {
  const { student_id, group_id, amount, manual_month, note } = req.body;
  try {
    // Guruh va o'quvchi ma'lumotlarini olish
    const sQuery = await pool.query(`
      SELECT s.joined_date, g.start_date 
      FROM students s 
      JOIN groups g ON g.id = s.group_id 
      WHERE s.id = $1
    `, [student_id]);

    if (sQuery.rows.length === 0) {
      return res.status(404).json({ error: "O'quvchi topilmadi" });
    }

    const student = sQuery.rows[0];
    const paymentsCountQuery = await pool.query(
      'SELECT COUNT(*) FROM payments WHERE student_id = $1 AND group_id = $2',
      [student_id, group_id]
    );
    const currentCount = parseInt(paymentsCountQuery.rows[0].count, 10);

    // Agar admin qo'lda oyni o'zgartirgan bo'lsa o'shani, bo'lmasa avtomatik hisoblangan oyni olamiz
    const finalMonth = manual_month || calculateNextTargetMonth(student.start_date, student.joined_date, currentCount);

    const insertQuery = await pool.query(`
      INSERT INTO payments (student_id, group_id, amount, target_month, payment_number, note)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [student_id, group_id, amount, finalMonth, currentCount + 1, note || '']);

    res.status(201).json({
      message: "To'lov muvaffaqiyatli saqlandi",
      payment: insertQuery.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. DAVOMATNI BELGILASH (Attendance)
// ==========================================
app.post('/api/attendance', async (req, res) => {
  const { group_id, student_id, date, status } = req.body; // status: 'PRESENT' (+) yoki 'ABSENT' (-)
  try {
    const result = await pool.query(`
      INSERT INTO attendance (group_id, student_id, attendance_date, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (group_id, student_id, attendance_date)
      DO UPDATE SET status = EXCLUDED.status
      RETURNING *
    `, [group_id, student_id, date, status]);

    res.json({ message: "Davomat belgilandi", record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`EduFlow CRM API ${PORT}-portda muvaffaqiyatli ishga tushdi!`);
});