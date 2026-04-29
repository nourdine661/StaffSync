import express from 'express';
import {
	listEmployees,
	loginEmployee,
	getMyInfo,
	updateMyProfile,
	getEmployeeById,
	createEmployee,
	updateEmployee,
	deleteEmployee
} from '../counrolers/employees.js';
import { protect, authorize } from '../middleware.js';

const router = express.Router();

router.post('/login', loginEmployee);
router.get('/me', protect, getMyInfo);
router.put('/me', protect, updateMyProfile);

router.get('/', protect, authorize('admin'), listEmployees);
router.get('/:id', protect, authorize('admin'), getEmployeeById);
router.post('/', protect, authorize('admin'), createEmployee);
router.put('/:id', protect, authorize('admin'), updateEmployee);
router.delete('/:id', protect, authorize('admin'), deleteEmployee);

export default router;