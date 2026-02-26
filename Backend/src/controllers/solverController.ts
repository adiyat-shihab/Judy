import type { Request, Response } from 'express';
import Project, { ProjectStatus } from '../models/Project';
import SolverRequest, { RequestStatus } from '../models/Request';
import Task, { TaskStatus } from '../models/Task';
import Submission from '../models/Submission';
import SolverProfile from '../models/SolverProfile';
import User from '../models/User';

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

// @desc    Get solver's own profile + live stats
// @route   GET /api/solver/profile
// @access  Private (Problem Solver only)
export const getSolverProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    // Fetch user info
    const user = await User.findById(userId).select('name email role createdAt');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    // Get or create the profile doc (upsert on first visit)
    let profile = await SolverProfile.findOne({ userId });
    if (!profile) {
      profile = await SolverProfile.create({ userId });
    }

    // Aggregate live stats
    const [totalRequests, totalTasks, completedTasks, assignedProject] = await Promise.all([
      SolverRequest.countDocuments({ solverId: userId }),
      Task.countDocuments({ solverId: userId }),
      Task.countDocuments({ solverId: userId, status: TaskStatus.COMPLETED }),
      Project.findOne({ solverId: userId, status: ProjectStatus.ASSIGNED }).select('title status'),
    ]);

    res.status(200).json({
      user,
      profile,
      stats: {
        totalRequests,
        totalTasks,
        completedTasks,
        assignedProject: assignedProject || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update solver's profile
// @route   PUT /api/solver/profile
// @access  Private (Problem Solver only)
export const updateSolverProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { bio, skills, hourlyRate, availability, location, portfolio, languages, title } = req.body;

    const profile = await SolverProfile.findOneAndUpdate(
      { userId },
      { bio, skills, hourlyRate, availability, location, portfolio, languages, title },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// REQUEST TO WORK
// ─────────────────────────────────────────────────────────────

// @desc    Request to work on a project
// @route   POST /api/projects/:id/requests
// @access  Private (Problem Solver only)
export const requestToWork = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    if (project.status !== ProjectStatus.UNASSIGNED) { res.status(400).json({ message: 'This project has already been assigned' }); return; }
    const solverId = (req as any).user._id;
    const existing = await SolverRequest.findOne({ projectId: project._id, solverId });
    if (existing) { res.status(400).json({ message: 'You have already requested to work on this project' }); return; }
    const request = await SolverRequest.create({ projectId: project._id, solverId });
    res.status(201).json(request);
  } catch (error: any) { res.status(500).json({ message: error.message }); }
};

// @desc    Get the project currently assigned to this solver
// @route   GET /api/solver/my-project
// @access  Private (Problem Solver only)
export const getMyProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const solverId = (req as any).user._id;
    const project = await Project.findOne({ solverId, status: ProjectStatus.ASSIGNED })
      .populate('buyerId', 'name email')
      .populate('solverId', 'name email');
    if (!project) { res.status(404).json({ message: 'No active assignment found' }); return; }
    res.status(200).json(project);
  } catch (error: any) { res.status(500).json({ message: error.message }); }
};



// @desc    Create a task for an assigned project
// @route   POST /api/projects/:id/tasks
// @access  Private (Assigned Problem Solver only)
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, timeline } = req.body;

    if (!title || !description || !timeline) {
      res.status(400).json({ message: 'Please provide title, description, and timeline' });
      return;
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const solverId = (req as any).user._id;

    // Only the assigned solver can create tasks
    if (!project.solverId || project.solverId.toString() !== solverId.toString()) {
      res.status(403).json({ message: 'You are not the assigned solver for this project' });
      return;
    }

    if (project.status !== ProjectStatus.ASSIGNED) {
      res.status(400).json({ message: 'Project must be assigned before creating tasks' });
      return;
    }

    const task = await Task.create({
      projectId: project._id,
      solverId,
      title,
      description,
      timeline: new Date(timeline),
      status: TaskStatus.IN_PROGRESS,
    });

    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/projects/:id/tasks
// @access  Private (All roles)
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ projectId: req.params.id })
      .populate('solverId', 'name email');

    res.status(200).json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit a ZIP file for a task
// @route   POST /api/tasks/:id/submit
// @access  Private (Assigned Problem Solver only)
export const submitTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const solverId = (req as any).user._id;

    if (task.solverId.toString() !== solverId.toString()) {
      res.status(403).json({ message: 'You are not assigned to this task' });
      return;
    }

    if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.REJECTED) {
      res.status(400).json({ message: 'Task has already been submitted or completed' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'Please upload a ZIP file' });
      return;
    }

    // Save submission record
    const submission = await Submission.create({
      taskId: task._id,
      solverId,
      fileUrl: `uploads/submissions/${req.file.filename}`,
      fileName: req.file.originalname,
    });

    // Update task status to Submitted
    task.status = TaskStatus.SUBMITTED;
    await task.save();

    res.status(201).json({
      message: 'Task submitted successfully',
      submission,
      task,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept or reject a task submission (Buyer reviews)
// @route   PATCH /api/tasks/:id/review
// @access  Private (Buyer who owns the project)
export const reviewSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action } = req.body; // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      res.status(400).json({ message: 'Action must be "accept" or "reject"' });
      return;
    }

    const task = await Task.findById(req.params.id).populate('projectId');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (task.status !== TaskStatus.SUBMITTED) {
      res.status(400).json({ message: 'Task must be in Submitted state to review' });
      return;
    }

    // Verify the requester is the Buyer who owns this project
    const project = await Project.findById(task.projectId);
    if (!project || project.buyerId.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to review this task' });
      return;
    }

    if (action === 'accept') {
      task.status = TaskStatus.COMPLETED;
    } else {
      task.status = TaskStatus.REJECTED;
    }

    await task.save();

    res.status(200).json({
      message: `Task has been ${action === 'accept' ? 'accepted and marked as Completed' : 'rejected'}`,
      task,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the latest submission for a task
// @route   GET /api/tasks/:id/submission
// @access  Private (Buyer or Solver)
export const getTaskSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const submission = await Submission.findOne({ taskId: req.params.id }).sort({ createdAt: -1 });
    if (!submission) { res.status(404).json({ message: 'No submission found' }); return; }
    res.status(200).json(submission);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

