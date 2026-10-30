import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, BookOpen, Lightbulb, ExternalLink } from 'lucide-react';

export interface EducationalConcept {
  term: string;
  category?: 'Architecture' | 'Hyperparameter' | 'Runtime' | 'Evaluation';
  shortDefinition: string;
  detailedExplanation?: string;
  formulaOrRule?: string;
  impactOnOutput?: string;
}

export const EDUCATIONAL_GLOSSARY: Record<string, EducationalConcept> = {
  'Reflection Loopback': {
    term: 'Reflection Loopback',
    category: 'Architecture',
    shortDefinition: 'An autonomous Actor-Critic verification cycle where candidate tokens are routed into an introspective feedback loop prior to final synthesis.',
    detailedExplanation: 'When candidate tokens fail to meet the required confidence floor, the system triggers an autonomous self-correction cycle. The Critic formulates an inner monologue reflection that guides the Actor to generate an improved revision.',
    formulaOrRule: 'Loop until Confidence(y) ≥ Floor or IterationCount = MaxAttempts',
    impactOnOutput: 'Eliminates hallucinations and acoustic distortions before audio/token streaming begins.'
  },
  'Confidence Floor': {
    term: 'Confidence Floor Threshold',
    category: 'Hyperparameter',
    shortDefinition: 'The minimum statistical certainty threshold (0.60 – 0.98) required for candidate tokens to bypass self-correction.',
    detailedExplanation: 'Acts as a strict gating mechanism. If the Critic scores a candidate below this floor, token emission is halted and corrective reflection is engaged.',
    formulaOrRule: 'Pass Condition: Score(critic) ≥ FloorThreshold',
    impactOnOutput: 'Higher thresholds ensure pristine fidelity and safety at the cost of slight reflection latency (~200ms per iteration).'
  },
  'Metacognition Factor': {
    term: 'Metacognition Factor',
    category: 'Hyperparameter',
    shortDefinition: 'Governs the analytical depth and stringency of the Critic network during introspection.',
    detailedExplanation: 'A higher factor increases the weights applied to semantic nuance, contextual coherence, and structural constraint verification during inner monologue computation.',
    formulaOrRule: 'Weight scalar: α_meta ∈ [0.50, 1.00]',
    impactOnOutput: 'Higher values produce more rigorous, self-scrutinizing critique logs and sharper self-corrections.'
  },
  'Empathy Factor': {
    term: 'Empathy Factor',
    category: 'Hyperparameter',
    shortDefinition: 'Modulates emotional warmth, prosodic resonance, and human-aligned acoustic cadence in the audio worklet.',
    detailedExplanation: 'Directly adjusts Web Audio Worklet automation nodes to balance clinical precision against organic, empathetic vocal contours.',
    formulaOrRule: 'Empathy Parameter Ramp: linearRampToValueAtTime(empathy, t + transition)',
    impactOnOutput: 'Prevents robotic, monotone vocal artifacts and yields emotionally grounded synthesis.'
  },
  'Actor Model': {
    term: 'Actor Model (Policy Network)',
    category: 'Architecture',
    shortDefinition: 'The generative policy network responsible for formulating initial token candidates and acoustic parameters.',
    detailedExplanation: 'Operates in tandem with the Critic. It receives the primary objective and outputs candidate hypotheses for immediate metacognitive evaluation.',
    impactOnOutput: 'Determines the initial creative draft of the response.'
  },
  'Critic Model': {
    term: 'Critic Model (Value Network)',
    category: 'Architecture',
    shortDefinition: 'The supervisory value network that evaluates candidates against confidence thresholds and formulates self-correction instructions.',
    detailedExplanation: 'Computes loss and semantic alignment scores without directly generating the final user-facing text, ensuring objective validation.',
    impactOnOutput: 'Guarantees policy convergence and prevents gradient drift.'
  },
  'Inner Monologue': {
    term: 'Inner Monologue Scratchpad',
    category: 'Evaluation',
    shortDefinition: 'An isolated scratchpad where the Critic articulates diagnostic reflections prior to committing tokens.',
    detailedExplanation: 'Allows the system to "think out loud" internally. By vocalizing flaws in intermediate thoughts, the Actor receives clear gradient direction for the next attempt.',
    impactOnOutput: 'Visible in the console to demystify neural decision-making for researchers.'
  },
  'Loss Alert Ceiling': {
    term: 'Loss Alert Ceiling',
    category: 'Runtime',
    shortDefinition: 'The upper acceptable bound for model cross-entropy loss before triggering system-wide gradient warnings.',
    detailedExplanation: 'When live telemetry indicates loss exceeding this ceiling, the console highlights the breach in high-contrast red to alert engineers to potential divergence.',
    formulaOrRule: 'Alert Trigger: CurrentLoss > LossThreshold',
    impactOnOutput: 'Prevents corrupted neural weights from persisting into deployment.'
  },
  'Critic Confidence': {
    term: 'Critic Confidence Metric',
    category: 'Evaluation',
    shortDefinition: 'Real-time percentage reflecting the Critic network certainty in the active generation cycle.',
    detailedExplanation: 'Streamed directly over Server-Sent Events (SSE) and visualized via the continuous D3.js area chart to display temporal stability.',
    formulaOrRule: 'Streamed via /api/v1/telemetry/sse/:id',
    impactOnOutput: 'Serves as the primary operational telemetry for self-correction health.'
  }
};

interface TooltipProps {
  term: keyof typeof EDUCATIONAL_GLOSSARY | string;
  children?: React.ReactNode;
  customDefinition?: EducationalConcept;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  showIcon?: boolean;
}

export const EducationalTooltip: React.FC<TooltipProps> = ({
  term,
  children,
  customDefinition,
  position = 'top',
  className = '',
  showIcon = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  const concept: EducationalConcept | undefined = 
    customDefinition || EDUCATIONAL_GLOSSARY[term] || {
      term: String(term),
      shortDefinition: 'Metacognitive studio parameter.',
      category: 'Architecture'
    };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVisible(false);
    };
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible]);

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center gap-1 group cursor-help ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="button"
      aria-label={`Definition for ${concept.term}`}
    >
      {/* Target Content */}
      <span className="border-b border-dashed border-slate-600 group-hover:border-emerald-400 group-hover:text-slate-100 transition-colors">
        {children || term}
      </span>

      {showIcon && (
        <HelpCircle className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
      )}

      {/* Floating Popover Tooltip */}
      {isVisible && (
        <span
          className={`absolute z-50 pointer-events-none w-72 sm:w-80 p-3.5 bg-slate-900/98 backdrop-blur-md border border-slate-700/90 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-left font-sans normal-case tracking-normal ${getPositionClasses()} animate-fadeIn`}
          role="tooltip"
        >
          {/* Top Category Badge & Icon */}
          <span className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider">
              <BookOpen className="w-3 h-3" />
              {concept.category || 'Concept'}
            </span>
            <span className="text-slate-500">Studio Glossary</span>
          </span>

          {/* Title */}
          <span className="block text-xs font-bold text-slate-100 mb-1 font-mono">
            {concept.term}
          </span>

          {/* Short Definition */}
          <span className="block text-[11px] text-slate-300 leading-relaxed mb-2 font-normal">
            {concept.shortDefinition}
          </span>

          {/* Detailed Explanation if available */}
          {concept.detailedExplanation && (
            <span className="block text-[10px] text-slate-400 leading-relaxed mb-2 border-t border-slate-800/80 pt-2 font-normal">
              {concept.detailedExplanation}
            </span>
          )}

          {/* Formula or Rule Badge */}
          {concept.formulaOrRule && (
            <span className="block p-1.5 bg-slate-950/90 border border-slate-800 rounded font-mono text-[10px] text-cyan-300 mb-1.5">
              <span className="text-slate-500 mr-1.5">Rule:</span>
              {concept.formulaOrRule}
            </span>
          )}

          {/* Impact on Output */}
          {concept.impactOnOutput && (
            <span className="flex items-start gap-1 text-[10px] text-slate-400 mt-1 font-normal">
              <Lightbulb className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span><strong className="text-slate-300">Impact: </strong>{concept.impactOnOutput}</span>
            </span>
          )}

          {/* Arrow Caret */}
          <span
            className={`absolute w-2 h-2 bg-slate-900 border-slate-700 rotate-45 pointer-events-none ${
              position === 'bottom'
                ? '-top-1 left-1/2 -translate-x-1/2 border-t border-l'
                : position === 'left'
                ? '-right-1 top-1/2 -translate-y-1/2 border-t border-r'
                : position === 'right'
                ? '-left-1 top-1/2 -translate-y-1/2 border-b border-l'
                : '-bottom-1 left-1/2 -translate-x-1/2 border-b border-r'
            }`}
          />
        </span>
      )}
    </span>
  );
};
