import { describe, expect, it, beforeEach } from 'vitest';
import { createEmptyWorkspace, loadWorkspace, saveWorkspace, upsertProject } from './workspace';
import type { Project } from '../domain/types';

const project: Project = {
  id: 'p1',
  name: 'Anti OS',
  description: 'App',
  type: 'product',
  status: 'inbox',
  createdAt: '2026-05-03T08:00:00.000Z',
  updatedAt: '2026-05-03T08:00:00.000Z',
  nextAction: 'abrir src/App.tsx y crear dashboard',
  scores: { impact: 5, traction: 3, cost: 3, energy: 4, urgency: 4 },
  links: [],
};

describe('workspace persistence', () => {
  beforeEach(() => localStorage.clear());

  it('isolates saved workspace by user id', () => {
    saveWorkspace('u1', { ...createEmptyWorkspace('u1'), projects: [project] });
    saveWorkspace('u2', createEmptyWorkspace('u2'));
    expect(loadWorkspace('u1').projects).toHaveLength(1);
    expect(loadWorkspace('u2').projects).toHaveLength(0);
  });

  it('upserts projects and appends immutable events', () => {
    const workspace = upsertProject(createEmptyWorkspace('u1'), project, 'project_created');
    expect(workspace.projects).toHaveLength(1);
    expect(workspace.events[0]).toMatchObject({ type: 'project_created', projectId: 'p1' });
  });
});
