import express from 'express';
import { getDoctors, getDoctorAvailability } from '../controllers/doctorController.js';

const router = express.Router();

router.get('/', getDoctors);
router.get('/:id/availability', getDoctorAvailability);

export default router;
