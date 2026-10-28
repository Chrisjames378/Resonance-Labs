export type LayerType =
  | 'Input'
  | 'Dense'
  | 'Attention'
  | 'Conv1D'
  | 'MetacognitiveCritic'
  | 'Normalization'
  | 'Output';

export interface NeuralLayer {
  id: string;
  name: string;
  type: LayerType;
  nodes: number;
  activation: 'Linear' | 'ReLU' | 'GELU' | 'Sigmoid' | 'Softmax' | 'Tanh';
  dropout?: number;
  metacognitiveConfidenceThreshold?: number;
}

export interface Hyperparameters {
  learningRate: number;
  batchSize: number;
  empathyFactor: number;
  metacognitionFactor: number;
}

export interface MetacognitiveTelemetry {
  projectId: string;
  timestamp: string;
  metrics: {
    loss: number;
    accuracy: number;
    metacognitiveConfidence: number;
    tokensPerSec: number;
    hardwareThreadEfficiency: number;
  };
  internalReflections: string[];
}

export interface ModelRoute {
  id: string;
  name: string;
  architecture: string;
  role: 'Actor' | 'Critic' | 'Hybrid' | 'Fallback';
  latencyMs: number;
  costPerMillion: number;
  metacognitiveIndex: number;
  throughputTokensSec: number;
  memoryFootprintGb: number;
  status: 'ONLINE' | 'STANDBY' | 'OPTIMAL';
}

export interface InnerMonologueStep {
  attempt: number;
  actorCandidate: string;
  monologueSummary: string;
  confidenceScore: number;
  passedFloor: boolean;
  selfCorrectionReason?: string;
  executionTimeMs: number;
}

export interface CurriculumExercise {
  id: string;
  stepNumber: number;
  title: string;
  targetRequirement: string;
  completed: boolean;
}

export interface UserSubscription {
  email: string;
  tier: 'hobby' | 'pro' | 'enterprise';
  billingStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'INACTIVE';
  tokenLimitMonthly: number;
  tokensConsumed: number;
  paypalSubscriptionId?: string;
}
