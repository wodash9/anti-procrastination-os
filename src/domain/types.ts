export type ProjectStatus = 'inbox' | 'now' | 'next' | 'blocked' | 'waiting' | 'done' | 'killed' | 'archived';
export type ProjectType = 'client' | 'product' | 'experiment' | 'infra' | 'learning' | 'personal';
export type FocusBlockerType = 'TOO_BIG' | 'NO_START' | 'ANXIOUS' | 'DISTRACTED' | 'TIRED';
export type EnergyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ProjectScores = {
  impact: number;
  traction: number;
  cost: number;
  energy: number;
  urgency: number;
};

export type ProjectLink = {
  id: string;
  label: string;
  url: string;
  primary?: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  nextAction: string;
  blocker?: string;
  deadline?: string;
  reason?: string;
  scores: ProjectScores;
  links: ProjectLink[];
};

export type WorkspaceEventType =
  | 'project_created'
  | 'project_updated'
  | 'status_changed'
  | 'focus_completed'
  | 'focus_failed'
  | 'weekly_review_completed'
  | 'emergency_started'
  | 'rescue_started';

export type WorkspaceEvent = {
  id: string;
  type: WorkspaceEventType;
  createdAt: string;
  message: string;
  projectId?: string;
};

export type RescueRecommendation = {
  blockerType: FocusBlockerType;
  strategyId: string;
  microAction: string;
  successSignal: string;
  fallbackAction: string;
  timeboxMinutes: number;
};

export type DailyFocus = {
  date: string;
  projectId: string;
  task: string;
  doneDefinition: string;
  risk: string;
  status: 'planned' | 'completed' | 'partial' | 'failed' | 'cancelled';
  blockerType?: FocusBlockerType;
  rescueStrategyId?: string;
  timeboxMinutes?: number;
};

export type WeeklyReview = {
  weekId: string;
  outcomes: string[];
  completedAt?: string;
  notes: string;
};

export type Workspace = {
  userId: string;
  wipLimit: number;
  projects: Project[];
  events: WorkspaceEvent[];
  dailyFocus?: DailyFocus;
  weeklyReviews: WeeklyReview[];
};
