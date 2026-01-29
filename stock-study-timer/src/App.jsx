import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  TrendingUp, TrendingDown, Minus, Lock, Unlock, Zap, Briefcase,
  Newspaper, AlertCircle, FlaskConical, PenTool, GraduationCap,
  Rocket, Landmark, LayoutDashboard, BarChart3, Clock, Palette, 
  Eye, Coffee, Brain, BookOpen, GraduationCap as Cap, Award, Trash2,
  CheckCircle2, XCircle
} from "lucide-react";
import useSound from 'use-sound';

// --- Configuration & Assets ---
const STARTING_BANK = 500; 

const THEMES = {
  emerald: { 
    name: "Library Quiet", primary: "emerald", bg: "bg-slate-950", card: "bg-slate-900/40",
    border: "border-slate-800", accent: "text-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-500", 
    hex: "#10b981", iconBg: "bg-emerald-500", iconText: "text-slate-950"
  },
  purple: { 
    name: "Midnight Focus", primary: "purple", bg: "bg-indigo-950", card: "bg-indigo-900/20",
    border: "border-indigo-800/50", accent: "text-purple-400", btn: "bg-purple-600 hover:bg-purple-500", 
    hex: "#a855f7", iconBg: "bg-purple-500", iconText: "text-slate-950"
  },
  rose: { 
    name: "Finals Week", primary: "rose", bg: "bg-rose-950", card: "bg-rose-900/20",
    border: "border-rose-800/40", accent: "text-rose-400", btn: "bg-rose-600 hover:bg-rose-500", 
    hex: "#f43f5e", iconBg: "bg-rose-500", iconText: "text-slate-950"
  },
  amber: { 
    name: "Caffeine Rush", primary: "amber", bg: "bg-stone-950", card: "bg-stone-900/30",
    border: "border-stone-800/50", accent: "text-amber-400", btn: "bg-amber-600 hover:bg-amber-500", 
    hex: "#fbbf24", iconBg: "bg-amber-500", iconText: "text-slate-950"
  }
};

const WATCHLIST = [
  { ticker: "$NAP", name: "Siesta Swaps", price: "0.20", change: "+14.2%" },
  { ticker: "$WIKI", name: "Citation Index", price: "42.10", change: "-2.4%" },
  { ticker: "$RAMEN", name: "Instant Ramen ETF", price: "1.50", change: "+0.4%" },
  { ticker: "$GPT", name: "Panic Generation", price: "66.00", change: "+25.1%" },
  { ticker: "$BIRD", name: "Bird Threats", price: "9.99", change: "0.0%" },
  { ticker: "$SON", name: "Doomscroll Inc", price: "12.40", change: "-8.2%" },
];

const ASSETS = [
  { id: "bonds", name: "Gov. Study Bonds", ticker: "$SAFE", desc: "Low risk. Steady returns.", unlockAt: 0, mu: 0.025, sigma: 0.005, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <Briefcase size={16} /> },
  { id: "index", name: "S&P 500 Reading", ticker: "$READ", desc: "Market standard. Reliable returns.", unlockAt: 650, mu: 0.035, sigma: 0.020, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: <TrendingUp size={16} /> },
  { id: "supplies", name: "Stationery Futures", ticker: "$PEN", desc: "Prices of highlighters are volatile.", unlockAt: 1000, mu: 0.050, sigma: 0.040, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", icon: <PenTool size={16} /> },
  { id: "tech", name: "Tech Focus ETF", ticker: "$FOCUS", desc: "High growth, but dips often.", unlockAt: 2000, mu: 0.070, sigma: 0.060, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: <Zap size={16} /> },
  { id: "tuition", name: "Tuition Swaps", ticker: "$DEBT", desc: "Moves aggressively.", unlockAt: 4000, mu: 0.090, sigma: 0.090, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: <GraduationCap size={16} /> },
  { id: "crypto", name: "Caffeine Coin", ticker: "$CAFF", desc: "Extreme volatility.", unlockAt: 10000, mu: 0.150, sigma: 0.150, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <AlertCircle size={16} /> },
  { id: "yolo", name: "0DTE Study Options", ticker: "$YOLO", desc: "Massive gains or stagnation.", unlockAt: 50000, mu: 0.250, sigma: 0.300, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", icon: <Rocket size={16} /> }
];

const NEWS_POOL = [
  { headline: "Library AC breaks; sweat equity reaches all-time high", source: "Campus Insider" },
  { headline: "Local student avoids eye contact with professor for 4 years", source: "The Daily Avoidance" },
  { headline: "Highlighter ink shortage causes nationwide panic in Pre-Med", source: "Neon Times" },
  { headline: "Procrastination indices down as deadline gravity increases", source: "Physics Today" },
  { headline: "100% of '5-minute breaks' found to last exactly 2 hours", source: "Reality Check" },
  { headline: "Coffee shop runs out of Oat Milk; S&P 500 in freefall", source: "Morning Brew" },
  { headline: "New study: Staring at the wall actually counts as revision", source: "The Onion" },
  { headline: "Student discovers 25th hour in day; uses it to sleep", source: "Nobel Prize Committee" },
];

// --- Helpers ---
function formatMoney(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function makeSparkline(points, w, h) {
  if (points.length < 2) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = (max - min) || (max * 0.1) || 1;
  const p = 10; 
  const dw = w - p*2;
  const dh = h - p*2;
  const pts = points.map((val, i) => {
    const x = p + (i / (points.length - 1)) * dw;
    const y = p + dh - ((val - min) / span) * dh;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M${pts.join(" L")}`;
}

function getRank(bank) {
  if (bank < 300) return { title: "Academic Probation", icon: <AlertCircle size={12}/> };
  if (bank < 1000) return { title: "Student", icon: <BookOpen size={12}/> };
  if (bank < 3000) return { title: "Advanced", icon: <Brain size={12}/> };
  if (bank < 10000) return { title: "Honor Roll", icon: <Cap size={12}/> };
  return { title: "Dean's List", icon: <Award size={12}/> };
}

export default function StudyTrader() {
  // --- Audio ---
  const [playStart] = useSound('/sounds/start.mp3');
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
  const [playFail] = useSound('/sounds/fail.mp3');

  const [activeTab, setActiveTab] = useState("terminal");
  
  // Persistent Theme State
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("studyTrader_theme") || "emerald";
  });
  const theme = THEMES[currentTheme];

  const [bank, setBank] = useState(() => {
    try {
      const s = localStorage.getItem("studyTrader_bank_v1");
      return s ? Number(s) : STARTING_BANK;
    } catch { return STARTING_BANK; }
  });

  const [accountHistory, setAccountHistory] = useState(() => {
    try {
      const s = localStorage.getItem("studyTrader_equity_history");
      return s ? JSON.parse(s) : [{ t: Date.now(), v: STARTING_BANK }];
    } catch { return [{ t: Date.now(), v: STARTING_BANK }]; }
  });

  // Saving all data to localStorage
  useEffect(() => {
    localStorage.setItem("studyTrader_bank_v1", bank);
    localStorage.setItem("studyTrader_equity_history", JSON.stringify(accountHistory));
    localStorage.setItem("studyTrader_theme", currentTheme);
  }, [bank, accountHistory, currentTheme]);

  const [activeAssetId, setActiveAssetId] = useState("bonds");
  const [duration, setDuration] = useState(25); 
  const [allocation, setAllocation] = useState(100); 
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionPhase, setSessionPhase] = useState("idle"); 
  const [marketCondition, setMarketCondition] = useState("flat"); 
  const [portfolioValue, setPortfolioValue] = useState(100);
  const [history, setHistory] = useState([100]);
  const [profileTimeframe, setProfileTimeframe] = useState("ALL");

  const rafRef = useRef();
  const lastTimeRef = useRef();
  const portfolioRef = useRef(100);
  const historyRef = useRef([100]);
  const allocationRef = useRef(100); 
  const endTimeRef = useRef(null);
  const conditionRef = useRef("flat"); 

  const currentAsset = ASSETS.find(a => a.id === activeAssetId) || ASSETS[0];
  const sessionProfit = portfolioValue - allocationRef.current;
  const sessionProfitPct = allocationRef.current > 0 ? (sessionProfit / allocationRef.current) * 100 : 0;
  const isProfit = sessionProfit >= 0;
  const userRank = getRank(bank);

  // --- Dynamic Tab Title ---
  useEffect(() => {
    if (isRunning) {
      const sign = isProfit ? "+" : "";
      document.title = `${formatMMSS(secondsLeft)} | ${sign}${sessionProfitPct.toFixed(1)}%`;
    } else document.title = "Study Trader - Focus & Trade Simulator";
  }, [secondsLeft, isRunning, isProfit, sessionProfitPct]);

  // --- Market News Ticker Engine ---
  const [newsFeed, setNewsFeed] = useState(NEWS_POOL.slice(0, 3));
  useEffect(() => {
    const interval = setInterval(() => {
      setNewsFeed(prev => {
        const remaining = NEWS_POOL.filter(n => !prev.includes(n));
        const next = remaining[Math.floor(Math.random() * remaining.length)];
        return [next, ...prev.slice(0, 2)];
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.random();
      let next = r > 0.60 ? "bull" : r <= 0.20 ? "bear" : "flat";
      setMarketCondition(next);
      conditionRef.current = next;
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const resetToIdle = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
    setSessionPhase("idle");
    setSecondsLeft(duration * 60);
    setPortfolioValue(allocation);
    setHistory([allocation]);
    portfolioRef.current = allocation;
    historyRef.current = [allocation];
  };

  const startSession = (overrideDuration = null) => {
    const finalAlloc = Number(allocation);
    if (isNaN(finalAlloc) || finalAlloc <= 0) return alert("Enter valid allocation.");
    if (finalAlloc > bank) return alert("Insufficient funds!");
    
    // Play Start Sound
    playStart();

    allocationRef.current = finalAlloc;
    portfolioRef.current = finalAlloc;
    historyRef.current = [finalAlloc]; 
    setPortfolioValue(finalAlloc);
    setHistory([finalAlloc]);
    
    const totalSeconds = Math.floor((overrideDuration ?? duration) * 60);
    setSecondsLeft(totalSeconds);
    endTimeRef.current = Date.now() + (totalSeconds * 1000);
    lastTimeRef.current = Date.now();
    setSessionPhase("trading");
    setIsRunning(true);
  };

  useEffect(() => {
    if (!isRunning || sessionPhase !== "trading") return;
    const stepMarket = (dt) => {
      const dtMin = (dt / 1000) / 60; 
      let { mu, sigma } = currentAsset;
      const cond = conditionRef.current;
      if (cond === "bull") mu *= 1.2;
      else if (cond === "bear") { mu *= -0.1; sigma *= 3.0; } 
      else { mu *= 0.5; sigma *= 0.5; }
      const drift = (mu - 0.5 * sigma * sigma) * dtMin;
      const growth = Math.exp(drift + sigma * Math.sqrt(dtMin) * gaussian());
      let next = Math.max(1, portfolioRef.current * growth);
      portfolioRef.current = next;
      historyRef.current.push(next);
      if (historyRef.current.length > 500) historyRef.current.shift();
    };
    const loop = () => {
      const now = Date.now();
      const dt = now - (lastTimeRef.current || now);
      if (dt > 100) {
        const steps = Math.min(Math.floor(dt / 16), 100); 
        for (let i = 0; i < steps; i++) stepMarket(dt/steps);
      } else stepMarket(dt);
      lastTimeRef.current = now;
      setPortfolioValue(portfolioRef.current);
      setHistory([...historyRef.current]);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, sessionPhase, currentAsset]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const left = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (left <= 0) {
        const finalNet = Number((portfolioRef.current - allocationRef.current).toFixed(2));
        
        // Play Success/Fail Sounds
        if (finalNet >= 0) playSuccess();
        else playFail();

        const newBank = bank + finalNet;
        setBank(newBank);
        setAccountHistory(prev => [...prev, { t: Date.now(), v: newBank }]);
        setIsRunning(false);
        setSessionPhase("complete");
        setSecondsLeft(0);
      } else setSecondsLeft(left);
    }, 500); 
    return () => clearInterval(interval);
  }, [isRunning, bank]);

  const chartPath = useMemo(() => makeSparkline(history, 400, 150), [history]);
  const filteredEquity = useMemo(() => {
    const limits = { "1D": 86400000, "1W": 604800000, "ALL": Infinity };
    return accountHistory.filter(h => Date.now() - h.t <= (limits[profileTimeframe] || Infinity));
  }, [accountHistory, profileTimeframe]);
  const profileChartPath = useMemo(() => makeSparkline(filteredEquity.map(h => h.v), 800, 200), [filteredEquity]);

  const liveChartColor = sessionPhase === "trading" && !isProfit ? "#f43f5e" : theme.hex;

  return (
    <div className={`min-h-screen ${theme.bg} text-slate-200 font-sans transition-all duration-700 ease-in-out`}>
      {/* Ticker Tape */}
      <div className="bg-black/40 border-b border-white/5 h-8 flex items-center overflow-hidden whitespace-nowrap text-[10px] font-mono">
        <div className="flex animate-marquee gap-8">
          {[...WATCHLIST, ...WATCHLIST].map((s, i) => (
            <span key={i} className="flex gap-2 items-center">
              <span className="text-slate-500">{s.ticker}</span>
              <span className="text-white font-bold">{s.price}</span>
              <span className={s.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>{s.change}</span>
            </span>
          ))}
        </div>
      </div>

      <nav className={`border-b ${theme.border} bg-black/10 backdrop-blur-md sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={`${theme.btn} p-2 rounded-lg text-slate-950 shadow-lg transition-colors`}><TrendingUp size={20} strokeWidth={3} /></div>
              <div>
                <h1 className="font-bold text-lg text-white leading-none">Study Stocks</h1>
                <div className="flex items-center gap-1 mt-1 opacity-50 uppercase text-[9px] font-black tracking-widest">
                  {userRank.icon} {userRank.title}
                </div>
              </div>
            </div>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              {["terminal", "portfolio", "themes"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${activeTab === t ? `bg-white/10 ${theme.accent}` : 'text-slate-500'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Account Balance</div>
            <div className={`text-2xl font-mono font-bold transition-colors ${theme.accent}`}>{formatMoney(bank)}</div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "terminal" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.card} shadow-2xl transition-all`}>
                <div className={`p-6 border-b ${theme.border} flex justify-between items-center relative transition-colors`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tighter ${currentAsset.bg} ${currentAsset.color}`}>{currentAsset.ticker}</span>
                    <span className="text-sm text-slate-400 font-medium uppercase tracking-tight">{currentAsset.name}</span>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1 rounded-full text-[10px] font-black bg-black/50">
                    <div className={`flex items-center gap-2 ${marketCondition === 'bull' ? 'text-emerald-400' : marketCondition === 'bear' ? 'text-rose-400' : 'text-slate-400'}`}>
                      {marketCondition === 'bull' ? <TrendingUp size={14}/> : marketCondition === 'bear' ? <TrendingDown size={14}/> : <Minus size={14}/>}
                      {marketCondition.toUpperCase() + " MARKET"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-xl font-bold transition-colors ${isProfit ? theme.accent : 'text-rose-400'}`}>{formatMoney(portfolioValue)}</div>
                    {isRunning && (
                      <div className={`text-[11px] font-mono font-bold opacity-80 ${isProfit ? theme.accent : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{formatMoney(sessionProfit)} ({isProfit ? '+' : ''}{sessionProfitPct.toFixed(2)}%)
                      </div>
                    )}                  </div>
                </div>

                <div className="h-64 relative bg-black/20">
                  <svg className="w-full h-full p-4" viewBox="0 0 400 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={liveChartColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={liveChartColor} stopOpacity="0" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    {sessionPhase !== "idle" && (
                      <>
                        <path d={chartPath + ` L 400,150 L 0,150 Z`} fill="url(#chartGradient)" stroke="none" />
                        <path d={chartPath} fill="none" stroke={liveChartColor} strokeWidth="3" filter="url(#glow)" vectorEffect="non-scaling-stroke" />
                      </>
                    )}
                  </svg>
                  {sessionPhase === "idle" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 animate-pulse">
                      <Clock size={32} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ready to Begin Focus Session</p>
                    </div>
                  )}
                  {sessionPhase === "complete" && (
                     <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Trade Finalized - Session Complete</h2>
                        <p className="text-slate-400 mb-6 font-mono text-sm">Realized P/L: <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>{isProfit?'+':''}{formatMoney(sessionProfit)}</span></p>
                        <button onClick={resetToIdle} className={`${theme.btn} text-slate-950 font-bold py-2.5 px-8 rounded-full text-[10px] uppercase shadow-xl transition-all active:scale-95`}>Back to menu</button>
                     </div>
                  )}
                </div>

                <div className={`p-6 bg-black/40 border-t ${theme.border}`}>
                  {sessionPhase === "idle" ? (
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="flex gap-4">
                        <div className="bg-black/60 px-4 py-2 rounded-xl border border-white/5 text-center w-24">
                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Timer</div>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={duration === 0 ? "" : duration.toString().padStart(2, '0')} 
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setDuration(val ? Math.min(120, Number(val)) : 0);
                          }} 
                          className="no-arrows bg-transparent border-none outline-none w-full text-center font-mono font-bold" 
                        />
                      </div>
                        <div className="bg-black/60 px-4 py-2 rounded-xl border border-white/5 w-44 flex items-center gap-2 group">
                           <div className="flex-1">
                             <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Entry</div>
                             <div className="flex items-center font-mono font-bold text-sm"><span className="text-slate-500 mr-1">$</span><input type="number" value={allocation} onChange={e => setAllocation(Number(e.target.value))} className="no-arrows bg-transparent border-none outline-none w-full" /></div>
                           </div>
                           <button onClick={() => setAllocation(bank)} className={`text-[9px] font-black bg-white/5 hover:bg-white/10 ${theme.accent} px-2 py-1 rounded transition-colors uppercase`}>Max</button>
                        </div>
                      </div>
                      <button onClick={() => startSession()} className={`flex-1 ${theme.btn} text-slate-950 font-bold py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95`}>Begin Focus Session</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 font-mono text-2xl font-bold text-white tracking-widest">
                        <div className={`w-3 h-3 bg-${isProfit ? theme.primary : 'rose'}-500 rounded-full animate-pulse shadow-[0_0_10px_currentColor]`}></div>
                        {formatMMSS(secondsLeft)}
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm("Force end session? Profits will be voided.")) {
                            playFail(); // Play the fail sound when they quit
                            resetToIdle();
                          }
                        }} 
                        className="text-[9px] text-rose-400 font-black uppercase tracking-widest border border-rose-900/50 rounded-lg px-4 py-2.5 hover:bg-rose-500/10 transition-colors"
                      >
                        End Session Early
                      </button>                    
                      </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ASSETS.map((asset) => (
                  <button key={asset.id} disabled={bank < asset.unlockAt || sessionPhase !== "idle"} onClick={() => setActiveAssetId(asset.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${activeAssetId === asset.id ? `bg-white/10 ${theme.border} ring-1 ring-${theme.primary}-500/50` : 'bg-black/20 border-white/5 hover:border-white/10'} ${bank < asset.unlockAt ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className={`p-2 rounded-lg ${asset.bg} ${asset.color}`}>{asset.icon}</div>
                      {bank < asset.unlockAt && <Lock size={14} className="text-slate-600" />}
                    </div>
                    <div className="font-bold text-slate-200 text-sm tracking-tight">{asset.name}</div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-1">{bank < asset.unlockAt ? `Unlocks at ${formatMoney(asset.unlockAt)}` : asset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className={`border ${theme.border} ${theme.card} rounded-2xl p-5 transition-colors duration-700`}>
                <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2"><Newspaper size={14} /> Global Headlines</h3>
                <div className="space-y-4">
                  {newsFeed.map((news, i) => (
                    <div key={i} className="space-y-1 group animate-in slide-in-from-right duration-500">
                      <div className={`text-[9px] font-bold uppercase transition-colors ${theme.accent}`}>{news.source}</div>
                      <div className="text-[11px] font-medium leading-tight text-slate-300 italic group-hover:text-white transition-colors">"{news.headline}"</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`border ${theme.border} ${theme.card} rounded-2xl p-5 transition-colors duration-700`}>
                <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2"><Eye size={14} /> Market Movers</h3>
                <div className="space-y-3">
                  {WATCHLIST.map((stock, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px] group">
                      <span className="font-mono text-slate-400 group-hover:text-white transition-colors">{stock.ticker}</span>
                      <div className="text-right">
                        <div className="font-bold text-slate-200">{stock.price}</div>
                        <div className={stock.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}>{stock.change}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => confirm("Factory reset terminal? All history will be lost.") && (localStorage.clear(), window.location.reload())} 
                className="w-full py-4 flex items-center justify-center gap-2 text-[10px] text-rose-500/40 hover:text-rose-400 transition-all uppercase font-black border border-dashed border-white/5 rounded-2xl hover:border-rose-500/50 hover:bg-rose-500/5"
              >
                <Trash2 size={12} /> Wipe Session Cache
              </button>
            </div>
          </div>
        )}

        {activeTab === "portfolio" && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className={`${theme.card} border ${theme.border} rounded-3xl p-8 shadow-xl transition-all`}>
                <div className="flex justify-between items-center mb-10">
                   <div><h3 className="text-xl font-black text-white uppercase tracking-tighter">Account Graph</h3><p className="text-xs text-slate-500 tracking-tight mt-1">Net gain since user creation</p></div>
                   <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    {["1D", "1W", "ALL"].map(tf => <button key={tf} onClick={() => setProfileTimeframe(tf)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${profileTimeframe === tf ? `bg-white/10 ${theme.accent}` : 'text-slate-500'}`}>{tf}</button>)}
                   </div>
                </div>
                <div className="h-64 w-full relative bg-black/10 rounded-2xl overflow-hidden border border-white/5">
                  <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="profileGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.hex} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={theme.hex} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {profileChartPath && (
                      <>
                        <path d={profileChartPath + " L 800,200 L 0,200 Z"} fill="url(#profileGradient)" stroke="none" />
                        <path d={profileChartPath} fill="none" stroke={theme.hex} strokeWidth="3" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.1))' }} />
                      </>
                    )}
                  </svg>
                  {!profileChartPath && <div className="absolute inset-0 flex items-center justify-center text-slate-700 uppercase text-[10px] font-black tracking-[0.3em]">No Audit Data Available</div>}
                </div>
             </div>
             <div className={`${theme.card} border ${theme.border} rounded-2xl overflow-hidden shadow-lg`}>
                <div className={`px-6 py-4 border-b ${theme.border} text-[10px] font-black text-slate-500 uppercase tracking-widest bg-black/20`}>Balance Audit</div>
                <div className="divide-y divide-white/5 font-mono text-xs text-slate-400">
                  {[...accountHistory].reverse().map((entry, i) => (
                    <div key={i} className="px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500`}></div>
                        <span className="opacity-40 uppercase">{new Date(entry.t).toLocaleString()}</span>
                      </div>
                      <span className="text-white font-bold">{formatMoney(entry.v)}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === "themes" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">StudyStocks Themes</h2>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em]">Select your favorite theme</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(THEMES).map(([key, t]) => (
                <button key={key} onClick={() => setCurrentTheme(key)} className={`p-6 rounded-3xl border-2 text-left transition-all ${currentTheme === key ? `bg-white/5 border-${t.primary}-500 shadow-xl` : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                   <div className={`w-12 h-12 rounded-2xl mb-4 ${t.iconBg} ${t.iconText} flex items-center justify-center shadow-lg transition-transform active:scale-95`}><Palette size={24} /></div>
                   <div className="font-bold text-lg text-white tracking-tight">{t.name}</div>
                   <div className="text-[10px] text-slate-500 uppercase font-black mt-1 tracking-widest">Color: {key}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        input.no-arrows::-webkit-outer-spin-button,
        input.no-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.no-arrows[type=number] {
          -moz-appearance: textfield;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}