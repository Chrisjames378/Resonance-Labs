import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Check, X, Volume2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Hyperparameters, NeuralLayer } from '../types/index.ts';

interface VoiceTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHyperparams: Hyperparameters;
  currentLayers: NeuralLayer[];
  onApplyVoiceConfig: (updates: {
    hyperparameters?: Partial<Hyperparameters>;
    newLayer?: NeuralLayer['type'];
    layerNodes?: number;
    projectName?: string;
  }) => void;
}

export const VoiceTrainingModal: React.FC<VoiceTrainingModalProps> = ({
  isOpen,
  onClose,
  currentHyperparams,
  currentLayers,
  onApplyVoiceConfig
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioFeedbackLevel, setAudioFeedbackLevel] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Parsed parameters preview
  const [parsedChanges, setParsedChanges] = useState<{
    learningRate?: number;
    batchSize?: number;
    empathyFactor?: number;
    metacognitionFactor?: number;
    addLayerType?: NeuralLayer['type'];
    layerNodes?: number;
    projectName?: string;
    summary: string[];
  }>({ summary: [] });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        if (currentText) {
          setTranscript(currentText);
          parseSpokenDirectives(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Voice Training] Speech recognition notice:', event.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Cleanup audio on modal close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
    }
  }, [isOpen]);

  const startRecording = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      setIsRecording(true);

      // Start SpeechRecognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_e) {
          // already started
        }
      }

      // Start Waveform loop
      drawWaveform();
    } catch (err: any) {
      setPermissionError('Microphone permission required or device unavailable. You can also click sample voice directives below.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyserRef.current!.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      setAudioFeedbackLevel(sum / bufferLength);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(16, 185, 129)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  // NLP rule parser translating spoken requirements into network configurations
  const parseSpokenDirectives = (text: string) => {
    const lower = text.toLowerCase();
    const changes: any = { summary: [] };

    // Learning rate extraction
    const lrMatch = lower.match(/learning rate (to|of|at)?\s*([0-9.]+)/i);
    if (lrMatch && lrMatch[2]) {
      const val = parseFloat(lrMatch[2]);
      if (!isNaN(val) && val > 0 && val < 1) {
        changes.learningRate = val;
        changes.summary.push(`Set Learning Rate -> ${val}`);
      }
    } else if (lower.includes('lower learning rate') || lower.includes('decrease learning rate')) {
      changes.learningRate = 0.0001;
      changes.summary.push(`Lower Learning Rate -> 0.0001`);
    }

    // Batch size extraction
    const bsMatch = lower.match(/batch size (to|of|at)?\s*([0-9]+)/i);
    if (bsMatch && bsMatch[2]) {
      const val = parseInt(bsMatch[2]);
      if ([16, 32, 64, 128].includes(val)) {
        changes.batchSize = val;
        changes.summary.push(`Set Batch Size -> ${val}`);
      }
    }

    // Metacognition Factor extraction
    const metaMatch = lower.match(/metacognition factor (to|of|at)?\s*([0-9.]+)/i) ||
                      lower.match(/metacognition (to|of|at)?\s*([0-9.]+)/i);
    if (metaMatch && metaMatch[2]) {
      const val = parseFloat(metaMatch[2]);
      if (!isNaN(val) && val >= 0 && val <= 1) {
        changes.metacognitionFactor = val;
        changes.summary.push(`Set Metacognition Factor -> ${val.toFixed(2)}`);
      }
    } else if (lower.includes('increase metacognition') || lower.includes('high metacognition')) {
      changes.metacognitionFactor = 0.95;
      changes.summary.push(`Increase Metacognition Factor -> 0.95 (High Reflexive Loop)`);
    }

    // Empathy Factor extraction
    const empMatch = lower.match(/empathy factor (to|of|at)?\s*([0-9.]+)/i) ||
                     lower.match(/empathy (to|of|at)?\s*([0-9.]+)/i);
    if (empMatch && empMatch[2]) {
      const val = parseFloat(empMatch[2]);
      if (!isNaN(val) && val >= 0 && val <= 1) {
        changes.empathyFactor = val;
        changes.summary.push(`Set Empathy Factor -> ${val.toFixed(2)}`);
      }
    }

    // Add Layer commands
    if (lower.includes('add dense layer') || lower.includes('stack a dense layer') || lower.includes('add dense')) {
      changes.addLayerType = 'Dense';
      const nodesMatch = lower.match(/(dense layer with|with)\s*([0-9]+)\s*(nodes|units)?/i);
      if (nodesMatch && nodesMatch[2]) {
        changes.layerNodes = parseInt(nodesMatch[2]);
        changes.summary.push(`Add Dense Layer with ${changes.layerNodes} units`);
      } else {
        changes.summary.push(`Add Dense Layer (256 units, ReLU)`);
      }
    } else if (lower.includes('add attention') || lower.includes('attention layer')) {
      changes.addLayerType = 'Attention';
      changes.summary.push(`Add Multi-Head Attention Layer`);
    } else if (lower.includes('add critic') || lower.includes('metacognitive critic')) {
      changes.addLayerType = 'MetacognitiveCritic';
      changes.summary.push(`Add Metacognitive Critic Node`);
    }

    // Project Name extraction
    const nameMatch = lower.match(/project name (to|is)?\s*["']?([^"'.]+)["']?/i);
    if (nameMatch && nameMatch[2]) {
      changes.projectName = nameMatch[2].trim();
      changes.summary.push(`Update Project Identifier -> "${changes.projectName}"`);
    }

    setParsedChanges(changes);
  };

  const handleApply = () => {
    onApplyVoiceConfig({
      hyperparameters: {
        ...(parsedChanges.learningRate && { learningRate: parsedChanges.learningRate }),
        ...(parsedChanges.batchSize && { batchSize: parsedChanges.batchSize }),
        ...(parsedChanges.empathyFactor && { empathyFactor: parsedChanges.empathyFactor }),
        ...(parsedChanges.metacognitionFactor && { metacognitionFactor: parsedChanges.metacognitionFactor })
      },
      newLayer: parsedChanges.addLayerType,
      layerNodes: parsedChanges.layerNodes,
      projectName: parsedChanges.projectName
    });
    stopRecording();
    onClose();
  };

  const handleUsePresetVoice = (phrase: string) => {
    setTranscript(phrase);
    parseSpokenDirectives(phrase);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-950 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Voice Training & Architectural Dictation
              </h3>
              <p className="text-xs text-slate-400">
                Speak architectural parameters into the microphone to configure layers and hyperparameters.
              </p>
            </div>
          </div>

          <button
            onClick={() => { stopRecording(); onClose(); }}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Microphone Audio Waveform & Status */}
        <div className="p-4 bg-slate-950 rounded border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <canvas ref={canvasRef} width={400} height={48} className="w-full h-12 rounded" />
          
          <div className="flex items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-4 py-2 rounded font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecording ? 'Listening (Click to Stop)' : 'Start Microphone Training'}
            </button>
            
            <span className="text-xs font-mono text-slate-400">
              {isRecording ? `Audio Input Active · Level: ${audioFeedbackLevel.toFixed(0)}` : 'Microphone Inactive'}
            </span>
          </div>

          {permissionError && (
            <div className="text-xs font-mono text-amber-300 flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}
        </div>

        {/* Live Spoken Transcript */}
        <div className="space-y-1.5 font-mono text-xs">
          <label className="text-slate-400 text-[11px] uppercase tracking-wider block">Spoken Transcript & Input</label>
          <textarea
            rows={2}
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              parseSpokenDirectives(e.target.value);
            }}
            placeholder='Speak or type directives (e.g., "Add dense layer with 256 units and set learning rate to 0.0005")...'
            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none font-mono"
          />
        </div>

        {/* Quick Sample Voice Prompts */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-500">Quick Test Samples:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Add dense layer with 256 units and set learning rate to 0.0005',
              'Set metacognition factor to 0.95 and empathy factor to 0.85',
              'Add attention layer and set batch size to 64'
            ].map((sample) => (
              <button
                key={sample}
                onClick={() => handleUsePresetVoice(sample)}
                className="text-[11px] font-mono px-2 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded transition-colors text-left"
              >
                "{sample.substring(0, 36)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Parsed Parameter Directives Box */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Extracted Architectural Directives ({parsedChanges.summary.length})
            </span>
            <span className="text-slate-500 text-[11px]">NLP Parameter Mapper</span>
          </div>

          {parsedChanges.summary.length === 0 ? (
            <div className="text-slate-600 text-xs font-mono py-1">
              No directives parsed yet. Say or select a phrase to extract configuration parameters.
            </div>
          ) : (
            <div className="space-y-1">
              {parsedChanges.summary.map((item, idx) => (
                <div key={idx} className="text-xs font-mono text-slate-200 flex items-center gap-2">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
          <button
            onClick={() => { stopRecording(); onClose(); }}
            className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={parsedChanges.summary.length === 0}
            className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono rounded transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span>Apply Voice Directives to Model</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
