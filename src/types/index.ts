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

export type SubscriptionTier = 'hobby' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface UserSubscription {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  billingStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'INACTIVE';
  billingCycle: BillingCycle;
  tokenBalance: number;
  tokensConsumed: number;
  tokenLimitMonthly: number;
  paypalSubscriptionId?: string | null;
  paypalCustomerId?: string | null;
  lastPaymentDate?: string;
  nextBillingDate?: string;
}

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyTokens: number;
  paypalPlanIdMonthly: string;
  paypalPlanIdAnnual: string;
  popular?: boolean;
  features: string[];
  limitations?: string[];
  badge?: string;
}

