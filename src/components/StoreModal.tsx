import React, { useState } from 'react';
import { X, Zap, Sparkles, Check, Star, Lock, Image as ImageIcon, Gift, Crown, ShieldAlert, Award, CreditCard, ArrowRight, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/telegramSdk';

export interface ActiveEntitlement {
  planId: string;
  planName: string;
  expirationDate: string;
  daysRemaining: number;
  status: 'active' | 'expired' | 'none';
}

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  energy: number;
  gems: number;
  activeEntitlement?: ActiveEntitlement | null;
  onRefreshUserData: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  energy,
  gems,
  activeEntitlement,
  onRefreshUserData
}) => {
  const [activeTab, setActiveTab] = useState<'vip' | 'store'>('vip');
  const [selectedPlanId, setSelectedPlanId] = useState<'1month' | '3months' | '1year'>('3months');
  const [paymentMethod, setPaymentMethod] = useState<'kbzpay' | 'wavepay' | 'telegram_stars'>('kbzpay');
  const [hasClaimedDaily, setHasClaimedDaily] = useState(false);
  
  // Payment Flow State
  const [step, setStep] = useState<'select' | 'instructions' | 'verifying' | 'success' | 'error'>('select');
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const PLANS = [
    {
      id: '1month',
      name: '1 MONTH VIP',
      priceMMK: 10000,
      priceFormatted: '10,000 MMK',
      badge: null,
      bonusOrbs: 100,
      desc: 'Standard VIP Access'
    },
    {
      id: '3months',
      name: '3 MONTHS VIP',
      priceMMK: 25000,
      priceFormatted: '25,000 MMK',
      badge: 'MOST POPULAR (17% OFF)',
      bonusOrbs: 350,
      desc: 'Best for Roleplay Enthusiasts'
    },
    {
      id: '1year',
      name: '1 YEAR VIP',
      priceMMK: 100000,
      priceFormatted: '100,000 MMK',
      badge: 'BEST VALUE (20% OFF)',
      bonusOrbs: 1500,
      desc: 'Ultimate Empress All-Access'
    }
  ];

  const orbPackages = [
    { id: 'pack-100', name: 'Novice Spellbook', gems: 100, priceMMK: 3000, priceFormatted: '3,000 MMK', badge: null, icon: '🔮' },
    { id: 'pack-350', name: 'Crimson Vault', gems: 350, priceMMK: 9000, priceFormatted: '9,000 MMK', badge: 'MOST POPULAR', icon: '💎' },
    { id: 'pack-850', name: 'Enchanted Grimoire', gems: 850, priceMMK: 20000, priceFormatted: '20,000 MMK', badge: 'FREE BOT SLOT', icon: '👑' },
    { id: 'pack-2400', name: 'Multiverse Empress', gems: 2400, priceMMK: 50000, priceFormatted: '50,000 MMK', badge: 'BEST VALUE', icon: '🌌' }
  ];

  const handleClaimDaily = async () => {
    if (hasClaimedDaily || isSubmitting) return;
    try {
      setIsSubmitting(true);
      triggerHaptic('heavy');
      const res = await fetch('/api/user/claim-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setHasClaimedDaily(true);
        onRefreshUserData();
        alert('🎁 Daily Blessing Claimed! +25 Starlight Energy added to your Supabase profile!');
      } else {
        alert(data.error || 'Failed to claim daily reward');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error claiming daily reward');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePaymentOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    triggerHaptic('medium');

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          paymentMethod
        })
      });

      const data = await res.json();
      if (data.success && data.order) {
        setPendingOrder(data.order);
        setStep('instructions');
      } else {
        setErrorMessage(data.error || 'Failed to initialize payment order');
        setStep('error');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Network connection failure creating payment order.');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!pendingOrder) return;
    if (paymentMethod !== 'telegram_stars' && !transactionRef.trim()) {
      alert('Please enter your transaction reference number / receipt ID');
      return;
    }

    setIsSubmitting(true);
    setStep('verifying');
    triggerHaptic('heavy');

    try {
      const res = await fetch('/api/payments/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pendingOrder.id,
          transactionRef: transactionRef.trim() || 'TELEGRAM_STARS_VERIFIED'
        })
      });

      const data = await res.json();
      if (data.success) {
        setStep('success');
        onRefreshUserData();
      } else {
        setErrorMessage(data.error || 'Payment verification failed. Please check reference ID.');
        setStep('error');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Verification request failed. Please check network connectivity.');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePlanObj = PLANS.find(p => p.id === selectedPlanId);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#0e0716] border border-rose-800/50 rounded-3xl w-full max-w-md shadow-2xl shadow-rose-950/80 overflow-hidden flex flex-col my-auto max-h-[92vh] relative">
        {/* Header */}
        <div className="bg-[#140a1f] px-4 py-3 border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-rose-600 to-purple-600">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide">
                RubyChan 2.0 Store & VIP
              </h2>
              <p className="text-[10px] text-rose-300/80 font-medium">Official MMK Payment Gateway</p>
            </div>
          </div>

          {/* Energy & Gems indicator */}
          <div className="flex items-center space-x-2">
            <div className="bg-[#1e102d] border border-rose-700/50 rounded-full px-2.5 py-1 flex items-center space-x-2 text-xs font-bold text-slate-100 shadow-inner shrink-0">
              <span className="flex items-center text-amber-400 gap-0.5" title="Mana Energy">
                <Zap className="w-3.5 h-3.5 fill-amber-400" /> {energy}
              </span>
              <span className="w-px h-3 bg-rose-800/60" />
              <span className="flex items-center text-rose-300 gap-0.5" title="Ruby Orbs">
                🔮 {gems}
              </span>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1.5 rounded-full bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white transition-all border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Plan Entitlement Status Bar */}
        <div className="bg-[#180d26] px-4 py-2 border-b border-rose-900/30 flex items-center justify-between text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">YOUR PLAN:</span>
          {activeEntitlement && activeEntitlement.status === 'active' ? (
            <span className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {activeEntitlement.planName} ({activeEntitlement.daysRemaining} days left)
            </span>
          ) : (
            <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
              FREE PLAN (Upgrade available)
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-rose-900/30 bg-[#0a0412]">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('vip');
              setStep('select');
            }}
            className={`flex-1 py-2.5 text-xs font-black transition-all ${
              activeTab === 'vip'
                ? 'text-rose-300 border-b-2 border-rose-500 bg-rose-950/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👑 EMPRESS VIP PLANS
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('store');
              setStep('select');
            }}
            className={`flex-1 py-2.5 text-xs font-black transition-all ${
              activeTab === 'store'
                ? 'text-rose-300 border-b-2 border-rose-500 bg-rose-950/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔮 RUBY ORBS PACKS
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-200 flex-1">
          {activeTab === 'vip' ? (
            <>
              {step === 'select' && (
                <div className="space-y-4">
                  {/* VIP Plan Selection Cards */}
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold uppercase text-slate-400">1. Select Membership Duration:</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {PLANS.map((plan) => (
                        <div
                          key={plan.id}
                          onClick={() => {
                            triggerHaptic('light');
                            setSelectedPlanId(plan.id as any);
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative flex items-center justify-between ${
                            selectedPlanId === plan.id
                              ? 'border-rose-500 bg-rose-950/50 ring-1 ring-rose-500 shadow-xl shadow-rose-950/70'
                              : 'border-rose-900/40 bg-[#140a1f] hover:border-rose-700/60'
                          }`}
                        >
                          {plan.badge && (
                            <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-rose-600 to-purple-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                              {plan.badge}
                            </span>
                          )}

                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-black text-sm text-white">{plan.name}</h3>
                              <span className="text-[10px] text-amber-400 font-bold">+{plan.bonusOrbs} Orbs Bonus</span>
                            </div>
                            <p className="text-[11px] text-slate-300">{plan.desc}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-rose-300">{plan.priceFormatted}</p>
                            <span className="text-[9px] text-slate-400 font-medium">MMK Authoritative</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-extrabold uppercase text-slate-400">2. Choose Payment Provider:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setPaymentMethod('kbzpay');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all font-bold text-xs ${
                          paymentMethod === 'kbzpay'
                            ? 'bg-blue-950/80 border-blue-500 text-blue-200 ring-1 ring-blue-500'
                            : 'bg-[#140a1f] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        💙 KBZPay
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setPaymentMethod('wavepay');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all font-bold text-xs ${
                          paymentMethod === 'wavepay'
                            ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                            : 'bg-[#140a1f] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        💛 WavePay
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setPaymentMethod('telegram_stars');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all font-bold text-xs ${
                          paymentMethod === 'telegram_stars'
                            ? 'bg-purple-950/80 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                            : 'bg-[#140a1f] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        ⭐ TG Stars
                      </button>
                    </div>
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-2 bg-[#140a1f]/80 p-3 rounded-2xl border border-rose-900/40">
                    <div className="flex items-start space-x-2.5 text-xs">
                      <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                        <Zap className="w-4 h-4 fill-amber-400" />
                      </div>
                      <div>
                        <p className="font-extrabold text-white">Unlimited Mana & Roleplay</p>
                        <p className="text-[10px] text-slate-400">Zero rate limits, zero waiting cooldowns</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5 text-xs">
                      <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg shrink-0">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-white">Unlock All VIP Characters</p>
                        <p className="text-[10px] text-slate-400">Access exclusive unrated roleplay companions</p>
                      </div>
                    </div>
                  </div>

                  {/* Proceed Button */}
                  <button
                    onClick={handleCreatePaymentOrder}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-950/80 active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>PROCEED TO PAYMENT ({activePlanObj?.priceFormatted})</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === 'instructions' && pendingOrder && (
                <div className="space-y-4">
                  <div className="bg-[#180b28] border border-rose-800/60 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
                      <span className="text-xs font-bold text-slate-400">ORDER SUMMARY</span>
                      <span className="text-xs font-mono font-bold text-rose-300">ORDER #{pendingOrder.id.slice(0, 8)}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-300">Selected Plan: <strong className="text-white">{activePlanObj?.name}</strong></p>
                      <p className="text-sm font-black text-rose-300">Authoritative Amount: {pendingOrder.amountMmk.toLocaleString()} MMK</p>
                      <p className="text-xs text-slate-400">Method: <span className="uppercase text-amber-300 font-bold">{pendingOrder.paymentMethod}</span></p>
                    </div>

                    {paymentMethod === 'kbzpay' && (
                      <div className="bg-blue-950/50 border border-blue-500/40 p-3 rounded-xl space-y-1.5 text-xs">
                        <p className="font-extrabold text-blue-300">💙 KBZPay Official Merchant Transfer:</p>
                        <p className="text-slate-200">Phone / Account: <strong className="text-white font-mono">09 788 123 456</strong></p>
                        <p className="text-slate-200">Account Name: <strong className="text-white">RubyChan 2.0 Media Co.</strong></p>
                        <p className="text-[10px] text-slate-400">Send exact {pendingOrder.amountMmk.toLocaleString()} MMK and copy your transaction reference number below.</p>
                      </div>
                    )}

                    {paymentMethod === 'wavepay' && (
                      <div className="bg-amber-950/50 border border-amber-500/40 p-3 rounded-xl space-y-1.5 text-xs">
                        <p className="font-extrabold text-amber-300">💛 WavePay Official Transfer:</p>
                        <p className="text-slate-200">Phone / Account: <strong className="text-white font-mono">09 788 123 456</strong></p>
                        <p className="text-slate-200">Account Name: <strong className="text-white">RubyChan 2.0 Media Co.</strong></p>
                        <p className="text-[10px] text-slate-400">Send exact {pendingOrder.amountMmk.toLocaleString()} MMK and copy your Transaction ID.</p>
                      </div>
                    )}

                    {paymentMethod === 'telegram_stars' && (
                      <div className="bg-purple-950/50 border border-purple-500/40 p-3 rounded-xl space-y-1 text-xs">
                        <p className="font-extrabold text-purple-300">⭐ Telegram Stars Auto-Verification:</p>
                        <p className="text-slate-300">Instant activation via official Telegram Stars payment route.</p>
                      </div>
                    )}
                  </div>

                  {paymentMethod !== 'telegram_stars' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Transaction Ref / Receipt ID:</label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. 20260812987654321"
                        className="w-full bg-[#12071d] border border-rose-800/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setStep('select')}
                      className="py-3 px-4 bg-slate-900 text-slate-400 hover:text-white rounded-2xl font-bold text-xs border border-slate-800"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleVerifyPayment}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-950/80 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>VERIFY & ACTIVATE NOW</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 'verifying' && (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-rose-400 animate-spin mx-auto" />
                  <h3 className="text-sm font-bold text-white">Server Verification in Progress...</h3>
                  <p className="text-xs text-slate-400">Communicating with Supabase and Payment Engine...</p>
                </div>
              )}

              {step === 'success' && (
                <div className="bg-emerald-950/40 border border-emerald-500/50 p-6 rounded-3xl text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">VIP Membership Activated!</h3>
                    <p className="text-xs text-emerald-200">Your profile has been upgraded in Supabase.</p>
                  </div>
                  <button
                    onClick={() => {
                      setStep('select');
                      onClose();
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl transition-all"
                  >
                    CLOSE & START CHATTING
                  </button>
                </div>
              )}

              {step === 'error' && (
                <div className="bg-rose-950/50 border border-rose-500/50 p-6 rounded-3xl text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white">Payment Error</h3>
                    <p className="text-xs text-rose-300">{errorMessage || 'An error occurred processing your payment.'}</p>
                  </div>
                  <button
                    onClick={() => setStep('select')}
                    className="w-full py-3 bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs rounded-2xl transition-all"
                  >
                    TRY AGAIN
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Daily Bonus Banner */}
              <div className="bg-gradient-to-r from-rose-950 via-purple-950 to-slate-950 border border-rose-600/50 rounded-2xl p-3.5 flex items-center justify-between shadow-xl relative overflow-hidden">
                <div className="space-y-1 z-10 max-w-[68%]">
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    Daily Reward
                  </span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1 mt-0.5">
                    Daily Blessing Chest
                  </h3>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Claim your daily free +25 Starlight Energy!
                  </p>
                  <button
                    onClick={handleClaimDaily}
                    disabled={hasClaimedDaily || isSubmitting}
                    className={`mt-2 text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all ${
                      hasClaimedDaily
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white active:scale-95'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>{hasClaimedDaily ? 'Claimed Today ✓' : 'Claim Free Gift'}</span>
                  </button>
                </div>

                <div className="w-16 h-16 bg-rose-950/80 rounded-2xl border border-rose-500/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  🎁
                </div>
              </div>

              {/* Ruby Orb Bundles Grid */}
              <div className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase text-slate-400">Available Orb Packages:</p>
                <div className="grid grid-cols-2 gap-3">
                  {orbPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={async () => {
                        triggerHaptic('heavy');
                        const confirmed = confirm(`Acquire ${pkg.gems} Ruby Orbs for ${pkg.priceFormatted}?`);
                        if (confirmed) {
                          try {
                            const res = await fetch('/api/payments/create-order', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                planId: pkg.id,
                                paymentMethod: 'kbzpay'
                              })
                            });
                            const data = await res.json();
                            if (data.success && data.order) {
                              setPendingOrder(data.order);
                              setActiveTab('vip');
                              setStep('instructions');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                      className={`bg-[#150a22] border ${
                        pkg.badge ? 'border-rose-500 shadow-lg shadow-rose-950/60' : 'border-slate-800/80'
                      } rounded-2xl p-3.5 text-center cursor-pointer hover:border-rose-400 transition-all group relative flex flex-col justify-between`}
                    >
                      {pkg.badge && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-purple-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                          {pkg.badge}
                        </span>
                      )}

                      <div className="w-12 h-12 rounded-2xl bg-rose-950/50 border border-rose-800/40 flex items-center justify-center text-2xl mx-auto my-1 group-hover:scale-110 transition-transform">
                        {pkg.icon}
                      </div>

                      <div className="space-y-1">
                        <p className="font-extrabold text-xs text-white">{pkg.name}</p>
                        <p className="font-black text-sm text-rose-300">+{pkg.gems} Orbs</p>
                        <button className="mt-2 bg-rose-950 group-hover:bg-gradient-to-r group-hover:from-rose-600 group-hover:to-purple-600 text-rose-200 group-hover:text-white border border-rose-800/50 px-3 py-1.5 rounded-xl text-xs font-black w-full flex items-center justify-center gap-1 transition-all">
                          {pkg.priceFormatted}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <p className="text-[10px] text-slate-500 text-center">
            🔒 Payments are securely completed via Official Pay Gate & Supabase Entitlements.
          </p>
        </div>
      </div>
    </div>
  );
};
