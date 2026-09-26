import { Prisma, ProjectStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
}

const projectInclude = {
  _count: {
    select: {
      mediaAssets: true,
    },
  },
};

export async function getAllProjects() {
  return prisma.project.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: projectInclude,
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  });
}

export async function createProject(data: CreateProjectInput) {
  return prisma.project.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      status: data.status ?? ProjectStatus.DRAFT,
    },
    include: projectInclude,
  });
}

export async function updateProject(
  id: string,
  data: UpdateProjectInput,
) {
  const updateData: Prisma.ProjectUpdateInput = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }

  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  return prisma.project.update({
    where: { id },
    data: updateData,
    include: projectInclude,
  });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({
    where: { id },
  });
}