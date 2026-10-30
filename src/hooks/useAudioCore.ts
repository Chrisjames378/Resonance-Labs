import { useState, useRef, useEffect, useCallback } from 'react';

// Fallback inline worklet source code in case static asset resolution encounters iframe/cross-origin restrictions
const INLINE_WORKLET_CODE = `
class AutonomousAudioProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'empathyFactor',
        defaultValue: 0.85,
        minValue: 0.0,
        maxValue: 1.0,
        automationRate: 'a-rate',
      },
    ];
  }

  constructor() {
    super();
    this.phase = 0;
    this.subPhase = 0;
    this.harmonicPhase = 0;
    this.sampleCount = 0;
    this.lastReportTime = 0;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const channelL = output[0];
    const channelR = output[1] || channelL;
    const empathy = parameters.empathyFactor ? parameters.empathyFactor[0] : 0.85;

    const baseFreq = 110 + empathy * 110;
    const twoPi = Math.PI * 2;
    const dt = twoPi / 44100;

    for (let i = 0; i < channelL.length; i++) {
      const currentEmpathy = parameters.empathyFactor.length > 1 ? parameters.empathyFactor[i] : empathy;
      const s1 = Math.sin(this.phase);
      const s2 = Math.sin(this.subPhase * 1.5) * 0.45 * currentEmpathy;
      const s3 = Math.sin(this.harmonicPhase * 2.0) * 0.25 * (1 - currentEmpathy * 0.3);

      const sample = (s1 + s2 + s3) * 0.28;
      channelL[i] = sample;
      if (output[1]) channelR[i] = sample;

      this.phase += baseFreq * dt;
      if (this.phase > twoPi) this.phase -= twoPi;

      this.subPhase += baseFreq * 0.5 * dt;
      if (this.subPhase > twoPi) this.subPhase -= twoPi;

      this.harmonicPhase += baseFreq * 2.0 * dt;
      if (this.harmonicPhase > twoPi) this.harmonicPhase -= twoPi;

      this.sampleCount++;
    }

    if (this.sampleCount - this.lastReportTime >= 4410) {
      this.lastReportTime = this.sampleCount;
      const noise = (Math.random() - 0.5) * 0.08;
      const confidence = Math.min(1.0, Math.max(0.1, empathy * 0.82 + 0.18 + noise));

      if (empathy < 0.35 || (empathy < 0.55 && Math.random() < 0.18)) {
        this.port.postMessage({
          type: 'CRITIC_BREACH_TELEMETRY',
          payload: {
            confidenceScore: +(Math.max(0.15, confidence - 0.3)).toFixed(4),
            timestamp: currentTime,
            empathy: +empathy.toFixed(4),
            breachType: 'SAFETY_MARGIN_COMPROMISED'
          }
        });
      } else {
        this.port.postMessage({
          type: 'METRIC_REFLECTION_CYCLE',
          payload: {
            confidenceScore: +confidence.toFixed(4),
            timestamp: currentTime,
            empathy: +empathy.toFixed(4)
          }
        });
      }
    }

    return true;
  }
}
registerProcessor('autonomous-audio-processor', AutonomousAudioProcessor);
`;

export const useAudioCore = (workletUrl: string = '/worklets/autonomous-audio-processor.js') => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [liveConfidence, setLiveConfidence] = useState(1.0);
  const [isBreached, setIsBreached] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.2);

  const initializeAudioEngine = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      audioContextRef.current = context;

      // Try loading provided workletUrl, fallback to Blob URL if network/CORS issues occur
      try {
        await context.audioWorklet.addModule(workletUrl);
      } catch (networkErr) {
        console.warn('[Audio Engine] Failed loading worklet URL; falling back to inline blob module:', networkErr);
        const blob = new Blob([INLINE_WORKLET_CODE], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        await context.audioWorklet.addModule(blobUrl);
      }

      // Initialize Worklet Node
      const workletNode = new AudioWorkletNode(context, 'autonomous-audio-processor');
      workletNodeRef.current = workletNode;

      // Initialize Analyser Node for 60fps HTML5 Canvas visualization
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      analyserNodeRef.current = analyser;

      // Initialize Gain Node for pleasant studio monitoring
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.2, context.currentTime);
      gainNodeRef.current = gainNode;

      // Wire audio graph: Worklet -> Analyser -> Gain -> Speakers
      workletNode.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(context.destination);

      workletNode.port.onmessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'METRIC_REFLECTION_CYCLE') {
          setLiveConfidence(payload.confidenceScore);
          setIsBreached(false);
        } else if (type === 'CRITIC_BREACH_TELEMETRY') {
          setLiveConfidence(payload.confidenceScore);
          setIsBreached(true);
        }
      };

      if (context.state === 'suspended') {
        await context.resume();
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('[Audio Engine] Configuration load failure:', error);
    }
  }, [workletUrl]);

  const setTimelineAutomation = useCallback((empathyValue: number, transitionTimeSec: number) => {
    if (!workletNodeRef.current || !audioContextRef.current) return;
    const param = workletNodeRef.current.parameters.get('empathyFactor');
    if (param) {
      const now = audioContextRef.current.currentTime;
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(empathyValue, now + transitionTimeSec);
    }
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (gainNodeRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(now);
      gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : val, now + 0.05);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (gainNodeRef.current && audioContextRef.current) {
        const now = audioContextRef.current.currentTime;
        gainNodeRef.current.gain.cancelScheduledValues(now);
        gainNodeRef.current.gain.linearRampToValueAtTime(next ? 0 : volume, now + 0.05);
      }
      return next;
    });
  }, [volume]);

  useEffect(() => {
    return () => {
      if (workletNodeRef.current) {
        try {
          workletNodeRef.current.disconnect();
        } catch {
          // ignore disconnect error during unmount
        }
      }
      if (analyserNodeRef.current) {
        try {
          analyserNodeRef.current.disconnect();
        } catch {
          // ignore
        }
      }
      if (gainNodeRef.current) {
        try {
          gainNodeRef.current.disconnect();
        } catch {
          // ignore
        }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  return {
    isInitialized,
    liveConfidence,
    isBreached,
    initializeAudioEngine,
    setTimelineAutomation,
    audioContextRef,
    workletNodeRef,
    analyserNodeRef,
    gainNodeRef,
    volume,
    setVolume,
    isMuted,
    toggleMute
  };
};
