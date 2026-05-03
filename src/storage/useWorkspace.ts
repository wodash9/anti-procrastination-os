import { useEffect, useMemo, useState } from 'react';
import type { Project, Workspace, WorkspaceEvent } from '../domain/types';
import { createEmptyWorkspace, loadWorkspace, saveWorkspace, upsertProject } from './workspace';

function seedProjects(): Project[] {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      name: 'Lanzar Anti-Procrastination OS',
      description: 'Convertir landing en app con login, WIP y rituales.',
      type: 'product',
      status: 'now',
      createdAt: now,
      updatedAt: now,
      nextAction: 'abrir src/App.tsx y crear dashboard operativo',
      scores: { impact: 5, traction: 3, cost: 3, energy: 5, urgency: 4 },
      links: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Demo blockchain logística',
      description: 'Explorar trazabilidad industrial como MVP futuro.',
      type: 'experiment',
      status: 'next',
      createdAt: now,
      updatedAt: now,
      nextAction: 'escribir una demo de trazabilidad de 3 eventos',
      scores: { impact: 4, traction: 2, cost: 2, energy: 3, urgency: 2 },
      links: [],
    },
  ];
}

export function useWorkspace(userId: string) {
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    const stored = loadWorkspace(userId);
    if (stored.projects.length > 0) return stored;
    return { ...createEmptyWorkspace(userId), projects: seedProjects() };
  });

  useEffect(() => saveWorkspace(userId, workspace), [userId, workspace]);

  return useMemo(() => ({
    workspace,
    setWipLimit(limit: number) {
      setWorkspace((current) => ({ ...current, wipLimit: Math.max(1, Math.min(5, limit)) }));
    },
    saveProject(project: Project) {
      setWorkspace((current) => upsertProject(current, { ...project, updatedAt: new Date().toISOString() }, current.projects.some((item) => item.id === project.id) ? 'project_updated' : 'project_created'));
    },
    changeStatus(projectId: string, status: Project['status']) {
      setWorkspace((current) => {
        const project = current.projects.find((item) => item.id === projectId);
        if (!project) return current;
        return upsertProject(current, { ...project, status, updatedAt: new Date().toISOString() }, 'status_changed');
      });
    },
    addEvent(event: Omit<WorkspaceEvent, 'id' | 'createdAt'>) {
      setWorkspace((current) => ({ ...current, events: [...current.events, { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] }));
    },
    setDailyFocus: (workspaceUpdater: Workspace['dailyFocus']) => {
      setWorkspace((current) => ({ ...current, dailyFocus: workspaceUpdater }));
    },
    completeWeeklyReview(notes: string, outcomes: string[]) {
      setWorkspace((current) => ({
        ...current,
        weeklyReviews: [...current.weeklyReviews, { weekId: new Date().toISOString().slice(0, 10), notes, outcomes, completedAt: new Date().toISOString() }],
        events: [...current.events, { id: crypto.randomUUID(), type: 'weekly_review_completed', createdAt: new Date().toISOString(), message: 'Revisión semanal completada' }],
      }));
    },
  }), [workspace]);
}
