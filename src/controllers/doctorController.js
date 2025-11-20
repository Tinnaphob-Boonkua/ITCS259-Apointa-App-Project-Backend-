import { pool } from '../config/db.js';

export const getDoctors = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, u.name, d.specialty, d.clinic_name, d.phone
       FROM doctors d
       JOIN users u ON d.user_id = u.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDoctorAvailability = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(
      `SELECT id, day_of_week, start_time, end_time
       FROM availabilities
       WHERE doctor_id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
