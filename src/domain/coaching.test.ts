import { describe, expect, it } from 'vitest';
import { buildDailyFocusFromRescue, getRescueRecommendation } from './coaching';
import type { Project } from './types';

const project: Project = {
  id: 'p1',
  name: 'Hestia merge',
  description: 'Fusionar flujo de desbloqueo',
  type: 'product',
  status: 'now',
  createdAt: '2026-05-04T08:00:00.000Z',
  updatedAt: '2026-05-04T08:00:00.000Z',
  nextAction: 'abrir src/App.tsx y añadir panel de rescate',
  scores: { impact: 5, traction: 3, cost: 3, energy: 4, urgency: 4 },
  links: [],
};

describe('Hestia-style coaching merge', () => {
  it('turns a blocker into a personalized micro-action and fallback', () => {
    const recommendation = getRescueRecommendation({
      blockerType: 'DISTRACTED',
      taskLabel: 'Enviar propuesta al cliente',
      energy: 'MEDIUM',
      timeboxMinutes: 25,
    });

    expect(recommendation.strategyId).toBe('single-tab-reset');
    expect(recommendation.microAction).toContain('Enviar propuesta al cliente');
    expect(recommendation.successSignal).toContain('superficie de trabajo');
    expect(recommendation.fallbackAction).toContain('5 minutos');
    expect(recommendation.timeboxMinutes).toBe(25);
  });

  it('reduces low-energy rescue sessions to a short safe timebox', () => {
    const recommendation = getRescueRecommendation({
      blockerType: 'TIRED',
      taskLabel: 'Preparar demo',
      energy: 'LOW',
      timeboxMinutes: 25,
    });

    expect(recommendation.timeboxMinutes).toBe(5);
    expect(recommendation.microAction).toContain('Preparar demo');
    expect(recommendation.fallbackAction).toContain('sin culpa');
  });

  it('builds a daily focus contract from a project and rescue recommendation', () => {
    const recommendation = getRescueRecommendation({ blockerType: 'NO_START', taskLabel: project.nextAction, energy: 'HIGH', timeboxMinutes: 10 });

    const focus = buildDailyFocusFromRescue(project, recommendation, '2026-05-04');

    expect(focus).toMatchObject({
      date: '2026-05-04',
      projectId: 'p1',
      task: recommendation.microAction,
      doneDefinition: recommendation.successSignal,
      risk: recommendation.fallbackAction,
      status: 'planned',
      blockerType: 'NO_START',
      rescueStrategyId: 'two-minute-launch',
      timeboxMinutes: 10,
    });
  });
});
