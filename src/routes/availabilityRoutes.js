// src/routes/availabilityRoutes.js
import express from 'express';
import {
  getAvailabilitiesForDoctor,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from '../controllers/availabilityController.js';

const router = express.Router();

// GET /availabilities/doctor/:doctorId
router.get('/doctor/:doctorId', getAvailabilitiesForDoctor);

// POST /availabilities
router.post('/', createAvailability);

// PATCH /availabilities/:id
router.patch('/:id', updateAvailability);

// DELETE /availabilities/:id
router.delete('/:id', deleteAvailability);

export default router;
