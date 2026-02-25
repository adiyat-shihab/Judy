import express from 'express';
import {
  applyForBuyer,
  getMyApplication,
  getAllApplications,
  reviewApplication,
} from '../controllers/applicationController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);

// @route POST /api/applications        → Solver submits application
// @route GET  /api/applications/my     → Solver checks their own application
router.post('/', authorize(Role.PROBLEM_SOLVER), applyForBuyer);
router.get('/my', authorize(Role.PROBLEM_SOLVER), getMyApplication);

// @route GET   /api/applications       → Admin views all (filter: ?status=Pending)
// @route PATCH /api/applications/:id   → Admin approves or rejects
router.get('/', authorize(Role.ADMIN), getAllApplications);
router.patch('/:id', authorize(Role.ADMIN), reviewApplication);

export default router;
