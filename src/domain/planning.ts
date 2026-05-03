import type { Project, ProjectScores, WorkspaceEvent } from './types';

export type DecisionBand = {
  label: 'Construir ahora' | 'Mantener en espera' | 'Aparcar 30 días' | 'Matar o archivar';
  tone: 'good' | 'warn' | 'danger';
  explanation: string;
};

export function calculateScore(scores: ProjectScores): number {
  return scores.impact + scores.traction + scores.cost + scores.energy + scores.urgency;
}

export function getDecisionBand(score: number): DecisionBand {
  if (score >= 18) return { label: 'Construir ahora', tone: 'good', explanation: 'Merece calendario esta semana.' };
  if (score >= 13) return { label: 'Mantener en espera', tone: 'warn', explanation: 'Válido, pero no roba foco hasta liberar WIP.' };
  if (score >= 8) return { label: 'Aparcar 30 días', tone: 'danger', explanation: 'Idea posible, mala candidata para foco actual.' };
  return { label: 'Matar o archivar', tone: 'danger', explanation: 'Está usando energía sin justificar retorno.' };
}

export function detectWipPressure(projects: Project[], limit: number): { activeNow: number; limit: number; overLimit: boolean } {
  const activeNow = projects.filter((project) => project.status === 'now').length;
  return { activeNow, limit, overLimit: activeNow > limit };
}

const vaguePatterns = [/^avanzar\b/i, /^mejorar\b/i, /^trabajar en\b/i, /^seguir con\b/i, /^hacer\b/i, /^mirar\b/i];
const concreteVerbs = ['abrir', 'crear', 'escribir', 'enviar', 'publicar', 'añadir', 'probar', 'llamar', 'revisar', 'subir', 'deployar', 'commitear', 'eliminar', 'mover'];

export function isConcreteNextAction(action: string): boolean {
  const normalized = action.trim().toLowerCase();
  if (normalized.length < 18) return false;
  if (vaguePatterns.some((pattern) => pattern.test(normalized)) && normalized.split(' ').length <= 4) return false;
  return concreteVerbs.some((verb) => normalized.startsWith(`${verb} `)) || /\b(src|docs|repo|cliente|email|landing|test|endpoint|formulario)\b/.test(normalized);
}

export type ZombieProject = { project: Project; reasons: string[] };

export function findZombieProjects(projects: Project[], now = new Date(), staleAfterDays = 14): ZombieProject[] {
  return projects
    .filter((project) => !['done', 'killed', 'archived'].includes(project.status))
    .map((project) => {
      const reasons: string[] = [];
      const ageDays = Math.floor((now.getTime() - new Date(project.updatedAt).getTime()) / 86_400_000);
      if (ageDays > staleAfterDays) reasons.push('Sin actividad reciente');
      if (!isConcreteNextAction(project.nextAction)) reasons.push('Sin próxima acción concreta');
      if (project.status === 'blocked' && !project.blocker?.trim()) reasons.push('Bloqueado sin bloqueo explícito');
      return { project, reasons };
    })
    .filter((entry) => entry.reasons.length > 0);
}

export function getWeeklyReviewIssues(projects: Project[]): string[] {
  const issues = new Set<string>();
  if (projects.some((project) => project.status === 'inbox')) issues.add('Inbox pendiente de clasificar');
  if (projects.some((project) => ['inbox', 'now', 'next', 'blocked'].includes(project.status) && !isConcreteNextAction(project.nextAction))) {
    issues.add('Proyecto activo sin próxima acción concreta');
  }
  if (projects.filter((project) => project.status === 'now').length === 0) issues.add('No hay proyecto principal en Now');
  return [...issues];
}

export function generateEmergencyAction(projects: Project[]): { projectId: string; projectName: string; action: string; minutes: 15 } | null {
  const candidates = projects.filter((project) => !['done', 'killed', 'archived'].includes(project.status));
  if (!candidates.length) return null;
  const [project] = [...candidates].sort((a, b) => b.scores.urgency - a.scores.urgency || calculateScore(b.scores) - calculateScore(a.scores));
  return {
    projectId: project.id,
    projectName: project.name,
    action: project.nextAction || `definir la próxima acción concreta de ${project.name}`,
    minutes: 15,
  };
}

export function getMetrics(projects: Project[], events: WorkspaceEvent[]) {
  return {
    total: projects.length,
    inbox: projects.filter((project) => project.status === 'inbox').length,
    now: projects.filter((project) => project.status === 'now').length,
    next: projects.filter((project) => project.status === 'next').length,
    blocked: projects.filter((project) => project.status === 'blocked').length,
    killed: projects.filter((project) => project.status === 'killed').length,
    done: projects.filter((project) => project.status === 'done').length,
    focusCompleted: events.filter((event) => event.type === 'focus_completed').length,
    emergencies: events.filter((event) => event.type === 'emergency_started').length,
  };
}
