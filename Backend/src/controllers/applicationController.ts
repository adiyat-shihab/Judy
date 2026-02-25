import type { Request, Response } from 'express';
import BuyerApplication, { ApplicationStatus } from '../models/BuyerApplication';
import User, { Role } from '../models/User';

// @desc    Solver submits a Buyer role application
// @route   POST /api/applications
// @access  Private (Problem Solver only)
export const applyForBuyer = async (req: Request, res: Response): Promise<void> => {
  try {
    const solverId = (req as any).user._id;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 20) {
      res.status(400).json({ message: 'Please provide a reason (min. 20 characters)' });
      return;
    }

    // Prevent duplicate applications
    const existing = await BuyerApplication.findOne({ solverId });
    if (existing) {
      if (existing.status === ApplicationStatus.PENDING) {
        res.status(400).json({ message: 'You already have a pending application' });
      } else if (existing.status === ApplicationStatus.APPROVED) {
        res.status(400).json({ message: 'Your application was already approved' });
      } else {
        // Allow resubmission if previously rejected
        existing.reason = reason.trim();
        existing.status = ApplicationStatus.PENDING;
        await existing.save();
        res.status(200).json({ message: 'Application resubmitted successfully', application: existing });
      }
      return;
    }

    const application = await BuyerApplication.create({
      solverId,
      reason: reason.trim(),
    });

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the current solver's own application status
// @route   GET /api/applications/my
// @access  Private (Problem Solver only)
export const getMyApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const solverId = (req as any).user._id;
    const application = await BuyerApplication.findOne({ solverId });
    if (!application) { res.status(404).json({ message: 'No application found' }); return; }
    res.status(200).json(application);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin gets all applications (optional status filter: ?status=Pending)
// @route   GET /api/applications
// @access  Private (Admin only)
export const getAllApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const applications = await BuyerApplication.find(query)
      .populate('solverId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin approves or rejects an application
// @route   PATCH /api/applications/:id
// @access  Private (Admin only)
export const reviewApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action } = req.body; // 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ message: 'Action must be "approve" or "reject"' });
      return;
    }

    const application = await BuyerApplication.findById(req.params.id).populate('solverId', 'name email role');
    if (!application) { res.status(404).json({ message: 'Application not found' }); return; }

    if (application.status !== ApplicationStatus.PENDING) {
      res.status(400).json({ message: 'Application has already been reviewed' });
      return;
    }

    if (action === 'approve') {
      application.status = ApplicationStatus.APPROVED;
      await application.save();

      // Upgrade the solver's role to Buyer
      await User.findByIdAndUpdate(application.solverId, { role: Role.BUYER });

      res.status(200).json({
        message: `Application approved — user is now a Buyer`,
        application,
      });
    } else {
      application.status = ApplicationStatus.REJECTED;
      await application.save();
      res.status(200).json({
        message: 'Application rejected',
        application,
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
