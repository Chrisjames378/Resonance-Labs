import React, { useState } from 'react';
import { 
  X, Check, Zap, Sparkles, Shield, ArrowRight, CreditCard, 
  RefreshCw, CheckCircle2, Download, AlertCircle, Cpu, Sliders 
} from 'lucide-react';
import { UserSubscription, SubscriptionTier, BillingCycle } from '../types/index.ts';
import { completePayPalCheckout, cancelSubscription } from '../services/api.ts';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: UserSubscription;
  onSubscriptionUpdated: (updated: UserSubscription) => void;
  initialSelectedTier?: SubscriptionTier;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  onSubscriptionUpdated,
  initialSelectedTier
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [tokenPackCount, setTokenPackCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'tiers' | 'paypal_modal' | 'success'>('tiers');
  
  // Checkout details
  const [checkoutPayload, setCheckoutPayload] = useState<{
    type: 'subscription' | 'token_pack';
    tier: SubscriptionTier;
    cycle: BillingCycle;
    amount: number;
    packs?: number;
    planName: string;
  }>({
    type: 'subscription',
    tier: initialSelectedTier || 'pro',
    cycle: 'monthly',
    amount: 29,
    planName: 'Pro Researcher'
  });

  const [completedTxn, setCompletedTxn] = useState<{
    transactionId: string;
    orderId: string;
    amount: number;
    description: string;
    date: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === currentSubscription.tier && currentSubscription.billingStatus === 'ACTIVE') {
      return;
    }
    
    if (tier === 'hobby') {
      // Direct downgrade
      handleDowngradeToHobby();
      return;
    }

    const price = tier === 'pro' 
      ? (billingCycle === 'monthly' ? 29 : 290)
      : (billingCycle === 'monthly' ? 199 : 1990);
    
    setCheckoutPayload({
      type: 'subscription',
      tier,
      cycle: billingCycle,
      amount: price,
      planName: tier === 'pro' ? 'Pro Researcher' : 'Studio & Team'
    });
    setCheckoutStep('paypal_modal');
  };

  const handleSelectTokenPack = () => {
    const cost = tokenPackCount * 10;
    setCheckoutPayload({
      type: 'token_pack',
      tier: currentSubscription.tier,
      cycle: billingCycle,
      amount: cost,
      packs: tokenPackCount,
      planName: `${(tokenPackCount * 1000).toLocaleString()} Gemini Interaction Tokens`
    });
    setCheckoutStep('paypal_modal');
  };

  const handleDowngradeToHobby = async () => {
    setIsProcessing(true);
    try {
      const res = await cancelSubscription(currentSubscription.userId);
      if (res.success) {
        onSubscriptionUpdated(res.user);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const executePayPalPayment = async () => {
    setIsProcessing(true);
    try {
      const mockPaypalSubId = `I-PP${Math.random().toString(16).substring(2, 8).toUpperCase()}`;
      const mockPaypalOrderId = `ORD-PP${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

      const res = await completePayPalCheckout({
        userId: currentSubscription.userId,
        type: checkoutPayload.type,
        tier: checkoutPayload.tier,
        cycle: checkoutPayload.cycle,
        packs: checkoutPayload.packs,
        amount: checkoutPayload.amount,
        paypalSubscriptionId: mockPaypalSubId,
        paypalOrderId: mockPaypalOrderId
      });

      if (res.success) {
        onSubscriptionUpdated(res.user);
        setCompletedTxn({
          transactionId: res.transactionId,
          orderId: mockPaypalOrderId,
          amount: checkoutPayload.amount,
          description: checkoutPayload.planName,
          date: new Date().toLocaleString()
        });
        setCheckoutStep('success');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!completedTxn) return;
    const invoice = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      merchant: 'Resonance Neural Systems Inc.',
      buyerEmail: currentSubscription.email,
      paymentMethod: 'PayPal Express Checkout',
      transactionId: completedTxn.transactionId,
      orderId: completedTxn.orderId,
      product: completedTxn.description,
      amountPaid: `$${completedTxn.amount.toFixed(2)} USD`,
      status: 'PAID_SETTLED',
      timestamp: completedTxn.date,
      entitlements: checkoutPayload.type === 'subscription' 
        ? ['Full WebGPU compute', 'Server-Sent Events streaming', 'Voice Training microphone core', 'D3 Network topology visualizer']
        : [`+${(checkoutPayload.packs || 1) * 1000} Gemini Interaction tokens added to wallet`]
    };

    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resonance_PayPal_Receipt_${completedTxn.transactionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-auto">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Resonance Engine Pricing & Token Refills
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                  PayPal Enabled
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Logged in as <span className="font-mono text-slate-300">{currentSubscription.email}</span> · Current Tier: <span className="text-emerald-400 font-semibold uppercase">{currentSubscription.tier}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Plan Selector */}
        {checkoutStep === 'tiers' && (
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Header / Intro */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                Predictable Compute for Autonomous Intelligence
              </h2>
              <p className="text-sm text-slate-400">
                Equip your neural workflows with real-time SSE streaming, voice-to-architecture mic synthesis, and zero-latency Web Audio telemetry.
              </p>
              
              {/* Billing Cycle Switch */}
              <div className="pt-3 flex items-center justify-center">
                <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center text-xs font-mono">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-md transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                      billingCycle === 'annual'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Annual Billing</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700">
                      Save 17% (2 Mo Free)
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Hobby / Sandbox */}
              <div className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
                currentSubscription.tier === 'hobby'
                  ? 'bg-slate-950/70 border-slate-700 shadow-md ring-1 ring-slate-700'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
                      Hobby Tier
                    </span>
                    {currentSubscription.tier === 'hobby' && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 text-slate-100">
                      <span className="text-3xl font-extrabold">$0</span>
                      <span className="text-xs text-slate-400">/ forever</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Ideal for students, exploratory tinkering, and testing synthetic reflection loops.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>1,000 monthly Gemini tokens</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>Web Audio multi-oscillator synthesis</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>HTTP Polling Actor-Critic console</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>Up to 3 local model checkpoints</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-500">
                      <X className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                      <span>No real-time SSE streaming</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  {currentSubscription.tier === 'hobby' ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-slate-800/60 text-slate-400 cursor-default"
                    >
                      Active Free Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan('hobby')}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      {isProcessing ? 'Switching...' : 'Downgrade to Hobby'}
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Pro Researcher (Featured) */}
              <div className={`p-6 rounded-xl border flex flex-col justify-between relative transition-all ${
                currentSubscription.tier === 'pro'
                  ? 'bg-emerald-950/20 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                  : 'bg-slate-950/80 border-emerald-500/60 hover:border-emerald-400 shadow-lg'
              }`}>
                {/* Popular Pill */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-bold tracking-wider uppercase rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
                      Pro Researcher
                    </span>
                    {currentSubscription.tier === 'pro' && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                        Active Tier
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1 text-slate-100">
                      <span className="text-3xl font-extrabold">
                        {billingCycle === 'monthly' ? '$29' : '$290'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {billingCycle === 'monthly' ? '/ month' : '/ year ($24.16/mo)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Full power for ML practitioners, computational neuroscientists & sound designers.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-200">
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="font-semibold text-emerald-300">10,000 monthly Gemini tokens</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Server-Sent Events (SSE)</strong> live stream</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Voice Training Mode</strong> with mic synthesis</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>D3.js Force-Directed</strong> network visualizer</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>High-latency spike heatmap & Recharts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Unlimited neural blueprints & exports</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  {currentSubscription.tier === 'pro' && currentSubscription.billingStatus === 'ACTIVE' ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Current Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan('pro')}
                      className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      <span className="font-black text-blue-900 bg-white/30 px-1 rounded text-[11px]">P</span>
                      <span>Upgrade with PayPal (${billingCycle === 'monthly' ? '29/mo' : '290/yr'})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card 3: Studio & Team */}
              <div className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
                currentSubscription.tier === 'enterprise'
                  ? 'bg-cyan-950/20 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                      Studio & Team
                    </span>
                    {currentSubscription.tier === 'enterprise' && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                        Active Tier
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1 text-slate-100">
                      <span className="text-3xl font-extrabold">
                        {billingCycle === 'monthly' ? '$199' : '$1,990'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {billingCycle === 'monthly' ? '/ month' : '/ year ($165.83/mo)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      For production AI audio labs, enterprise teams, and game audio studios.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="font-semibold text-cyan-300">100,000 monthly tokens</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Dedicated WebSocket compute cluster</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>PostgreSQL schema & replication sync</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Custom critic loss weight fine-tuning</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Up to 10 team seats with RBAC</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>99.9% SLA & 24/7 priority support</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  {currentSubscription.tier === 'enterprise' ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      Current Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan('enterprise')}
                      className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      <span className="font-black text-blue-900 bg-white/30 px-1 rounded text-[11px]">P</span>
                      <span>Subscribe with PayPal</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Token Pack Top-Up Card */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    Need Extra Compute? Instant Token Add-On Packs
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60">
                      $10 for 1,000 Tokens
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No recurring commitment. Instantly credited to your Gemini Interactions API wallet via PayPal.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs font-mono">
                  {[1, 2, 5, 10].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setTokenPackCount(qty)}
                      className={`px-3 py-1 rounded transition-colors ${
                        tokenPackCount === qty
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {qty * 1000} tk (${qty * 10})
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSelectTokenPack}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Buy with PayPal (${tokenPackCount * 10})</span>
                </button>
              </div>
            </div>

            {/* PayPal Assurance Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-500 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-Bit SSL Encrypted & Protected by PayPal Buyer Protection</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Automatic instant activation</span>
                <span>Cancel online anytime with 1 click</span>
              </div>
            </div>

          </div>
        )}

        {/* STEP 2: PayPal Checkout Experience Dialog */}
        {checkoutStep === 'paypal_modal' && (
          <div className="p-6 sm:p-10 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-lg">
                  P
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    PayPal Express Checkout
                  </h3>
                  <p className="text-xs text-slate-400">
                    Merchant: <span className="text-slate-300 font-medium">Resonance Neural Systems Inc.</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutStep('tiers')}
                className="text-xs font-mono text-slate-400 hover:text-slate-200"
              >
                ← Back to Plans
              </button>
            </div>

            {/* Order Review Box */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Item Description</span>
                <span className="text-slate-200 font-bold">{checkoutPayload.planName}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Billing Terms</span>
                <span className="text-slate-200">
                  {checkoutPayload.type === 'subscription' 
                    ? `Auto-renews ${checkoutPayload.cycle}` 
                    : 'One-time immediate token credit'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Buyer Account</span>
                <span className="text-emerald-400 font-semibold">{currentSubscription.email}</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Total Amount Due</span>
                <span className="text-xl font-black text-emerald-400">
                  ${checkoutPayload.amount.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Authentic PayPal Branded Interaction Area */}
            <div className="max-w-md mx-auto space-y-3">
              <div className="text-center text-xs font-mono text-slate-400 mb-2">
                Select your PayPal payment source to complete authorization:
              </div>

              {/* PayPal Primary Button */}
              <button
                onClick={executePayPalPayment}
                disabled={isProcessing}
                className="w-full py-3 px-6 rounded-lg bg-[#FFC439] hover:bg-[#F2BA36] text-slate-900 font-bold text-sm shadow-md transition-transform active:scale-[0.99] flex items-center justify-center gap-2 group"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Communicating with PayPal Gateway...</span>
                  </>
                ) : (
                  <>
                    <span className="font-extrabold italic text-blue-900 text-base">Pay</span>
                    <span className="font-extrabold italic text-sky-600 text-base">Pal</span>
                    <span className="text-slate-800 text-xs font-semibold ml-1">
                      Check out with PayPal (${checkoutPayload.amount.toFixed(2)})
                    </span>
                  </>
                )}
              </button>

              {/* Debit or Credit Card Button */}
              <button
                onClick={executePayPalPayment}
                disabled={isProcessing}
                className="w-full py-3 px-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Debit or Credit Card (Powered by PayPal)</span>
              </button>

              <div className="pt-2 text-center text-[11px] font-mono text-slate-500">
                Sandbox Environment: Transaction settles instantaneously without charging real funds.
              </div>
            </div>

          </div>
        )}

        {/* STEP 3: Success Confirmation & Invoice Download */}
        {checkoutStep === 'success' && completedTxn && (
          <div className="p-8 sm:p-12 text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-2xl font-black text-slate-100">
                Payment Confirmed & Entitlements Unlocked!
              </h3>
              <p className="text-sm text-slate-400">
                Your PayPal authorization was processed successfully. All features and tokens are immediately accessible across your workspace.
              </p>
            </div>

            {/* Transaction Receipt Card */}
            <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-emerald-400 font-bold">{completedTxn.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PayPal Order ID:</span>
                <span className="text-slate-300">{completedTxn.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item:</span>
                <span className="text-slate-200">{completedTxn.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Charged:</span>
                <span className="text-slate-100 font-bold">${completedTxn.amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Settled At:</span>
                <span className="text-slate-400">{completedTxn.date}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleDownloadInvoice}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download PayPal Invoice Receipt (.JSON)</span>
              </button>

              <button
                onClick={() => {
                  setCheckoutStep('tiers');
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <span>Return to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
