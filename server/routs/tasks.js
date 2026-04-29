import express from 'express';
import {
	listTasks,
	getMyTasks,
	getMyTaskById,
	getTaskById,
	createTask,
	updateTask,
	deleteTask,
	updateMyTaskStatus
} from '../counrolers/tasks.js';
import { protect, authorize } from '../middleware.js';

const router = express.Router();

router.get('/my', protect, getMyTasks);
router.get('/my/:id', protect, getMyTaskById);
router.patch('/my/:id/status', protect, updateMyTaskStatus);

router.get('/', protect, authorize('admin'), listTasks);
router.get('/:id', protect, authorize('admin'), getTaskById);
router.post('/', protect, authorize('admin'), createTask);
router.put('/:id', protect, authorize('admin'), updateTask);
router.delete('/:id', protect, authorize('admin'), deleteTask);

export default router;
