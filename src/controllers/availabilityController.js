// src/controllers/availabilityController.js
import { pool } from '../config/db.js';

/**
 * GET /availabilities/doctor/:doctorId
 */
export const getAvailabilitiesForDoctor = async (req, res) => {
  const { doctorId } = req.params; // this is actually user_id

  try {
    // Find doctor row by user_id
    const docRes = await pool.query(
      'SELECT id FROM doctors WHERE user_id = $1',
      [doctorId]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found for this user' });
    }

    const doctorDbId = docRes.rows[0].id; // real doctors.id

    const result = await pool.query(
      `
      SELECT id, doctor_id, day_of_week, start_time, end_time
      FROM availabilities
      WHERE doctor_id = $1
      ORDER BY day_of_week, start_time
      `,
      [doctorDbId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching availabilities:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * POST /availabilities
 * Body: { doctor_id, day_of_week, start_time, end_time }
 * start_time, end_time as "HH:MM:SS"
 */
export const createAvailability = async (req, res) => {
  const { doctor_id, day_of_week, start_time, end_time } = req.body;

  if (
    doctor_id == null ||
    day_of_week == null ||
    !start_time ||
    !end_time
  ) {
    return res
      .status(400)
      .json({ message: 'doctor_id, day_of_week, start_time, end_time are required' });
  }

  try {
    // doctor_id coming from Flutter = user_id
    const docRes = await pool.query(
      'SELECT id FROM doctors WHERE user_id = $1',
      [doctor_id]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found for this user' });
    }

    const doctorDbId = docRes.rows[0].id; // doctors.id

    const result = await pool.query(
      `
      INSERT INTO availabilities (doctor_id, day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [doctorDbId, day_of_week, start_time, end_time]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating availability:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * PATCH /availabilities/:id
 * Body: any of { day_of_week, start_time, end_time }
 */
export const updateAvailability = async (req, res) => {
  const { id } = req.params;
  const { day_of_week, start_time, end_time } = req.body;

  if (
    day_of_week == null &&
    !start_time &&
    !end_time
  ) {
    return res
      .status(400)
      .json({ message: 'At least one field to update is required' });
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (day_of_week != null) {
    fields.push(`day_of_week = $${idx++}`);
    values.push(day_of_week);
  }
  if (start_time) {
    fields.push(`start_time = $${idx++}`);
    values.push(start_time);
  }
  if (end_time) {
    fields.push(`end_time = $${idx++}`);
    values.push(end_time);
  }

  values.push(id);

  const sql = `
    UPDATE availabilities
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating availability:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /availabilities/:id
 */
export const deleteAvailability = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM availabilities WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    res.json({ message: 'Deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting availability:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
