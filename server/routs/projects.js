import express from 'express';
import {
	listProjects,
	getMyProjects,
	getMyProjectById,
	getProjectById,
	createProject,
	updateProject,
	deleteProject
} from '../counrolers/projects.js';
import { protect, authorize } from '../middleware.js';

const router = express.Router();

router.get('/my', protect, getMyProjects);
router.get('/my/:id', protect, getMyProjectById);

router.get('/', protect, authorize('admin'), listProjects);
router.get('/:id', protect, authorize('admin'), getProjectById);
router.post('/', protect, authorize('admin'), createProject);
router.put('/:id', protect, authorize('admin'), updateProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);

export default router;
