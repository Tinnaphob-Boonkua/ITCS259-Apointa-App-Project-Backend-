import express from 'express';
import {
  createAppointment,
  getAppointmentsForPatient,
  getAppointmentsForDoctor,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Create a new appointment
// POST /appointments
router.post('/', createAppointment);

// Get all appointments for a patient
// GET /appointments/patient/:patientId
router.get('/patient/:patientId', getAppointmentsForPatient);

// Get all appointments for a doctor
// GET /appointments/doctor/:doctorId
router.get('/doctor/:doctorId', getAppointmentsForDoctor);

// Update appointment status
// PATCH /appointments/:id/status
router.patch('/:id/status', updateAppointmentStatus);

export default router;
