/**
 * Autonomous Audio Processor - Web Audio API Worklet
 * Real-time synthesis and metacognitive critic reflection loop
 */
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

    // Harmonic synthesis: base frequency modulated by empathy
    const baseFreq = 110 + empathy * 110; // 110Hz to 220Hz
    const twoPi = Math.PI * 2;
    const sampleRate = 44100;
    const dt = twoPi / sampleRate;

    for (let i = 0; i < channelL.length; i++) {
      const currentEmpathy = parameters.empathyFactor.length > 1 ? parameters.empathyFactor[i] : empathy;

      // Multi-oscillator synthesis
      const s1 = Math.sin(this.phase);
      const s2 = Math.sin(this.subPhase * 1.5) * 0.45 * currentEmpathy;
      const s3 = Math.sin(this.harmonicPhase * 2.0) * 0.25 * (1 - currentEmpathy * 0.3);

      const sample = (s1 + s2 + s3) * 0.28;

      channelL[i] = sample;
      if (output[1]) {
        channelR[i] = sample;
      }

      this.phase += baseFreq * dt;
      if (this.phase > twoPi) this.phase -= twoPi;

      this.subPhase += baseFreq * 0.5 * dt;
      if (this.subPhase > twoPi) this.subPhase -= twoPi;

      this.harmonicPhase += baseFreq * 2.0 * dt;
      if (this.harmonicPhase > twoPi) this.harmonicPhase -= twoPi;

      this.sampleCount++;
    }

    // Telemetry dispatch cycle every ~4410 samples (~100ms)
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
            breachType: 'SAFETY_MARGIN_COMPROMISED',
            reason: 'Harmonic stability fell below critic confidence floor.'
          }
        });
      } else {
        this.port.postMessage({
          type: 'METRIC_REFLECTION_CYCLE',
          payload: {
            confidenceScore: +confidence.toFixed(4),
            timestamp: currentTime,
            empathy: +empathy.toFixed(4),
            harmonicResonance: +(0.85 + empathy * 0.12).toFixed(4)
          }
        });
      }
    }

    return true;
  }
}

registerProcessor('autonomous-audio-processor', AutonomousAudioProcessor);
