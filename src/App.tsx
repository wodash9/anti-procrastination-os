import { useMemo, useState, type FormEvent } from 'react';
import { useAuth } from './auth/AuthProvider';
import type { Project, ProjectScores, ProjectStatus, ProjectType } from './domain/types';
import { calculateScore, detectWipPressure, findZombieProjects, generateEmergencyAction, getDecisionBand, getMetrics, getWeeklyReviewIssues, isConcreteNextAction } from './domain/planning';
import { exportWorkspace } from './storage/workspace';
import { useWorkspace } from './storage/useWorkspace';
import './styles.css';

const statusLabels: Record<ProjectStatus, string> = {
  inbox: 'Inbox',
  now: 'Now',
  next: 'Next',
  blocked: 'Blocked',
  waiting: 'Waiting',
  done: 'Done',
  killed: 'Killed',
  archived: 'Archived',
};

const projectTypes: ProjectType[] = ['client', 'product', 'experiment', 'infra', 'learning', 'personal'];
const statuses: ProjectStatus[] = ['inbox', 'now', 'next', 'blocked', 'waiting', 'done', 'killed', 'archived'];

function createBlankProject(): Project {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    type: 'product',
    status: 'inbox',
    createdAt: now,
    updatedAt: now,
    nextAction: '',
    scores: { impact: 3, traction: 2, cost: 3, energy: 3, urgency: 2 },
    links: [],
  };
}

function scoreInput(label: string, key: keyof ProjectScores, value: number, onChange: (key: keyof ProjectScores, value: number) => void) {
  return (
    <label className="score-control" key={key}>
      <span>{label}</span>
      <input type="range" min="1" max="5" value={value} onChange={(event) => onChange(key, Number(event.target.value))} />
      <b>{value}</b>
    </label>
  );
}

function Landing({ onLogin }: { onLogin: () => Promise<void> }) {
  return (
    <main className="landing-shell">
      <nav className="topbar">
        <div className="brand"><span className="mark">S</span><span>Anti-Procrastination OS</span></div>
        <button className="btn ghost" onClick={onLogin}>Entrar</button>
      </nav>
      <section className="hero-grid">
        <div>
          <span className="eyebrow"><span className="dot" /> Web app con Keycloak-ready auth</span>
          <h1>Menos proyectos abiertos. Más decisiones cerradas.</h1>
          <p className="lead">Convierte tu inventario mental en una sala de control: proyectos, WIP, foco diario, ritual semanal, emergencias y métricas. Si no fuerza reducción de WIP, es otro Notion peor.</p>
          <div className="hero-actions"><button className="btn primary" onClick={onLogin}>Abrir mi sistema</button><a className="btn ghost" href="#features">Ver funcionalidades</a></div>
        </div>
        <div className="panel hero-panel">
          <div className="panel-title">operating-system.preview</div>
          <div className="metric-grid"><div><small>WIP</small><strong>2/2</strong></div><div><small>Zombis</small><strong>1</strong></div><div><small>Foco hoy</small><strong>1</strong></div></div>
          <div className="mini-card">Regla: no entra nada nuevo sin pausar, matar o cerrar algo.</div>
          <div className="mini-card accent">Emergencia: una acción de 15 minutos, no una reorganización.</div>
        </div>
      </section>
      <section id="features" className="feature-grid">
        {['Inventario de proyectos', 'Matriz de decisión', 'WIP board', 'Foco diario', 'Ritual semanal', 'Detector zombi', 'Protocolo emergencia', 'Export JSON'].map((feature) => <div className="card" key={feature}>{feature}</div>)}
      </section>
    </main>
  );
}

function AppShell() {
  const auth = useAuth();
  const { workspace, setWipLimit, saveProject, changeStatus, addEvent, setDailyFocus, completeWeeklyReview } = useWorkspace(auth.user?.id || 'anonymous');
  const [draft, setDraft] = useState<Project>(() => createBlankProject());
  const [reviewNotes, setReviewNotes] = useState('');

  const metrics = useMemo(() => getMetrics(workspace.projects, workspace.events), [workspace]);
  const wip = useMemo(() => detectWipPressure(workspace.projects, workspace.wipLimit), [workspace]);
  const zombies = useMemo(() => findZombieProjects(workspace.projects), [workspace.projects]);
  const weeklyIssues = useMemo(() => getWeeklyReviewIssues(workspace.projects), [workspace.projects]);
  const emergency = useMemo(() => generateEmergencyAction(workspace.projects), [workspace.projects]);

  function setDraftScore(key: keyof ProjectScores, value: number) {
    setDraft((current) => ({ ...current, scores: { ...current.scores, [key]: value } }));
  }

  function submitProject(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    saveProject({ ...draft, name: draft.name.trim(), description: draft.description.trim(), nextAction: draft.nextAction.trim() });
    setDraft(createBlankProject());
  }

  function startEmergency() {
    if (!emergency) return;
    addEvent({ type: 'emergency_started', projectId: emergency.projectId, message: `Emergencia: ${emergency.action}` });
    changeStatus(emergency.projectId, 'now');
  }

  function downloadExport() {
    const blob = new Blob([exportWorkspace(workspace)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anti-procrastination-os-${workspace.userId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const draftScore = calculateScore(draft.scores);
  const draftDecision = getDecisionBand(draftScore);

  return (
    <main className="app-shell">
      <nav className="topbar sticky">
        <div className="brand"><span className="mark">S</span><span>AP OS</span></div>
        <div className="user-pill"><span>{auth.user?.name}</span><button className="btn ghost small" onClick={auth.logout}>Salir</button></div>
      </nav>

      <section className="dashboard-head">
        <div>
          <span className="eyebrow"><span className="dot" /> sala de control personal</span>
          <h1>Hoy no negociamos con el backlog.</h1>
          <p className="lead">WIP máximo, foco diario y decisiones explícitas. La app está preparada para Keycloak/Coolify; en local usa mock auth seguro.</p>
        </div>
        <div className={`wip-box ${wip.overLimit ? 'danger' : ''}`}>
          <small>WIP NOW</small>
          <strong>{wip.activeNow}/{wip.limit}</strong>
          <label className="field-label" htmlFor="wip-limit">WIP máximo</label>
          <input id="wip-limit" aria-label="Límite WIP" type="number" min="1" max="5" value={workspace.wipLimit} onChange={(event) => setWipLimit(Number(event.target.value))} />
        </div>
      </section>

      <section className="metric-grid wide">
        <div><small>Total</small><strong>{metrics.total}</strong></div>
        <div><small>Inbox</small><strong>{metrics.inbox}</strong></div>
        <div><small>Now</small><strong>{metrics.now}</strong></div>
        <div><small>Blocked</small><strong>{metrics.blocked}</strong></div>
        <div><small>Killed</small><strong>{metrics.killed}</strong></div>
        <div><small>Emergencias</small><strong>{metrics.emergencies}</strong></div>
      </section>

      <section className="layout-2">
        <form className="panel" onSubmit={submitProject}>
          <div className="panel-title">captura / matriz</div>
          <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre del proyecto" />
          <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Motivo real por el que existe" />
          <input value={draft.nextAction} onChange={(event) => setDraft((current) => ({ ...current, nextAction: event.target.value }))} placeholder="Próxima acción concreta" />
          <div className="inline-fields">
            <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as ProjectType }))}>{projectTypes.map((type) => <option key={type}>{type}</option>)}</select>
            <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ProjectStatus }))}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>
          </div>
          <div className="scores">
            {scoreInput('Impacto', 'impact', draft.scores.impact, setDraftScore)}
            {scoreInput('Tracción', 'traction', draft.scores.traction, setDraftScore)}
            {scoreInput('Coste inverso', 'cost', draft.scores.cost, setDraftScore)}
            {scoreInput('Energía', 'energy', draft.scores.energy, setDraftScore)}
            {scoreInput('Urgencia', 'urgency', draft.scores.urgency, setDraftScore)}
          </div>
          <div className={`decision ${draftDecision.tone}`}><strong>{draftScore} · {draftDecision.label}</strong><span>{draftDecision.explanation}</span></div>
          {!isConcreteNextAction(draft.nextAction) && <p className="warning">Próxima acción demasiado vaga. Usa verbo + objeto: “abrir src/App.tsx y añadir formulario”.</p>}
          <button className="btn primary" type="submit">Guardar proyecto</button>
        </form>

        <div className="panel">
          <div className="panel-title">foco diario</div>
          <select value={workspace.dailyFocus?.projectId || ''} onChange={(event) => {
            const project = workspace.projects.find((item) => item.id === event.target.value);
            if (!project) return;
            setDailyFocus({ date: new Date().toISOString().slice(0, 10), projectId: project.id, task: project.nextAction, doneDefinition: `Terminado cuando: ${project.nextAction}`, risk: 'escaparme a investigar otra cosa', status: 'planned' });
          }}>
            <option value="">Elegir proyecto principal de hoy</option>
            {workspace.projects.filter((project) => !['done', 'killed', 'archived'].includes(project.status)).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          {workspace.dailyFocus ? <div className="focus-card"><strong>{workspace.dailyFocus.task}</strong><span>{workspace.dailyFocus.doneDefinition}</span><button className="btn primary" onClick={() => addEvent({ type: 'focus_completed', projectId: workspace.dailyFocus?.projectId, message: 'Foco diario completado' })}>Marcar completado</button></div> : <p className="muted">Al abrir la app, decide una sola cosa. Si todo importa, nada importa.</p>}

          <div className="panel-title spaced">modo emergencia</div>
          {emergency ? <div className="emergency"><strong>{emergency.projectName}</strong><span>{emergency.minutes} min · {emergency.action}</span><button className="btn danger" onClick={startEmergency}>Estoy saturado: ejecutar</button></div> : <p className="muted">No hay proyectos activos para emergencia.</p>}
        </div>
      </section>

      <section className="board">
        {(['inbox', 'now', 'next', 'blocked', 'waiting', 'done', 'killed'] as ProjectStatus[]).map((status) => (
          <div className="lane" key={status}>
            <div className="lane-title"><span>{statusLabels[status]}</span><b>{workspace.projects.filter((project) => project.status === status).length}</b></div>
            {workspace.projects.filter((project) => project.status === status).map((project) => {
              const score = calculateScore(project.scores);
              const band = getDecisionBand(score);
              return <article className="project-card" key={project.id}>
                <strong>{project.name}</strong>
                <p>{project.nextAction || 'Sin próxima acción concreta'}</p>
                <span className={`tag ${band.tone}`}>{score} · {band.label}</span>
                <select value={project.status} onChange={(event) => changeStatus(project.id, event.target.value as ProjectStatus)}>{statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
              </article>;
            })}
          </div>
        ))}
      </section>

      <section className="layout-2">
        <div className="panel">
          <div className="panel-title">ritual semanal</div>
          {weeklyIssues.length ? <ul className="issue-list">{weeklyIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p className="success">Sin bloqueos estructurales graves.</p>}
          <textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Qué se cerró, qué se bloqueó, qué se mata, qué entra en Now..." />
          <button className="btn primary" onClick={() => { completeWeeklyReview(reviewNotes || 'Revisión completada', workspace.projects.filter((project) => project.status === 'now').map((project) => project.name)); setReviewNotes(''); }}>Completar ritual</button>
        </div>
        <div className="panel">
          <div className="panel-title">detector zombi</div>
          {zombies.length ? zombies.map(({ project, reasons }) => <div className="zombie" key={project.id}><strong>{project.name}</strong><span>{reasons.join(' · ')}</span><button className="btn ghost small" onClick={() => changeStatus(project.id, 'archived')}>Archivar 30 días</button><button className="btn danger small" onClick={() => changeStatus(project.id, 'killed')}>Matar</button></div>) : <p className="success">No hay zombis evidentes.</p>}
          <button className="btn ghost" onClick={downloadExport}>Exportar JSON</button>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const auth = useAuth();
  if (auth.isLoading) return <main className="center"><div className="panel">Inicializando autenticación…</div></main>;
  if (auth.error) return <main className="center"><div className="panel"><div className="panel-title">auth error</div><p className="warning">{auth.error}</p><p className="muted">Configura Keycloak en Coolify con VITE_AUTH_MODE=keycloak y las variables públicas VITE_KEYCLOAK_*.</p></div></main>;
  if (!auth.isAuthenticated) return <Landing onLogin={auth.login} />;
  return <AppShell />;
}
