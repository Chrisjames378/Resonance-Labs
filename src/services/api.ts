import { MetacognitiveTelemetry, InnerMonologueStep } from '../types/index.ts';

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `Request failed (${response.status})`);
  return body as T;
}

export async function registerInterest(email: string): Promise<{ success: boolean; message: string; ledgerId: string }> {
  return apiJson('/api/auth/register-interest', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

export async function commitModel(payload: {
  userId: string; name: string; layers: any[]; learningRate: number;
  batchSize: number; empathyFactor: number; metacognitionFactor: number;
}): Promise<{ status: string; message: string; data: any }> {
  return apiJson('/api/v1/studio/commit-model', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function fetchTelemetry(projectId: string = 'proj_default'): Promise<MetacognitiveTelemetry> {
  return apiJson(`/api/v1/telemetry/stream/${encodeURIComponent(projectId)}`);
}

// Billing events must only originate from PayPal's verified server-to-server webhook.
// A browser must never be able to simulate subscription activation.
export async function triggerPaypalWebhook(_eventType: string, _subscriptionId: string): Promise<never> {
  throw new Error('PayPal webhook simulation is disabled. Configure verified server-side billing.');
}

/**
 * Executes Lesson 01 Actor-Critic Metacognitive Loop Simulation
 */
export async function runMetacognitiveLoopSim(
  userPrompt: string,
  targetConfidenceFloor: number = 0.85,
  empathyFactor: number = 0.85,
  metacognitionFactor: number = 0.90
): Promise<{
  steps: InnerMonologueStep[];
  finalResult: string;
  totalAttempts: number;
  converged: boolean;
  totalTimeMs: number;
}> {
  const steps: InnerMonologueStep[] = [];
  let attempts = 0;
  let modelConfidence = 0.0;
  let executionResult = "";
  let totalTime = 0;

  const candidateOutputs = [
    {
      actor: `Candidate variant: Direct output without calibration. Latency minimized, raw token probability 0.72.`,
      monologue: `Identified low lexical entropy in layer 3. Potential hallucination boundary on factual grounding. Constraint check: Empathy balance at ${empathyFactor.toFixed(2)}.`,
      score: 0.68,
      reason: `Confidence score 0.68 is below target floor threshold of ${targetConfidenceFloor.toFixed(2)}. Applying gradient penalization on unchecked tokens.`
    },
    {
      actor: `Candidate variant: Adjusted contextual reasoning. Secondary attention pass applied over prompt tokens.`,
      monologue: `Semantic coherence increased by 19%. Cross-entropy validation against critic embeddings: confidence score calculated at 0.82. Metacognition factor ${metacognitionFactor.toFixed(2)} active.`,
      score: 0.82,
      reason: `Confidence score 0.82 is approaching floor ${targetConfidenceFloor.toFixed(2)}. Minor hallucination risk detected in token tail.`
    },
    {
      actor: `Optimal validated synthesis: "${userPrompt || 'Autonomous engine synthesis'}" verified with multi-head self-correction. Coherence index 99.4%, invariant consistency confirmed.`,
      monologue: `Critic loop reports zero constraint violations. Structural entropy normalized. Confidence ceiling reached at 0.94.`,
      score: 0.94,
      reason: undefined
    }
  ];

  while (modelConfidence < targetConfidenceFloor && attempts < 3) {
    const candidate = candidateOutputs[attempts];
    attempts++;
    const stepTime = 120 + Math.floor(Math.random() * 80);
    totalTime += stepTime;

    // Small delay simulation
    await new Promise((r) => setTimeout(r, 200));

    modelConfidence = candidate.score;
    executionResult = candidate.actor;
    const passed = modelConfidence >= targetConfidenceFloor;

    steps.push({
      attempt: attempts,
      actorCandidate: candidate.actor,
      monologueSummary: candidate.monologue,
      confidenceScore: modelConfidence,
      passedFloor: passed,
      selfCorrectionReason: passed ? undefined : candidate.reason,
      executionTimeMs: stepTime
    });

    if (passed) {
      break;
    }
  }

  return {
    steps,
    finalResult: executionResult,
    totalAttempts: attempts,
    converged: modelConfidence >= targetConfidenceFloor,
    totalTimeMs: totalTime
  };
}

/**
 * Invokes the Gemini Interactions API endpoint on the backend gateway
 */
export async function callGeminiInteractions(prompt: string, model: string = 'models/gemini-3.8-flash'): Promise<any> {
  return apiJson('/api/v1/gemini/interact', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model })
  });
}
