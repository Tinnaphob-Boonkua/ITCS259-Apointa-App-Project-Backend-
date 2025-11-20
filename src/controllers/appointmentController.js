import { pool } from '../config/db.js';

/**
 * POST /appointments
 * Body: { doctor_id, patient_id, start_datetime, end_datetime? }
 * If end_datetime is not provided, we assume 30 minutes after start.
 */
export const createAppointment = async (req, res) => {
  try {
    let { doctor_id, patient_id, start_datetime, end_datetime } = req.body;

    if (!doctor_id || !patient_id || !start_datetime) {
      return res.status(400).json({ message: 'doctor_id, patient_id, and start_datetime are required' });
    }

    const start = new Date(start_datetime);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start_datetime' });
    }

    // If end_datetime not given, set default 30 minutes duration
    let end;
    if (end_datetime) {
      end = new Date(end_datetime);
      if (Number.isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid end_datetime' });
      }
    } else {
      end = new Date(start.getTime() + 30 * 60 * 1000); // +30 minutes
    }

    // Check for overlapping appointments for the same doctor
    // Condition: existing.start < new.end AND existing.end > new.start
    const overlapCheck = await pool.query(
      `
      SELECT id
      FROM appointments
      WHERE doctor_id = $1
        AND status IN ('pending', 'confirmed')
        AND start_datetime < $3
        AND end_datetime > $2
      `,
      [doctor_id, start.toISOString(), end.toISOString()]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Selected time slot is already booked' });
    }

    // Insert appointment
    const result = await pool.query(
      `
      INSERT INTO appointments (doctor_id, patient_id, start_datetime, end_datetime, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
      `,
      [doctor_id, patient_id, start.toISOString(), end.toISOString()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating appointment:', err);
    return res.status(500).json({ message: 'Server error while creating appointment' });
  }
};

/**
 * GET /appointments/patient/:patientId
 * Get all appointments for a patient
 */
export const getAppointmentsForPatient = async (req, res) => {
  const { patientId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.start_datetime,
        a.end_datetime,
        a.status,
        d.id AS doctor_id,
        u.name AS doctor_name,
        d.specialty
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = $1
      ORDER BY a.id ASC
      `,
      [patientId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching patient appointments:', err);
    return res.status(500).json({ message: 'Server error while fetching patient appointments' });
  }
};

/**
 * GET /appointments/doctor/:doctorId
 * Get all appointments for a doctor
 */
export const getAppointmentsForDoctor = async (req, res) => {
  const { doctorId } = req.params; // this is actually user_id

  try {
    // 1) Map user_id -> doctors.id
    const docRes = await pool.query(
      'SELECT id FROM doctors WHERE user_id = $1',
      [doctorId]
    );

    if (docRes.rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'Doctor not found for this user' });
    }   

    const doctorDbId = docRes.rows[0].id; // real doctors.id

    // 2) Use doctors.id to query appointments
    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.doctor_id,
        a.start_datetime,
        a.end_datetime,
        a.status,
        a.patient_id,
        u.name AS patient_name
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = $1
      ORDER BY a.id ASC
      `,
      [doctorDbId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    return res
      .status(500)
      .json({ message: 'Server error while fetching doctor appointments' });
  }
};



/**
 * PATCH /appointments/:id/status
 * Body: { status }
 * status ∈ ('pending', 'confirmed', 'completed', 'canceled')
 */
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['pending', 'confirmed', 'completed', 'canceled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const result = await pool.query(
      `
      UPDATE appointments
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating appointment status:', err);
    return res.status(500).json({ message: 'Server error while updating status' });
  }
};
