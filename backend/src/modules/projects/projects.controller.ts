import type { Request, Response } from 'express';
import { ProjectStatus } from '@prisma/client';

import * as projectsService from './projects.service.js';

const validStatuses = Object.values(ProjectStatus);

function isValidStatus(status: unknown): status is ProjectStatus {
  return (
    typeof status === 'string' &&
    validStatuses.includes(status as ProjectStatus)
  );
}

function sendError(
  res: Response,
  status: number,
  message: string,
) {
  return res.status(status).json({
    success: false,
    message,
  });
}

function handleDatabaseError(
  res: Response,
  error: unknown,
) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  ) {
    const code = (error as { code: string }).code;

    if (code === 'P2025') {
      return sendError(res, 404, 'Project not found');
    }
  }

  console.error('Project database error:', error);

  return sendError(res, 500, 'Internal server error');
}

export async function getAllProjects(
  _req: Request,
  res: Response,
) {
  try {
    const projects = await projectsService.getAllProjects();

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
}

export async function getProjectById(
  req: Request,
  res: Response,
) {
  try {
    const projectId = String(req.params.id);
    const project = await projectsService.getProjectById(projectId);

    if (!project) {
      return sendError(res, 404, 'Project not found');
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
}

export async function createProject(
  req: Request,
  res: Response,
) {
  try {
    const { name, description, status } = req.body ?? {};

    if (typeof name !== 'string' || !name.trim()) {
      return sendError(res, 400, 'Project name is required');
    }

    if (name.trim().length > 150) {
      return sendError(
        res,
        400,
        'Project name cannot exceed 150 characters',
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== 'string'
    ) {
      return sendError(
        res,
        400,
        'Description must be a string or null',
      );
    }

    if (
      typeof description === 'string' &&
      description.length > 2000
    ) {
      return sendError(
        res,
        400,
        'Description cannot exceed 2000 characters',
      );
    }

    if (status !== undefined && !isValidStatus(status)) {
      return sendError(
        res,
        400,
        'Invalid project status',
      );
    }

    const project = await projectsService.createProject({
      name,
      description,
      status,
    });

    return res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
}

export async function updateProject(
  req: Request,
  res: Response,
) {
  try {
    const { name, description, status } = req.body ?? {};

    if (
      name === undefined &&
      description === undefined &&
      status === undefined
    ) {
      return sendError(
        res,
        400,
        'At least one field is required for an update',
      );
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return sendError(
          res,
          400,
          'Project name must be a non-empty string',
        );
      }

      if (name.trim().length > 150) {
        return sendError(
          res,
          400,
          'Project name cannot exceed 150 characters',
        );
      }
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== 'string'
    ) {
      return sendError(
        res,
        400,
        'Description must be a string or null',
      );
    }

    if (
      typeof description === 'string' &&
      description.length > 2000
    ) {
      return sendError(
        res,
        400,
        'Description cannot exceed 2000 characters',
      );
    }

    if (status !== undefined && !isValidStatus(status)) {
      return sendError(
        res,
        400,
        'Invalid project status',
      );
    }

    const projectId = String(req.params.id);
    const project = await projectsService.updateProject(
      projectId,
      {
        name,
        description,
        status,
      },
    );

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
}

export async function deleteProject(
  req: Request,
  res: Response,
) {
  try {
    const projectId = String(req.params.id);
    await projectsService.deleteProject(projectId);

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
}