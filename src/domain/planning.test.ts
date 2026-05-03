import { describe, expect, it } from 'vitest';
import {
  calculateScore,
  detectWipPressure,
  generateEmergencyAction,
  getDecisionBand,
  getMetrics,
  getWeeklyReviewIssues,
  isConcreteNextAction,
  findZombieProjects,
} from './planning';
import type { Project } from './types';

const baseProject: Project = {
  id: 'p1',
  name: 'ForgePlan',
  description: 'Planner demo',
  type: 'product',
  status: 'now',
  createdAt: '2026-05-01T09:00:00.000Z',
  updatedAt: '2026-05-02T09:00:00.000Z',
  nextAction: 'Publicar landing con formulario de espera',
  scores: { impact: 4, traction: 4, cost: 3, energy: 4, urgency: 3 },
  links: [],
};

describe('planning domain', () => {
  it('calculates score and assigns decision bands', () => {
    expect(calculateScore(baseProject.scores)).toBe(18);
    expect(getDecisionBand(20).label).toBe('Construir ahora');
    expect(getDecisionBand(15).label).toBe('Mantener en espera');
    expect(getDecisionBand(10).label).toBe('Aparcar 30 días');
    expect(getDecisionBand(6).label).toBe('Matar o archivar');
  });

  it('detects WIP pressure when now projects exceed the configured limit', () => {
    const projects = [baseProject, { ...baseProject, id: 'p2' }, { ...baseProject, id: 'p3', status: 'next' as const }];
    expect(detectWipPressure(projects, 1)).toEqual({ activeNow: 2, limit: 1, overLimit: true });
  });

  it('rejects vague next actions and accepts concrete physical actions', () => {
    expect(isConcreteNextAction('avanzar backend')).toBe(false);
    expect(isConcreteNextAction('abrir src/App.tsx y añadir formulario de proyecto')).toBe(true);
  });

  it('finds zombie projects with no next action or stale activity', () => {
    const projects: Project[] = [
      { ...baseProject, id: 'fresh', updatedAt: '2026-05-02T09:00:00.000Z' },
      { ...baseProject, id: 'stale', updatedAt: '2026-04-01T09:00:00.000Z' },
      { ...baseProject, id: 'missing-action', nextAction: '' },
    ];
    const zombies = findZombieProjects(projects, new Date('2026-05-03T09:00:00.000Z'), 14);
    expect(zombies.map((z) => z.project.id)).toEqual(['stale', 'missing-action']);
    expect(zombies[0].reasons).toContain('Sin actividad reciente');
  });

  it('flags weekly review blockers', () => {
    const issues = getWeeklyReviewIssues([{ ...baseProject, status: 'inbox', nextAction: '' }]);
    expect(issues).toContain('Inbox pendiente de clasificar');
    expect(issues).toContain('Proyecto activo sin próxima acción concreta');
  });

  it('generates one emergency 15-minute action from the highest urgency project', () => {
    const action = generateEmergencyAction([
      baseProject,
      { ...baseProject, id: 'p2', name: 'Cliente X', scores: { impact: 3, traction: 3, cost: 2, energy: 2, urgency: 5 }, nextAction: 'enviar email de alcance al cliente' },
    ]);
    expect(action).toEqual({ projectId: 'p2', projectName: 'Cliente X', action: 'enviar email de alcance al cliente', minutes: 15 });
  });

  it('computes behavior metrics', () => {
    const metrics = getMetrics([
      baseProject,
      { ...baseProject, id: 'blocked', status: 'blocked' },
      { ...baseProject, id: 'killed', status: 'killed' },
    ], [
      { id: 'e1', type: 'focus_completed', createdAt: '2026-05-03T08:00:00.000Z', message: 'done' },
      { id: 'e2', type: 'emergency_started', createdAt: '2026-05-03T09:00:00.000Z', message: 'panic' },
    ]);
    expect(metrics).toMatchObject({ now: 1, blocked: 1, killed: 1, focusCompleted: 1, emergencies: 1 });
  });
});
