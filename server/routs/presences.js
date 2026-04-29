import express from 'express';
import {
	listPresences,
	getMyPresences,
	startMyPresence,
	endMyPresence,
	getPresenceById,
	createPresence,
	updatePresence,
	deletePresence
} from '../counrolers/presences.js';
import { protect, authorize } from '../middleware.js';

const router = express.Router();

router.get('/my', protect, getMyPresences);
router.post('/my/start', protect, startMyPresence);
router.post('/my/end', protect, endMyPresence);

router.get('/', protect, authorize('admin'), listPresences);
router.get('/:id', protect, authorize('admin'), getPresenceById);
router.post('/', protect, authorize('admin'), createPresence);
router.put('/:id', protect, authorize('admin'), updatePresence);
router.delete('/:id', protect, authorize('admin'), deletePresence);

export default router;
