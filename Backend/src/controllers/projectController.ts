import type { Request, Response } from 'express';
import Project, { ProjectStatus } from '../models/Project';
import SolverRequest, { RequestStatus } from '../models/Request';

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Buyer only)
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      res.status(400).json({ message: 'Please provide a title and description' });
      return;
    }
    const project = await Project.create({
      title,
      description,
      buyerId: (req as any).user._id,
      status: ProjectStatus.UNASSIGNED,
    });
    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get projects (role-scoped)
//          - Buyers: their own projects only
//          - Solvers / Admins: all Unassigned projects (to browse & request)
// @route   GET /api/projects
// @access  Private (All roles)
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const query = user.role === 'Buyer'
      ? { buyerId: user._id }                        // buyer sees only their projects
      : { status: ProjectStatus.UNASSIGNED };        // solvers/admins browse open projects

    const projects = await Project.find(query)
      .populate('buyerId', 'name email')
      .populate('solverId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private (All roles)
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('buyerId', 'name email')
      .populate('solverId', 'name email');
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.status(200).json(project);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all solver requests for a project
// @route   GET /api/projects/:id/requests
// @access  Private (Buyer who owns the project)
export const getProjectRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (project.buyerId.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to view requests for this project' });
      return;
    }
    const requests = await SolverRequest.find({ projectId: req.params.id })
      .populate('solverId', 'name email');
    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a solver to a project
// @route   PATCH /api/projects/:id/assign
// @access  Private (Buyer who owns the project)
export const assignSolver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      res.status(400).json({ message: 'Please provide a requestId to accept' });
      return;
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (project.buyerId.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to assign solvers for this project' });
      return;
    }
    if (project.status !== ProjectStatus.UNASSIGNED) {
      res.status(400).json({ message: 'This project has already been assigned' });
      return;
    }
    const acceptedRequest = await SolverRequest.findById(requestId);
    if (!acceptedRequest || acceptedRequest.projectId.toString() !== project.id) {
      res.status(404).json({ message: 'Request not found for this project' });
      return;
    }
    acceptedRequest.status = RequestStatus.ACCEPTED;
    await acceptedRequest.save();
    await SolverRequest.updateMany(
      { projectId: project._id, _id: { $ne: requestId }, status: RequestStatus.PENDING },
      { status: RequestStatus.REJECTED }
    );
    project.solverId = acceptedRequest.solverId;
    project.status = ProjectStatus.ASSIGNED;
    await project.save();
    const updatedProject = await Project.findById(project._id)
      .populate('buyerId', 'name email')
      .populate('solverId', 'name email');
    res.status(200).json({
      message: 'Solver assigned successfully. Project is now In Progress.',
      project: updatedProject,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a project's title and/or description
// @route   PATCH /api/projects/:id
// @access  Private (Buyer who owns the project — only while Unassigned)
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (project.buyerId.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to edit this project' });
      return;
    }
    if (project.status !== ProjectStatus.UNASSIGNED) {
      res.status(400).json({ message: 'Cannot edit a project that has already been assigned' });
      return;
    }
    if (title) project.title = title;
    if (description) project.description = description;
    await project.save();
    const updated = await Project.findById(project._id)
      .populate('buyerId', 'name email')
      .populate('solverId', 'name email');
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Buyer who owns the project — only while Unassigned)
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (project.buyerId.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to delete this project' });
      return;
    }
    if (project.status !== ProjectStatus.UNASSIGNED) {
      res.status(400).json({ message: 'Cannot delete a project that has already been assigned to a solver' });
      return;
    }
    await SolverRequest.deleteMany({ projectId: project._id });
    await project.deleteOne();
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
