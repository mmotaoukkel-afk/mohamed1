/**
 * Generic AI Agent Platform — Core Types & Interfaces
 * Domain-Agnostic, SOLID-compliant contracts
 */

// ─── AGENT STATES ─────────────────────────────────────────────────────────────

export type AgentState =
  | 'Idle'
  | 'Listening'
  | 'Thinking'
  | 'Planning'
  | 'Executing'
  | 'WaitingTool'
  | 'WaitingUser'
  | 'Recovering'
  | 'Summarizing'
  | 'Speaking'
  | 'Completed'
  | 'Failed'
  | 'Interrupted';

// ─── EVENT-DRIVEN ARCHITECTURE ────────────────────────────────────────────────

export type AgentEventType =
  | 'USER_INPUT_RECEIVED'
  | 'PERCEPTION_COMPLETED'
  | 'REASONING_COMPLETED'
  | 'REASONING_REJECTED'
  | 'GOAL_ENQUEUED'
  | 'GOAL_ACTIVATED'
  | 'GOAL_CANCELLED'
  | 'GOAL_CONFLICT_DETECTED'
  | 'PLAN_GENERATED'
  | 'PLAN_VERIFIED'
  | 'PLAN_REJECTED'
  | 'STEP_STARTED'
  | 'STEP_COMPLETED'
  | 'STEP_FAILED'
  | 'CLARIFICATION_REQUESTED'
  | 'CLARIFICATION_RESPONDED'
  | 'EVALUATION_COMPLETED'
  | 'COMPENSATION_TRIGGERED'
  | 'AGENT_STATE_CHANGED'
  | 'EXECUTION_SUCCESS'
  | 'EXECUTION_FAILED';

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  timestamp: number;
  payload: any;
  metadata: {
    sessionId: string;
    correlationId: string;
    actor: 'USER' | 'PERCEPTION' | 'REASONING' | 'PLANNER' | 'EXECUTOR' | 'EVALUATOR' | 'SYSTEM';
  };
}

// ─── WORLD STATE (SINGLE SOURCE OF TRUTH) ──────────────────────────────────────

export interface UserProfile {
  id: string | null;
  isAuthenticated: boolean;
  preferences: Record<string, any>;
}

export interface ApplicationState {
  currentScreen: string;
  screenElements: Record<string, string>;
  navigationHistory: string[];
}

export interface WorldState {
  timestamp: number;
  user: UserProfile;
  app: ApplicationState;
  domain: Record<string, any>; // Domain-specific data (e.g., cart, balance)
  activeGoals: Goal[];
  runningTools: Record<string, { status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'; lastOutput?: any }>;
  temporaryData: Record<string, any>;
  lastEventId: string;
}

// ─── MEMORY SYSTEM ────────────────────────────────────────────────────────────

export interface Episode {
  id: string;
  timestamp: number;
  action: string;
  entities: Record<string, any>;
  outcome: string;
}

export interface EpisodeFilter {
  productBrand?: string;
  action?: string;
  dateRange?: { from: number; to: number };
  [key: string]: any;
}

// ─── GOAL MANAGEMENT ──────────────────────────────────────────────────────────

export type GoalStatus =
  | 'QUEUED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CONFLICTED';

export type GoalPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Goal {
  id: string;
  description: string;
  priority: GoalPriority;
  status: GoalStatus;
  createdAt: number;
  parentGoalId?: string;
  metadata: Record<string, any>;
}

// ─── TOOLS & CAPABILITIES ─────────────────────────────────────────────────────

export interface ToolParameterSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: any[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameterSchema[];
  outputSchema: Record<string, any>;
}

export interface ITool {
  definition: ToolDefinition;
  execute(params: Record<string, any>, context: { worldState: WorldState }): Promise<any>;
}

export interface CapabilityDefinition {
  name: string;
  description: string;
  toolNames: string[];
  domains: string[];
  isAvailable: (worldState: WorldState) => boolean;
}

// ─── PLANNING & EXECUTION ─────────────────────────────────────────────────────

export type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface ExecutionStep {
  id: string;
  name: string;
  capabilityName: string;
  toolName?: string;
  status: StepStatus;
  inputParameters: Record<string, any>;
  outputData?: any;
  errorMessage?: string;
  dependencies: string[];
  retryCount: number;
  maxRetries: number;
  onFailure: 'ABORT' | 'SKIP' | 'COMPENSATE' | 'REPLAN';
  compensationAction?: {
    toolName: string;
    parameters: Record<string, any>;
  };
}

export interface ExecutionPlan {
  id: string;
  goalId: string;
  steps: ExecutionStep[];
  status: 'IDLE' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'PAUSED_CLARIFICATION';
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, any>;
}

// ─── COGNITIVE SYSTEM EXTENSIONS ──────────────────────────────────────────────

export interface IWorkingMemory {
  set(key: string, value: any): void;
  get<T>(key: string): T | undefined;
  clear(): void;
}

export interface ISessionMemory {
  lastSearchResults: any[];
  lastIntent?: string;
  lastQuery?: string;
  currentFocusedProduct?: any;
  conversationHistory: Array<{ role: string; content: string }>;
  push(entry: { role: string; content: string }): void;
}

export interface ILongTermMemory {
  getUserPreference(key: string): Promise<any>;
  setUserPreference(key: string, value: any): Promise<void>;
}

export interface ISemanticMemory {
  query(concept: string): Promise<string[]>;
}

export interface IEpisodicMemory {
  recordEpisode(episode: Episode): Promise<void>;
  recallEpisodes(filter: EpisodeFilter): Promise<Episode[]>;
}

export interface IMemorySystem {
  working: IWorkingMemory;
  session: ISessionMemory;
  longTerm: ILongTermMemory;
  semantic: ISemanticMemory;
  episodic: IEpisodicMemory;
}

export interface GoalConflict {
  goalA: Goal;
  goalB: Goal;
  reason: string;
  resolution: 'CANCEL_A' | 'CANCEL_B' | 'MERGE' | 'QUEUE' | 'ASK_USER';
}

export interface ThoughtProcess {
  reasoning: string;
  confidenceScore: number;
  alternativesConsidered: string[];
  assumptionsMade: string[];
  constraintsIdentified: string[];
}

export interface ReasoningResult {
  isFeasible: boolean;
  refinedGoal: string;
  thought: ThoughtProcess;
  recommendedStrategy: string;
  rejectionReason?: string;
  knowledgeUsed: any[];
  memoryRecalled: Episode[];
}

export interface EvaluationResult {
  stepId: string;
  isSuccessful: boolean;
  qualityScore: number;
  deviationDetected: boolean;
  critique: string;
  correctiveAction: 'NONE' | 'RETRY' | 'REPLAN' | 'COMPENSATE';
}

export interface ISelfEvaluator {
  evaluateStep(step: ExecutionStep, output: any, worldState: WorldState): Promise<EvaluationResult>;
  evaluateFinalOutput(plan: ExecutionPlan, worldState: WorldState): Promise<{
    isGoalAchieved: boolean;
    overallQuality: number;
    critique: string;
    refinementRequired: boolean;
  }>;
}

