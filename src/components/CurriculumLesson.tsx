import React, { useState } from 'react';
import { BookOpen, Play, CheckCircle2, Circle, ArrowRight, Code, Terminal, Sparkles } from 'lucide-react';
import { runMetacognitiveLoopSim } from '../services/api.ts';

interface CurriculumLessonProps {
  onNavigateToStudio: () => void;
}

export const CurriculumLesson: React.FC<CurriculumLessonProps> = ({ onNavigateToStudio }) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'javascript' | 'python'>('javascript');
  const [testPrompt, setTestPrompt] = useState('Synthesize harmonic audio resonance weights without clipping artifacts.');
  const [targetConfidence, setTargetConfidence] = useState(0.85);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [assignmentState, setAssignmentState] = useState<{ [key: number]: boolean }>({
    1: true,
    2: true,
    3: false,
    4: false
  });

  const toggleAssignment = (stepNum: number) => {
    setAssignmentState(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const handleRunLessonCode = async () => {
    setIsRunning(true);
    setConsoleLogs([
      `> [Resonance Core]: Initializing Actor-Critic loop with confidence floor: ${targetConfidence.toFixed(2)}`,
      `> [Input Prompt]: "${testPrompt}"`
    ]);

    const result = await runMetacognitiveLoopSim(testPrompt, targetConfidence, 0.85, 0.90);

    const newLogs = [
      `> [Resonance Core]: Initializing Actor-Critic loop with confidence floor: ${targetConfidence.toFixed(2)}`,
      `> [Input Prompt]: "${testPrompt}"`
    ];

    for (const step of result.steps) {
      newLogs.push(`[Inner Monologue Attempt #${step.attempt}]: ${step.monologueSummary}`);
      newLogs.push(`› Model Confidence Score: ${(step.confidenceScore * 100).toFixed(1)}% (Floor: ${(targetConfidence * 100).toFixed(1)}%)`);
      
      if (!step.passedFloor) {
        newLogs.push(`[Self-Correction Event]: Confidence score ${step.confidenceScore.toFixed(2)} is below floor threshold ${targetConfidence.toFixed(2)}. Adjusting logic weights...`);
      } else {
        newLogs.push(`[Verification Confirmed]: Output passed constraint boundary on Attempt #${step.attempt}.`);
      }
    }

    newLogs.push(`> Output: "${result.finalResult}"`);
    newLogs.push(`> [Loop Finished]: Execution time ${result.totalTimeMs}ms. Status: Nominal.`);

    setConsoleLogs(newLogs);
    setIsRunning(false);
  };

  const jsCodeSnippet = `// Implementation pattern inside Resonance Labs Core Engine
async function executeMetacognitiveLoop(userPrompt, targetConfidenceFloor = 0.85) {
  let attempts = 0;
  let modelConfidence = 0.0;
  let executionResult = "";

  while (modelConfidence < targetConfidenceFloor && attempts < 3) {
    attempts++;
    
    // Step 2: The Actor builds an answer variant
    const rawOutput = await callActorModel(userPrompt);
    
    // Step 3: Create the internal state reflection log (Inner Monologue)
    const innerMonologue = await generateReflectionLog(rawOutput);
    console.log(\`[Inner Monologue Attempt #\${attempts}]: \${innerMonologue.summary}\`);
    
    // Step 4: Evaluate overall correctness parameters
    modelConfidence = innerMonologue.confidenceScore;
    executionResult = rawOutput;
    
    if (modelConfidence < targetConfidenceFloor) {
      console.warn(
        \`[Self-Correction Event]: Confidence score \${modelConfidence} is below floor threshold. Adjusting logic weights...\`
      );
    }
  }

  return executionResult;
}`;

  const pyCodeSnippet = `# Implementation pattern inside Resonance Labs Python Telemetry Engine
import asyncio

async def execute_metacognitive_loop(user_prompt: str, target_confidence_floor: float = 0.85) -> str:
    attempts = 0
    model_confidence = 0.0
    execution_result = ""

    while model_confidence < target_confidence_floor and attempts < 3:
        attempts += 1
        
        # Step 2: Actor builds answer variant
        raw_output = await call_actor_model(user_prompt)
        
        # Step 3: Generate inner monologue reflection log
        reflection = await generate_reflection_log(raw_output)
        print(f"[Inner Monologue Attempt #{attempts}]: {reflection['summary']}")
        
        # Step 4: Evaluate confidence against floor
        model_confidence = reflection['confidence_score']
        execution_result = raw_output
        
        if model_confidence < target_confidence_floor:
            print(f"[Self-Correction Event]: Confidence score {model_confidence} below floor. Retrying...")

    return execution_result`;

  return (
    <div className="space-y-8">
      
      {/* Lesson Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2">
          <span>Resonance Educational Framework</span>
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span>Module 06</span>
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span>Computational Metacognition</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-emerald-400" />
          Engineering Lesson 01: Implementing Computational Metacognition
        </h2>
        <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Self-awareness in AI engineering is represented as computational metacognition—the system's ability to watch its own thinking. Instead of streaming tokens blindly, you will build a secondary checking pipeline that gauges structural token confidence before printing an output.
        </p>
      </div>

      {/* Core Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Core Concept: The Inner Monologue
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            In traditional generative models, the model produces tokens sequentially with zero retrospective evaluation. In Resonance Labs, an explicit workspace scratchpad is instantiated where a tracking Critic model inspects output tokens, extracts lexical and logical entropy, and writes an internal monologue evaluating reasoning alignment against explicit constraints.
          </p>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Actor-Critic Architecture
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Actor model generates candidate text. The Critic model assesses the internal thought process against explicit constraints. If the calculated confidence score falls below your defined threshold (e.g., 0.85 floor), the system suspends output synthesis and reruns the inference pass with adjusted attention weights.
          </p>
        </div>

      </div>

      {/* Interactive Code Implementation Runner */}
      <div className="border border-slate-800 bg-slate-900/70 rounded overflow-hidden">
        
        {/* Code Bar Header */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              Lesson Code Sandbox
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
              <button
                onClick={() => setActiveCodeTab('javascript')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  activeCodeTab === 'javascript'
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                TypeScript / JS
              </button>
              <button
                onClick={() => setActiveCodeTab('python')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  activeCodeTab === 'python'
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Python Engine
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Target Floor:</span>
              <input
                type="number"
                min="0.5"
                max="0.99"
                step="0.05"
                value={targetConfidence}
                onChange={(e) => setTargetConfidence(parseFloat(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-bold text-center focus:outline-none"
              />
            </div>

            <button
              onClick={handleRunLessonCode}
              disabled={isRunning}
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded transition-colors flex items-center gap-1.5 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? 'Running Loop...' : 'Execute Loop Runner'}
            </button>
          </div>
        </div>

        {/* Code Viewport */}
        <div className="p-4 bg-slate-950 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed border-b border-slate-800">
          <pre>
            <code>{activeCodeTab === 'javascript' ? jsCodeSnippet : pyCodeSnippet}</code>
          </pre>
        </div>

        {/* Live Execution Console Terminal */}
        <div className="p-4 bg-black/80 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 pb-1 border-b border-slate-900">
            <span>Terminal Output Stream</span>
            <span>{consoleLogs.length > 0 ? `${consoleLogs.length} events logged` : 'Idle'}</span>
          </div>

          {consoleLogs.length === 0 ? (
            <div className="text-slate-600 py-3 text-center">
              Click "Execute Loop Runner" above to observe the Actor-Critic loop execution trace.
            </div>
          ) : (
            <div className="space-y-1.5 py-1">
              {consoleLogs.map((log, idx) => {
                const isError = log.includes('[Self-Correction Event]');
                const isSuccess = log.includes('[Verification Confirmed]') || log.includes('[Loop Finished]');
                return (
                  <div
                    key={idx}
                    className={`${
                      isError ? 'text-amber-400 font-medium' :
                      isSuccess ? 'text-emerald-400 font-medium' :
                      'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Lab Assignment Card */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Lab Assignment Checklist
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Follow these concrete steps in the Resonance Labs Studio to complete Lesson 01.
            </p>
          </div>

          <button
            onClick={onNavigateToStudio}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors flex items-center gap-2 whitespace-nowrap self-start sm:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Launch Studio Canvas
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {[
            {
              step: 1,
              title: 'Open the Resonance Labs Studio UI Canvas.',
              desc: 'Access the graphical layer workspace with default input and output nodes.'
            },
            {
              step: 2,
              title: 'Stack a standard Dense layer on top of your input layer.',
              desc: 'Click "+ Dense" in the Neural Layer Designer to append a 256-node ReLU feature extractor.'
            },
            {
              step: 3,
              title: 'Configure the Metacognition Factor slider to 0.90 and the Empathy Factor slider to 0.85.',
              desc: 'Use the Hyperparameter Matrix sliders to tune the confidence evaluation sensitivity.'
            },
            {
              step: 4,
              title: 'Hit Run Simulation and observe the rolling WebGPU performance graphs to track execution time spikes during self-correction sequences.',
              desc: 'Verify that execution latency and memory bandwidth adapt cleanly during self-correction events.'
            }
          ].map((item) => {
            const completed = assignmentState[item.step];
            return (
              <div
                key={item.step}
                onClick={() => toggleAssignment(item.step)}
                className={`p-3.5 rounded border transition-colors cursor-pointer flex items-start gap-3 ${
                  completed
                    ? 'bg-emerald-950/20 border-emerald-800/80'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  aria-label={`Toggle step ${item.step}`}
                  className="mt-0.5 text-emerald-400 shrink-0 focus:outline-none"
                >
                  {completed ? (
                    <CheckCircle2 className="w-4 h-4 fill-emerald-400/20" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <div className="text-xs">
                  <div className={`font-semibold ${completed ? 'text-slate-100' : 'text-slate-300'}`}>
                    Step {item.step}: {item.title}
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
