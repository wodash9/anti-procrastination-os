import type { Project, Workspace, WorkspaceEventType } from '../domain/types';

export function workspaceKey(userId: string): string {
  return `anti-procrastination-os:${userId}`;
}

export function createEmptyWorkspace(userId: string): Workspace {
  return { userId, wipLimit: 2, projects: [], events: [], weeklyReviews: [] };
}

export function loadWorkspace(userId: string): Workspace {
  const raw = localStorage.getItem(workspaceKey(userId));
  if (!raw) return createEmptyWorkspace(userId);
  try {
    return { ...createEmptyWorkspace(userId), ...JSON.parse(raw), userId } as Workspace;
  } catch {
    return createEmptyWorkspace(userId);
  }
}

export function saveWorkspace(userId: string, workspace: Workspace): void {
  localStorage.setItem(workspaceKey(userId), JSON.stringify({ ...workspace, userId }));
}

export function upsertProject(workspace: Workspace, project: Project, eventType: WorkspaceEventType = 'project_updated'): Workspace {
  const exists = workspace.projects.some((item) => item.id === project.id);
  const projects = exists
    ? workspace.projects.map((item) => (item.id === project.id ? project : item))
    : [...workspace.projects, project];
  return {
    ...workspace,
    projects,
    events: [
      ...workspace.events,
      {
        id: crypto.randomUUID(),
        type: eventType,
        projectId: project.id,
        createdAt: new Date().toISOString(),
        message: `${eventType}: ${project.name}`,
      },
    ],
  };
}

export function exportWorkspace(workspace: Workspace): string {
  return JSON.stringify(workspace, null, 2);
}
