import React, { useState } from 'react';
import { X, CheckCircle2, Send, Cpu } from 'lucide-react';
import { registerInterest } from '../services/api.ts';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [framework, setFramework] = useState('WebGPU / Browser Wasm');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ledgerId: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid developer email address.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await registerInterest(email);
      setResult({
        ledgerId: response.ledgerId,
        message: response.message
      });
    } catch (err: any) {
      setError(err.message || 'Failed to register interest.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
    >
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {!result ? (
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 id="waitlist-title" className="text-lg font-bold text-slate-100">
                Resonance Labs Developer Access
              </h3>
            </div>
            
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Register for early access to the unified WebGPU neural designer, Actor-Critic telemetry gateway, and multi-model routing clusters.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Developer Email</label>
                <input
                  type="email"
                  required
                  placeholder="engineer@research-lab.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Primary Runtime Target</label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="WebGPU / Browser Wasm">WebGPU & Browser Wasm</option>
                  <option value="Node.js Express Gateway">Node.js Express Gateway</option>
                  <option value="Python Telemetry Engine">Python Telemetry Engine</option>
                  <option value="PostgreSQL Relational Topology">PostgreSQL Relational Topology</option>
                </select>
              </div>

              {error && (
                <div className="text-xs font-mono text-rose-400 bg-rose-950/40 p-2.5 rounded border border-rose-900/60">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded transition-colors flex items-center justify-center gap-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {loading ? (
                    'Writing to Launch Ledger...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Register Interest via API
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex justify-between">
              <span>Endpoint: POST /api/auth/register-interest</span>
              <span>Encrypted</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-100">
              Registration Confirmed
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your developer account has been recorded in the Resonance Labs launch ledger. You will receive private invite keys once your queue slot is cleared.
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs font-mono space-y-1">
              <div className="text-slate-500">ASSIGNED LEDGER ID:</div>
              <div className="text-emerald-400 font-bold text-sm">{result.ledgerId}</div>
              <div className="text-slate-400 text-[11px] mt-1">{result.message}</div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
