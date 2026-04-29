import express from 'express';
import {
	listPerformances,
	getMyPerformances,
	getPerformanceById,
	createPerformance,
	updatePerformance,
	deletePerformance
} from '../counrolers/performances.js';
import { protect, authorize } from '../middleware.js';

const router = express.Router();

router.get('/my', protect, getMyPerformances);

router.get('/', protect, authorize('admin'), listPerformances);
router.get('/:id', protect, authorize('admin'), getPerformanceById);
router.post('/', protect, authorize('admin'), createPerformance);
router.put('/:id', protect, authorize('admin'), updatePerformance);
router.delete('/:id', protect, authorize('admin'), deletePerformance);

export default router;
