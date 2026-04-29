import express from 'express';
import {
	listEmployeeProjects,
	getEmployeeProjectById,
	createEmployeeProject,
	updateEmployeeProject,
	deleteEmployeeProject
} from '../counrolers/employee-projects.js';
import { protect, authorize } from '../middleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), listEmployeeProjects);
router.get('/:id', protect, authorize('admin'), getEmployeeProjectById);
router.post('/', protect, authorize('admin'), createEmployeeProject);
router.put('/:id', protect, authorize('admin'), updateEmployeeProject);
router.delete('/:id', protect, authorize('admin'), deleteEmployeeProject);

export default router;
