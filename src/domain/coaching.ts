import type { DailyFocus, EnergyLevel, FocusBlockerType, Project, RescueRecommendation } from './types';

const recommendationByBlocker: Record<FocusBlockerType, Omit<RescueRecommendation, 'blockerType' | 'timeboxMinutes'>> = {
  TOO_BIG: {
    strategyId: 'decompose-visible-verb',
    microAction: 'Escribe un título provisional y tres bullets visibles.',
    successSignal: 'Existe un borrador mínimo en pantalla.',
    fallbackAction: 'Si te congelas, abre el documento y escribe solo el título.',
  },
  NO_START: {
    strategyId: 'two-minute-launch',
    microAction: 'Abre la herramienta de trabajo y dedica 2 minutos al primer gesto útil.',
    successSignal: 'La herramienta está abierta y una acción mínima quedó hecha.',
    fallbackAction: 'Si no arrancas, solo prepara el entorno y vuelve a pulsar empezar.',
  },
  ANXIOUS: {
    strategyId: 'safe-ugly-first-pass',
    microAction: 'Haz una versión fea, pequeña y privada de la tarea durante este bloque.',
    successSignal: 'Hay una primera versión imperfecta creada.',
    fallbackAction: 'Si sientes presión, reduce el bloque y produce una sola frase o punto.',
  },
  DISTRACTED: {
    strategyId: 'single-tab-reset',
    microAction: 'Cierra ruido, deja una sola pestaña útil y trabaja en una única acción.',
    successSignal: 'La sesión ocurre con una sola superficie de trabajo abierta.',
    fallbackAction: 'Si vuelves a dispersarte, reinicia con 5 minutos y una sola pestaña.',
  },
  TIRED: {
    strategyId: 'prep-not-perform',
    microAction: 'Haz preparación ligera: ordenar material, abrir archivos y dejar el camino listo.',
    successSignal: 'El siguiente bloque futuro quedó preparado.',
    fallbackAction: 'Si no das más, registra el siguiente paso exacto y cierra sin culpa.',
  },
};

function normalizeTimebox(energy: EnergyLevel, requestedMinutes?: number): number {
  if (energy === 'LOW') return 5;
  if (requestedMinutes && requestedMinutes > 0) return Math.min(requestedMinutes, energy === 'MEDIUM' ? 25 : 45);
  return energy === 'HIGH' ? 25 : 10;
}

export function getRescueRecommendation(input: {
  blockerType: FocusBlockerType;
  taskLabel: string;
  energy: EnergyLevel;
  timeboxMinutes?: number;
}): RescueRecommendation {
  const base = recommendationByBlocker[input.blockerType];
  const taskLabel = input.taskLabel.trim() || 'la tarea bloqueada';
  return {
    ...base,
    blockerType: input.blockerType,
    microAction: `${taskLabel}: ${base.microAction}`,
    timeboxMinutes: normalizeTimebox(input.energy, input.timeboxMinutes),
  };
}

export function buildDailyFocusFromRescue(project: Project, recommendation: RescueRecommendation, date: string): DailyFocus {
  return {
    date,
    projectId: project.id,
    task: recommendation.microAction,
    doneDefinition: recommendation.successSignal,
    risk: recommendation.fallbackAction,
    status: 'planned',
    blockerType: recommendation.blockerType,
    rescueStrategyId: recommendation.strategyId,
    timeboxMinutes: recommendation.timeboxMinutes,
  };
}

export const blockerOptions: Array<{ value: FocusBlockerType; label: string }> = [
  { value: 'NO_START', label: 'No sé por dónde empezar' },
  { value: 'TOO_BIG', label: 'La tarea se siente demasiado grande' },
  { value: 'ANXIOUS', label: 'Me da ansiedad empezar' },
  { value: 'DISTRACTED', label: 'Estoy demasiado distraído' },
  { value: 'TIRED', label: 'Estoy demasiado cansado' },
];
