import { useState, useRef, useCallback } from "react";
import {
  LayoutDashboard, Library, TrendingUp, Upload, Flame,
  CheckCircle, XCircle, ChevronRight, Sun, Moon,
  FileText, Brain, ArrowRight, Search, Eye, RotateCcw, Zap,
  Star, Clock, BookOpen, LogOut, Settings, Layers, Plus,
  AlertTriangle, Award, Target,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen =
  | "login" | "dashboard" | "upload" | "summary"
  | "flashcards" | "quiz" | "progress" | "library";

// ─── Data ────────────────────────────────────────────────────────────────────

const perfData = [
  { day: "Jun 26", score: 58 },
  { day: "Jun 27", score: 71 },
  { day: "Jun 28", score: 66 },
  { day: "Jun 29", score: 75 },
  { day: "Jun 30", score: 82 },
  { day: "Jul 1", score: 79 },
  { day: "Jul 2", score: 88 },
];

const topicData = [
  { topic: "Photosynthesis", mastery: 85 },
  { topic: "Cell Division", mastery: 62 },
  { topic: "DNA Replication", mastery: 45 },
  { topic: "Protein Synthesis", mastery: 73 },
  { topic: "Enzyme Kinetics", mastery: 31 },
];

const decks = [
  { id: 1, title: "Biology 101 — Chapter 5", subject: "Biology", cards: 42, mastery: 78, studied: "2 hours ago", status: "reviewing", weak: 6 },
  { id: 2, title: "Organic Chemistry Mechanisms", subject: "Chemistry", cards: 67, mastery: 45, studied: "Yesterday", status: "weak", weak: 18 },
  { id: 3, title: "World History: Cold War", subject: "History", cards: 38, mastery: 92, studied: "3 days ago", status: "mastered", weak: 2 },
  { id: 4, title: "Calculus II — Integration", subject: "Mathematics", cards: 55, mastery: 61, studied: "4 days ago", status: "reviewing", weak: 11 },
  { id: 5, title: "Spanish Grammar & Verbs", subject: "Language", cards: 89, mastery: 34, studied: "1 week ago", status: "weak", weak: 31 },
  { id: 6, title: "Macroeconomics Principles", subject: "Economics", cards: 44, mastery: 88, studied: "5 days ago", status: "mastered", weak: 3 },
];

const flashcards = [
  {
    front: "What is the primary function of the mitochondria?",
    back: "The mitochondria produces ATP through cellular respiration — hence the \"powerhouse of the cell\". It also plays roles in cell signaling, apoptosis, and thermogenesis.",
  },
  {
    front: "Define osmosis in the context of cell biology.",
    back: "Osmosis is the passive movement of water through a selectively permeable membrane from a region of lower solute concentration to higher solute concentration, equalizing concentrations.",
  },
  {
    front: "State the Central Dogma of molecular biology.",
    back: "DNA → RNA → Protein. Genetic information is transcribed from DNA to mRNA by RNA polymerase, then translated from mRNA into a polypeptide chain by ribosomes. Information flows in one direction.",
  },
  {
    front: "What is the role of ATP synthase in cellular respiration?",
    back: "ATP synthase (Complex V) uses the proton gradient across the inner mitochondrial membrane to drive phosphorylation of ADP to ATP. Protons flow through the enzyme, causing rotation of the F0 subunit and conformational changes in F1 that synthesize ATP.",
  },
];

const quiz = [
  {
    q: "Which organelle is the primary site of protein synthesis in eukaryotic cells?",
    opts: ["Mitochondria", "Ribosome", "Golgi apparatus", "Lysosome"],
    correct: 1,
    exp: "Ribosomes are the molecular machines responsible for translation — reading mRNA and assembling amino acids into proteins. They are found free in the cytoplasm or bound to the rough endoplasmic reticulum.",
  },
  {
    q: "What type of chemical bond holds complementary base pairs together in DNA?",
    opts: ["Covalent bonds", "Ionic bonds", "Hydrogen bonds", "Van der Waals forces"],
    correct: 2,
    exp: "Hydrogen bonds connect A–T (2 bonds) and G–C (3 bonds) base pairs. Though individually weak, the cumulative effect of millions of bonds gives DNA its structural stability.",
  },
  {
    q: "During which phase of mitosis do chromosomes align at the equatorial plate?",
    opts: ["Prophase", "Anaphase", "Telophase", "Metaphase"],
    correct: 3,
    exp: "In Metaphase, chromosomes reach maximum condensation and align along the metaphase plate. Spindle fibers from both poles attach to kinetochores on each sister chromatid, ensuring equal distribution.",
  },
];

const summaryContent = {
  title: "Biology 101 — Chapter 5: Cell Energetics",
  subtitle: "Uploaded from PDF · 24 pages · Processed Jul 2, 2025",
  summary: `Chapter 5 explores how cells capture, store, and use energy to sustain life processes. The chapter begins with an overview of <mark>ATP (adenosine triphosphate)</mark>, the universal energy currency of the cell, examining how its phosphate bonds store chemical energy that can be rapidly released.

The chapter then details <mark>cellular respiration</mark>, tracing the complete oxidation of glucose through three interconnected stages: glycolysis (cytoplasm), the Krebs cycle (mitochondrial matrix), and <mark>oxidative phosphorylation</mark> (inner mitochondrial membrane). Key emphasis is placed on the chemiosmotic gradient and the role of <mark>ATP synthase</mark> in harnessing proton flow.

Photosynthesis is examined as the complementary process, covering both <mark>light-dependent reactions</mark> in the thylakoid membrane and the <mark>Calvin cycle</mark> in the stroma. The chapter concludes by connecting these pathways to broader metabolic regulation, including the role of enzymes and allosteric feedback in controlling cellular energy balance.`,
  concepts: [
    "ATP structure & hydrolysis",
    "Glycolysis pathway",
    "Krebs / Citric acid cycle",
    "Electron transport chain",
    "Chemiosmosis & ATP synthase",
    "Light-dependent reactions",
    "Calvin cycle (light-independent)",
    "Metabolic regulation",
  ],
};

// ─── Utility components ──────────────────────────────────────────────────────

function RingProgress({
  pct, size = 72, stroke = 6, color = "#6B1E2B", trackColor = "rgba(139,94,60,0.18)",
}: { pct: number; size?: number; stroke?: number; color?: string; trackColor?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${circ}`} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        fontSize={size / 5.2} fontWeight="600" fill={color} fontFamily="Work Sans, sans-serif"
      >{pct}%</text>
    </svg>
  );
}

function ProgressBar({ value, color = "#6B1E2B" }: { value: number; color?: string }) {
  return (
    <div className="w-full rounded-full h-1.5" style={{ backgroundColor: "rgba(107,30,43,0.1)" }}>
      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

const statusMeta: Record<string, { bg: string; text: string; label: string; color: string }> = {
  mastered: { bg: "#D4E8D8", text: "#2D5A38", label: "Mastered", color: "#3A6B45" },
  reviewing: { bg: "#F0E0B0", text: "#6B5020", label: "Reviewing", color: "#8B7020" },
  weak: { bg: "#E8CCCF", text: "#6B1E2B", label: "Weak Areas", color: "#6B1E2B" },
};

function Badge({ status }: { status: string }) {
  const c = statusMeta[status] || statusMeta.reviewing;
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full tracking-wide"
      style={{ backgroundColor: c.bg, color: c.text }}>{c.label}
    </span>
  );
}

function SubjectIcon({ subject }: { subject: string }) {
  const map: Record<string, string> = {
    Biology: "🧬", Chemistry: "⚗️", History: "🏛️",
    Mathematics: "∑", Language: "🗣️", Economics: "📊",
  };
  return <span className="text-lg">{map[subject] || "📚"}</span>;
}

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavBtn({
  active, onClick, icon: Icon, children,
}: { active: boolean; onClick: () => void; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
        active
          ? "bg-[#6B1E2B] text-[#FAF6F0]"
          : "text-[rgba(245,240,232,0.58)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[#FAF6F0]",
      ].join(" ")}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {children}
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const mainNav = [
  { id: "dashboard" as Screen, icon: LayoutDashboard, label: "Dashboard" },
  { id: "library" as Screen, icon: Library, label: "Library" },
  { id: "progress" as Screen, icon: TrendingUp, label: "Progress" },
  { id: "upload" as Screen, icon: Upload, label: "Upload" },
];

const studyNav = [
  { id: "flashcards" as Screen, icon: Layers, label: "Flashcards" },
  { id: "quiz" as Screen, icon: Brain, label: "Quiz Mode" },
  { id: "summary" as Screen, icon: FileText, label: "Summary" },
];

function Sidebar({
  screen, setScreen, darkMode, toggleDark, onLogout,
}: {
  screen: Screen; setScreen: (s: Screen) => void;
  darkMode: boolean; toggleDark: () => void; onLogout: () => void;
}) {
  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#6B1E2B]">
            <BookOpen className="w-4 h-4 text-[#FAF6F0]" />
          </div>
          <div>
            <p className="font-bold text-sidebar-foreground text-sm tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
              Scholar AI
            </p>
            <p className="text-[10px] text-[rgba(245,240,232,0.4)]">Personal Tutor</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-3 mt-1 text-[rgba(245,240,232,0.35)]">
          Navigate
        </p>
        {mainNav.map(({ id, icon, label }) => (
          <NavBtn key={id} active={screen === id} onClick={() => setScreen(id)} icon={icon}>{label}</NavBtn>
        ))}

        <div className="pt-3 mt-2 border-t border-sidebar-border">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-3 text-[rgba(245,240,232,0.35)]">
            Study
          </p>
          {studyNav.map(({ id, icon, label }) => (
            <NavBtn key={id} active={screen === id} onClick={() => setScreen(id)} icon={icon}>{label}</NavBtn>
          ))}
        </div>

        {/* Streak widget */}
        <div className="mx-1 mt-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(107,30,43,0.25)", border: "1px solid rgba(107,30,43,0.3)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-[#E07850]" />
            <span className="text-[#FAF6F0] text-sm font-semibold">12-day streak</span>
          </div>
          <p className="text-[rgba(245,240,232,0.5)] text-xs leading-relaxed">Study 3 more cards to keep it going!</p>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        <NavBtn active={false} onClick={toggleDark} icon={darkMode ? Sun : Moon}>
          {darkMode ? "Light mode" : "Dark mode"}
        </NavBtn>
        <NavBtn active={false} onClick={() => setScreen("dashboard")} icon={Settings}>Settings</NavBtn>
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-[#6B1E2B] text-[#FAF6F0]">
            ER
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-sidebar-foreground">Elena Rodriguez</p>
            <p className="text-[10px] truncate text-[rgba(245,240,232,0.4)]">elena@stanford.edu</p>
          </div>
          <button onClick={onLogout} className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity text-sidebar-foreground">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [isSignup, setIsSignup] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all bg-[#FAF6F0] text-[#2C1810]";
  const inputStyle = { borderColor: "rgba(74,52,40,0.2)" };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      {/* Brand panel */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-14"
        style={{ background: "linear-gradient(150deg, #2C1810 0%, #4A3428 55%, #3D2B1F 100%)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#6B1E2B]">
            <BookOpen className="w-5 h-5 text-[#FAF6F0]" />
          </div>
          <span className="text-[#FAF6F0] font-semibold text-lg" style={{ fontFamily: "'Lora', serif" }}>
            Scholar AI
          </span>
        </div>

        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-bold leading-tight mb-5 text-[#FAF6F0]" style={{ fontFamily: "'Lora', serif" }}>
              Your personal<br />
              tutor,{" "}
              <em style={{ color: "#C4917A", fontStyle: "italic" }}>available 24/7.</em>
            </h1>
            <p className="text-lg leading-relaxed text-[rgba(245,240,232,0.68)]">
              Upload your study materials and let AI transform them into summaries, quizzes, and flashcards — adapted to how you learn.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { icon: Zap, text: "Instant AI-powered summaries from any PDF or document" },
              { icon: Brain, text: "Adaptive quizzes that zero in on your weak areas" },
              { icon: RotateCcw, text: "Spaced repetition to move knowledge into long-term memory" },
              { icon: Target, text: "Progress tracking and mastery scores across every topic" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(107,30,43,0.45)" }}>
                  <Icon className="w-4 h-4 text-[#C4917A]" />
                </div>
                <p className="text-[rgba(245,240,232,0.78)] text-sm leading-relaxed pt-1.5">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[rgba(245,240,232,0.35)]">Trusted by 50,000+ students at 200+ universities worldwide</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F0E8]">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#6B1E2B]">
              <BookOpen className="w-4 h-4 text-[#FAF6F0]" />
            </div>
            <span className="font-semibold text-lg text-[#2C1810]" style={{ fontFamily: "'Lora', serif" }}>Scholar AI</span>
          </div>

          <h2 className="text-[2rem] font-bold mb-1.5 text-[#2C1810]" style={{ fontFamily: "'Lora', serif" }}>
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-[#8B6E5A] mb-8">
            {isSignup ? "Start your learning journey today." : "Pick up where you left off."}
          </p>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-[#4A3428] mb-1.5">Full name</label>
                <input type="text" placeholder="Elena Rodriguez" className={inputCls} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#6B1E2B")}
                  onBlur={e => (e.target.style.borderColor = "rgba(74,52,40,0.2)")}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#4A3428] mb-1.5">Email address</label>
              <input type="email" placeholder="elena@stanford.edu" className={inputCls} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#6B1E2B")}
                onBlur={e => (e.target.style.borderColor = "rgba(74,52,40,0.2)")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A3428] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="••••••••"
                  className={`${inputCls} pr-12`} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#6B1E2B")}
                  onBlur={e => (e.target.style.borderColor = "rgba(74,52,40,0.2)")}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8B6E5A] hover:text-[#4A3428] transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isSignup && (
              <div className="text-right">
                <button type="button" className="text-sm text-[#6B1E2B] hover:opacity-75 transition-opacity font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit"
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] mt-1 bg-[#6B1E2B] text-[#FAF6F0]">
              {isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-center mt-5 text-[#8B6E5A]">
            {isSignup ? "Already have an account?" : "New to Scholar AI?"}{" "}
            <button onClick={() => setIsSignup(!isSignup)}
              className="font-semibold text-[#6B1E2B] hover:opacity-75 transition-opacity">
              {isSignup ? "Sign in" : "Create account"}
            </button>
          </p>

          <div className="mt-8 pt-6 border-t border-[rgba(74,52,40,0.15)]">
            <p className="text-xs text-center mb-4 text-[#8B6E5A]">Or continue with</p>
            <div className="grid grid-cols-2 gap-3">
              {["Google", "Apple"].map((p) => (
                <button key={p} onClick={onLogin}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all hover:opacity-80 bg-[#FAF6F0] text-[#4A3428]"
                  style={{ borderColor: "rgba(74,52,40,0.2)" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DashboardScreen ──────────────────────────────────────────────────────────

function DashboardScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const stats = [
    { label: "Study Streak", value: "12", unit: "days", icon: Flame, iconColor: "#E07850", bg: "rgba(224,120,80,0.1)" },
    { label: "Cards Mastered", value: "847", unit: "total", icon: Star, iconColor: "#8B7020", bg: "rgba(139,112,32,0.1)" },
    { label: "Avg. Score", value: "78", unit: "%", icon: Award, iconColor: "#6B1E2B", bg: "rgba(107,30,43,0.1)" },
    { label: "Due Today", value: "34", unit: "cards", icon: Clock, iconColor: "#3A6B45", bg: "rgba(58,107,69,0.1)" },
  ];

  const upcomingReviews = [
    { deck: "Biology 101 — Ch. 5", due: "Today, 3:00 PM", cards: 18, status: "weak" },
    { deck: "Calculus II — Integration", due: "Tomorrow, 10:00 AM", cards: 12, status: "reviewing" },
    { deck: "Cold War History", due: "Jul 4, 9:00 AM", cards: 5, status: "mastered" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
            Good evening, Elena
          </h1>
          <p className="text-muted-foreground mt-1">You have 34 cards due for review today.</p>
        </div>
        <button onClick={() => setScreen("upload")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Upload Material
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, unit, icon: Icon, iconColor, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon className="w-5 h-5" style={{ color: iconColor }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
              {value}<span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Performance</h3>
              <p className="text-sm text-muted-foreground">Quiz scores — last 7 days</p>
            </div>
            <span className="text-xs font-medium text-[#3A6B45] bg-[#D4E8D8] px-2.5 py-1 rounded-full">+30 pts this week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={perfData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B1E2B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6B1E2B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,30,43,0.08)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontFamily: "Work Sans" }} />
              <Area type="monotone" dataKey="score" stroke="#6B1E2B" strokeWidth={2.5} fill="url(#perfGrad)" dot={{ fill: "#6B1E2B", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#6B1E2B" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming reviews */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-1">Upcoming Reviews</h3>
          <p className="text-sm text-muted-foreground mb-5">Spaced repetition schedule</p>
          <div className="space-y-4">
            {upcomingReviews.map(({ deck, due, cards, status }) => (
              <div key={deck} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: statusMeta[status]?.color || "#8B7020" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{deck}</p>
                  <p className="text-xs text-muted-foreground">{due} · {cards} cards</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setScreen("progress")}
            className="w-full mt-5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-center">
            View full schedule
          </button>
        </div>
      </div>

      {/* Weak areas + recent decks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weak areas */}
        <div className="bg-[rgba(107,30,43,0.05)] border border-[rgba(107,30,43,0.15)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-4 h-4 text-[#6B1E2B]" />
            <h3 className="font-semibold text-[#6B1E2B]">Weak Areas</h3>
          </div>
          <div className="space-y-4">
            {topicData.filter(t => t.mastery < 60).map(({ topic, mastery }) => (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-foreground font-medium">{topic}</span>
                  <span className="text-[#6B1E2B] font-semibold">{mastery}%</span>
                </div>
                <ProgressBar value={mastery} color="#6B1E2B" />
              </div>
            ))}
          </div>
          <button onClick={() => setScreen("quiz")}
            className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold bg-[#6B1E2B] text-[#FAF6F0] hover:opacity-90 transition-opacity">
            Practice Weak Topics
          </button>
        </div>

        {/* Recent decks */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Recent Decks</h3>
            <button onClick={() => setScreen("library")} className="text-sm text-[#6B1E2B] font-medium hover:opacity-75 transition-opacity flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {decks.slice(0, 3).map((deck) => (
              <div key={deck.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                style={{ border: "1px solid var(--border)" }}
                onClick={() => setScreen("flashcards")}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted">
                  <SubjectIcon subject={deck.subject} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{deck.title}</p>
                    <Badge status={deck.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={deck.mastery} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{deck.mastery}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground">{deck.cards}</p>
                  <p className="text-xs text-muted-foreground">cards</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UploadScreen ─────────────────────────────────────────────────────────────

type UploadState = "idle" | "dragging" | "processing" | "done";

function UploadScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const startProcessing = (name: string) => {
    setFileName(name);
    setState("processing");
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) { p = 100; clearInterval(t); setState("done"); }
      setProgress(Math.min(p, 100));
    }, 280);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
    const file = e.dataTransfer.files[0];
    if (file) startProcessing(file.name);
  }, []);

  const processingSteps = [
    { label: "Parsing document structure", done: progress > 20 },
    { label: "Extracting key concepts", done: progress > 45 },
    { label: "Generating AI summary", done: progress > 70 },
    { label: "Building study materials", done: progress > 90 },
  ];

  const recentUploads = [
    { name: "Biology_Ch5_Cellular_Respiration.pdf", size: "2.4 MB", date: "Jul 1, 2025", status: "mastered" },
    { name: "Organic_Chemistry_Mechanisms.pdf", size: "5.1 MB", date: "Jun 29, 2025", status: "weak" },
    { name: "Cold_War_Chapter_Notes.docx", size: "840 KB", date: "Jun 27, 2025", status: "mastered" },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>Upload Material</h1>
        <p className="text-muted-foreground mt-1">Drop your notes, textbooks, or slides — we handle the rest.</p>
      </div>

      {state === "idle" || state === "dragging" ? (
        <div
          onDragEnter={() => setState("dragging")}
          onDragLeave={() => setState("idle")}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="relative flex flex-col items-center justify-center min-h-[320px] rounded-3xl border-2 border-dashed cursor-pointer transition-all"
          style={{
            borderColor: state === "dragging" ? "#6B1E2B" : "rgba(107,30,43,0.25)",
            backgroundColor: state === "dragging" ? "rgba(107,30,43,0.06)" : "rgba(107,30,43,0.02)",
          }}
        >
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.md"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) startProcessing(f.name); }} />

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: state === "dragging" ? "rgba(107,30,43,0.12)" : "rgba(107,30,43,0.08)" }}>
            <Upload className="w-8 h-8 text-[#6B1E2B]" style={{ opacity: state === "dragging" ? 1 : 0.7 }} />
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">
            {state === "dragging" ? "Release to upload" : "Drop your file here"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">or click to browse your files</p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {["PDF", "DOCX", "TXT", "Markdown", "Images"].map((ext) => (
              <span key={ext} className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                {ext}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Max file size: 50 MB</p>
        </div>
      ) : state === "processing" ? (
        <div className="bg-card border border-border rounded-3xl p-10 flex flex-col items-center text-center">
          <div className="relative w-20 h-20 mb-6">
            <svg className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(107,30,43,0.1)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#6B1E2B" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                style={{ transition: "stroke-dashoffset 0.3s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-[#6B1E2B]">{Math.round(progress)}%</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Lora', serif" }}>
            Processing your document
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs">{fileName}</p>
          <div className="space-y-3 text-left w-full max-w-sm">
            {processingSteps.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3">
                {done
                  ? <CheckCircle className="w-4 h-4 text-[#3A6B45] flex-shrink-0" />
                  : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />}
                <span className={`text-sm transition-colors ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-[rgba(58,107,69,0.3)] rounded-3xl p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: "#D4E8D8" }}>
            <CheckCircle className="w-8 h-8 text-[#3A6B45]" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: "'Lora', serif" }}>
            Document processed!
          </h3>
          <p className="text-sm text-muted-foreground mb-8">{fileName} — ready to study</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button onClick={() => setScreen("summary")}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              View Summary
            </button>
            <button onClick={() => setScreen("flashcards")}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
              Start Flashcards
            </button>
            <button onClick={() => setState("idle")} className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Recent uploads */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Recent Uploads</h3>
        <div className="space-y-2">
          {recentUploads.map(({ name, size, date, status }) => (
            <div key={name} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setScreen("summary")}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                <FileText className="w-4 h-4 text-[#6B1E2B]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground">{size} · {date}</p>
              </div>
              <Badge status={status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SummaryScreen ────────────────────────────────────────────────────────────

function SummaryScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [highlighted, setHighlighted] = useState(true);

  const renderSummary = (text: string) => {
    if (!highlighted) return <p className="text-foreground leading-relaxed text-[0.9375rem]">{text.replace(/<mark>|<\/mark>/g, "")}</p>;
    const parts = text.split(/(<mark>.*?<\/mark>)/g);
    return (
      <p className="text-foreground leading-relaxed text-[0.9375rem]">
        {parts.map((p, i) =>
          p.startsWith("<mark>")
            ? <mark key={i} style={{ backgroundColor: "rgba(107,30,43,0.12)", color: "#6B1E2B", borderRadius: "4px", padding: "0 3px", fontWeight: 500 }}>
              {p.replace(/<\/?mark>/g, "")}
            </mark>
            : p
        )}
      </p>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[rgba(107,30,43,0.1)] text-[#6B1E2B]">AI Summary</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>{summaryContent.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{summaryContent.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setHighlighted(!highlighted)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Zap className="w-3.5 h-3.5" />
            {highlighted ? "Plain text" : "Highlights"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-7">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#6B1E2B]" />
            Chapter Summary
          </h3>
          <div className="space-y-4">
            {summaryContent.summary.split("\n\n").map((para, i) => (
              <div key={i}>{renderSummary(para)}</div>
            ))}
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            <button onClick={() => setScreen("quiz")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Brain className="w-4 h-4" />
              Generate Quiz
            </button>
            <button onClick={() => setScreen("flashcards")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
              <Layers className="w-4 h-4" />
              Generate Flashcards
            </button>
          </div>
        </div>

        {/* Key concepts */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4 text-sm">Key Concepts</h3>
            <div className="space-y-2">
              {summaryContent.concepts.map((concept, i) => (
                <div key={concept} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[rgba(107,30,43,0.1)] text-[#6B1E2B]">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground">{concept}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-3 text-sm">Document Stats</h3>
            <div className="space-y-3">
              {[
                { label: "Pages", value: "24" },
                { label: "Key concepts", value: "8" },
                { label: "Flashcards generated", value: "42" },
                { label: "Quiz questions", value: "15" },
                { label: "Reading time", value: "~18 min" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FlashcardsScreen ─────────────────────────────────────────────────────────

function FlashcardsScreen() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);

  const card = flashcards[index];
  const total = flashcards.length;

  const rate = (r: string) => {
    setRatings((prev) => ({ ...prev, [index]: r }));
    if (index < total - 1) {
      setFlipped(false);
      setTimeout(() => setIndex((i) => i + 1), 180);
    } else {
      setFinished(true);
    }
  };

  const restart = () => { setIndex(0); setFlipped(false); setRatings({}); setFinished(false); };

  if (finished) {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    Object.values(ratings).forEach((r) => { counts[r as keyof typeof counts]++; });
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[#D4E8D8]">
          <Award className="w-8 h-8 text-[#3A6B45]" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Lora', serif" }}>Session Complete!</h2>
        <p className="text-muted-foreground mb-8">You reviewed {total} cards from Biology 101.</p>
        <div className="flex gap-4 mb-8">
          {[["Easy", "#3A6B45", "#D4E8D8"], ["Medium", "#8B7020", "#F0E0B0"], ["Hard", "#6B1E2B", "#E8CCCF"]].map(([label, text, bg]) => (
            <div key={label} className="flex flex-col items-center p-4 rounded-2xl min-w-[80px]" style={{ backgroundColor: bg }}>
              <span className="text-2xl font-bold" style={{ color: text }}>{counts[label as keyof typeof counts]}</span>
              <span className="text-xs font-medium mt-1" style={{ color: text }}>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={restart} className="px-6 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          Study Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-foreground">Biology 101 — Chapter 5</p>
            <p className="text-xs text-muted-foreground">Card {index + 1} of {total}</p>
          </div>
          <div className="flex gap-1">
            {flashcards.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: i < index
                    ? (ratings[i] === "Easy" ? "#3A6B45" : ratings[i] === "Hard" ? "#6B1E2B" : "#8B7020")
                    : i === index ? "#6B1E2B" : "rgba(107,30,43,0.15)"
                }}
              />
            ))}
          </div>
        </div>
        <ProgressBar value={((index + (flipped ? 0.5 : 0)) / total) * 100} />
      </div>

      {/* Flip card */}
      <div
        style={{ perspective: "1200px" }}
        className="w-full max-w-2xl cursor-pointer"
        onClick={() => setFlipped((f) => !f)}
      >
        <div style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
          height: "300px",
        }}>
          {/* Front */}
          <div
            className="absolute inset-0 bg-card rounded-3xl flex flex-col items-center justify-center p-10 text-center"
            style={{ backfaceVisibility: "hidden", border: "2px solid rgba(107,30,43,0.2)" }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#6B1E2B] mb-6">Question</span>
            <p className="text-xl font-semibold text-foreground leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
              {card.front}
            </p>
            <p className="text-sm text-muted-foreground mt-8">Click to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-10 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: "#6B1E2B" }}>
            <span className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(250,246,240,0.6)" }}>Answer</span>
            <p className="text-base leading-relaxed text-[#FAF6F0]">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="w-full max-w-2xl mt-8">
        {flipped ? (
          <div>
            <p className="text-xs text-muted-foreground text-center mb-4 uppercase tracking-widest font-medium">How well did you know this?</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Hard", hint: "Barely recalled", bg: "#E8CCCF", text: "#6B1E2B", border: "rgba(107,30,43,0.3)" },
                { label: "Medium", hint: "Recalled with effort", bg: "#F0E0B0", text: "#6B5020", border: "rgba(107,80,32,0.3)" },
                { label: "Easy", hint: "Recalled quickly", bg: "#D4E8D8", text: "#2D5A38", border: "rgba(45,90,56,0.3)" },
              ].map(({ label, hint, bg, text, border }) => (
                <button key={label} onClick={() => rate(label)}
                  className="flex flex-col items-center py-4 px-3 rounded-2xl transition-all active:scale-95 hover:opacity-90"
                  style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                  <span className="text-base font-bold" style={{ color: text }}>{label}</span>
                  <span className="text-xs mt-0.5" style={{ color: text, opacity: 0.75 }}>{hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button onClick={() => setFlipped(true)}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Eye className="w-4 h-4" />
              Reveal Answer
            </button>
          </div>
        )}
      </div>

      {/* Skip */}
      {!flipped && (
        <button onClick={() => { setFlipped(false); setIndex((i) => Math.min(i + 1, total - 1)); }}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          Skip <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── QuizScreen ───────────────────────────────────────────────────────────────

function QuizScreen() {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = quiz[qIndex];
  const isCorrect = selected === q.correct;

  const submit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === q.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (qIndex < quiz.length - 1) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      setDone(true);
    }
  };

  const restart = () => { setQIndex(0); setSelected(null); setSubmitted(false); setScore(0); setDone(false); };

  if (done) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <RingProgress pct={pct} size={100} stroke={8} />
        <h2 className="text-2xl font-bold text-foreground mt-6 mb-2" style={{ fontFamily: "'Lora', serif" }}>
          Quiz Complete
        </h2>
        <p className="text-muted-foreground mb-2">
          You scored <strong className="text-foreground">{score}/{quiz.length}</strong> — {pct >= 80 ? "Excellent work!" : pct >= 60 ? "Good effort — review the explanations above." : "Keep practicing — you have got this."}
        </p>
        <button onClick={restart} className="mt-6 px-6 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-full p-8">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground font-medium">Question {qIndex + 1} of {quiz.length}</span>
          <span className="text-sm font-semibold text-[#6B1E2B]">{score} correct</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-8">
          <div className="h-2 rounded-full bg-[#6B1E2B] transition-all duration-500"
            style={{ width: `${((qIndex) / quiz.length) * 100}%` }} />
        </div>

        {/* Question card */}
        <div className="bg-card border border-border rounded-3xl p-8 mb-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B1E2B] mb-4 block">Multiple Choice</span>
          <h2 className="text-xl font-semibold text-foreground leading-snug mb-8" style={{ fontFamily: "'Lora', serif" }}>
            {q.q}
          </h2>

          <div className="space-y-3">
            {q.opts.map((opt, i) => {
              let style: React.CSSProperties = {};
              let cls = "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ";
              if (!submitted) {
                cls += selected === i
                  ? "border-[#6B1E2B] bg-[rgba(107,30,43,0.06)]"
                  : "border-border hover:border-[rgba(107,30,43,0.3)] hover:bg-muted/50 cursor-pointer";
              } else {
                if (i === q.correct) {
                  cls += "border-[#3A6B45] cursor-default";
                  style = { backgroundColor: "#D4E8D8" };
                } else if (i === selected && selected !== q.correct) {
                  cls += "border-[#6B1E2B] cursor-default";
                  style = { backgroundColor: "#E8CCCF" };
                } else {
                  cls += "border-border opacity-50 cursor-default";
                }
              }
              return (
                <button key={i} className={cls} style={style}
                  onClick={() => { if (!submitted) setSelected(i); }}>
                  <span className="w-8 h-8 rounded-full border flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors"
                    style={{
                      borderColor: submitted && i === q.correct ? "#3A6B45"
                        : submitted && i === selected ? "#6B1E2B"
                        : selected === i ? "#6B1E2B" : "var(--border)",
                      backgroundColor: submitted && i === q.correct ? "#3A6B45"
                        : submitted && i === selected && selected !== q.correct ? "#6B1E2B"
                        : selected === i && !submitted ? "rgba(107,30,43,0.1)" : "transparent",
                      color: (submitted && (i === q.correct || (i === selected && selected !== q.correct))) ? "#FAF6F0"
                        : selected === i ? "#6B1E2B" : "var(--muted-foreground)",
                    }}>
                    {submitted && i === q.correct ? <CheckCircle className="w-4 h-4" />
                      : submitted && i === selected && !isCorrect ? <XCircle className="w-4 h-4" />
                      : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-medium text-foreground">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {submitted && (
          <div className="rounded-2xl p-5 mb-5 border"
            style={{
              backgroundColor: isCorrect ? "#D4E8D8" : "#E8CCCF",
              borderColor: isCorrect ? "rgba(58,107,69,0.3)" : "rgba(107,30,43,0.3)"
            }}>
            <div className="flex items-start gap-3">
              {isCorrect
                ? <CheckCircle className="w-5 h-5 text-[#2D5A38] flex-shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-[#6B1E2B] flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: isCorrect ? "#2D5A38" : "#6B1E2B" }}>
                  {isCorrect ? "Correct!" : `Incorrect — the answer is ${q.opts[q.correct]}`}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: isCorrect ? "#2D5A38" : "#6B1E2B", opacity: 0.85 }}>
                  {q.exp}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        {!submitted ? (
          <button onClick={submit} disabled={selected === null}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
            Submit Answer
          </button>
        ) : (
          <button onClick={next}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            {qIndex < quiz.length - 1 ? "Next Question" : "See Results"}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ProgressScreen ───────────────────────────────────────────────────────────

function ProgressScreen() {
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const intensity = Math.random();
    return { intensity: i > 30 ? 0 : intensity < 0.25 ? 0 : intensity };
  });

  const barColor = (mastery: number) =>
    mastery >= 80 ? "#3A6B45" : mastery >= 60 ? "#8B7020" : "#6B1E2B";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>Progress</h1>
        <p className="text-muted-foreground mt-1">Your learning journey over time.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Overall Mastery", value: "68%", sub: "+12% this month", color: "#6B1E2B" },
          { label: "Cards Reviewed", value: "2,847", sub: "All time", color: "#8B7020" },
          { label: "Hours Studied", value: "142", sub: "Across all decks", color: "#3A6B45" },
          { label: "Accuracy Rate", value: "74%", sub: "Quiz average", color: "#8B5E3C" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <p className="text-3xl font-bold" style={{ fontFamily: "'Lora', serif", color }}>{value}</p>
            <p className="text-sm font-medium text-foreground mt-1">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance over time */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-1">Performance Over Time</h3>
          <p className="text-sm text-muted-foreground mb-5">Average quiz score per day</p>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={perfData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B1E2B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6B1E2B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,30,43,0.08)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontFamily: "Work Sans", fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#6B1E2B" strokeWidth={2.5} fill="url(#progGrad)" dot={{ fill: "#6B1E2B", r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mastery by topic */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-1">Mastery by Topic</h3>
          <p className="text-sm text-muted-foreground mb-5">Biology 101 — Chapter 5</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={topicData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,30,43,0.08)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="topic" width={120} tick={{ fontSize: 10, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontFamily: "Work Sans", fontSize: 12 }} />
              <Bar dataKey="mastery" radius={[0, 6, 6, 0]}>
                {topicData.map((entry, i) => (
                  <Cell key={i} fill={barColor(entry.mastery)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic mastery list + calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-5">Topic Breakdown</h3>
          <div className="space-y-5">
            {topicData.map(({ topic, mastery }) => (
              <div key={topic}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{topic}</span>
                  <div className="flex items-center gap-2">
                    <Badge status={mastery >= 80 ? "mastered" : mastery >= 60 ? "reviewing" : "weak"} />
                    <span className="text-sm font-semibold" style={{ color: barColor(mastery) }}>{mastery}%</span>
                  </div>
                </div>
                <ProgressBar value={mastery} color={barColor(mastery)} />
              </div>
            ))}
          </div>
        </div>

        {/* Study calendar */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Study Calendar</h3>
            <span className="text-sm text-muted-foreground">June — July 2025</span>
          </div>
          <div className="flex gap-1 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="flex-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <div key={i}
                className="aspect-square rounded-md transition-colors"
                title={day.intensity > 0 ? `${Math.round(day.intensity * 50 + 5)} cards studied` : "No study"}
                style={{
                  backgroundColor: day.intensity === 0
                    ? "var(--muted)"
                    : day.intensity < 0.4
                    ? "rgba(107,30,43,0.2)"
                    : day.intensity < 0.7
                    ? "rgba(107,30,43,0.5)"
                    : "#6B1E2B",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-muted-foreground">Less</span>
            {["rgba(107,30,43,0.15)", "rgba(107,30,43,0.35)", "rgba(107,30,43,0.6)", "#6B1E2B"].map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LibraryScreen ────────────────────────────────────────────────────────────

function LibraryScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "mastered" | "reviewing" | "weak">("all");

  const filtered = decks.filter(
    (d) =>
      (filter === "all" || d.status === filter) &&
      d.title.toLowerCase().includes(query.toLowerCase())
  );

  const tabs = [
    { key: "all", label: "All Decks" },
    { key: "reviewing", label: "Reviewing" },
    { key: "weak", label: "Weak Areas" },
    { key: "mastered", label: "Mastered" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>Library</h1>
          <p className="text-muted-foreground mt-1">{decks.length} decks · {decks.reduce((s, d) => s + d.cards, 0)} cards total</p>
        </div>
        <button onClick={() => setScreen("upload")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0">
          <Plus className="w-4 h-4" />
          New Deck
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text" placeholder="Search decks..." value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none transition-colors"
          onFocus={e => (e.target.style.borderColor = "#6B1E2B")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key as typeof filter)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: filter === key ? "#6B1E2B" : "var(--card)",
              color: filter === key ? "#FAF6F0" : "var(--muted-foreground)",
              border: `1px solid ${filter === key ? "#6B1E2B" : "var(--border)"}`,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-muted">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: "'Lora', serif" }}>No decks found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {query ? `No decks match "${query}"` : "Upload your first document to get started."}
          </p>
          <button onClick={() => setScreen("upload")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            Upload Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((deck) => (
            <div key={deck.id} className="bg-card border border-border rounded-2xl p-5 hover:border-[rgba(107,30,43,0.35)] transition-all cursor-pointer group"
              onClick={() => setScreen("summary")}>
              {/* Top */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-muted text-xl flex-shrink-0">
                  <SubjectIcon subject={deck.subject} />
                </div>
                <Badge status={deck.status} />
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug group-hover:text-[#6B1E2B] transition-colors" style={{ fontFamily: "'Lora', serif" }}>
                {deck.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">{deck.subject} · {deck.cards} cards · Studied {deck.studied}</p>

              {/* Mastery bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Mastery</span>
                  <span className="font-semibold" style={{ color: statusMeta[deck.status]?.color || "#8B7020" }}>{deck.mastery}%</span>
                </div>
                <ProgressBar value={deck.mastery} color={statusMeta[deck.status]?.color || "#8B7020"} />
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3 h-3 text-[#6B1E2B]" />
                  {deck.weak} weak cards
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setScreen("flashcards"); }}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-[rgba(107,30,43,0.1)] hover:text-[#6B1E2B] transition-colors">
                    Study
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setScreen("quiz"); }}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    Quiz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [darkMode, setDarkMode] = useState(false);

  if (screen === "login") {
    return <LoginScreen onLogin={() => setScreen("dashboard")} />;
  }

  return (
    <div className={darkMode ? "dark" : ""} style={{ height: "100dvh" }}>
      <div className="flex h-full bg-background overflow-hidden">
        <Sidebar
          screen={screen}
          setScreen={setScreen}
          darkMode={darkMode}
          toggleDark={() => setDarkMode((d) => !d)}
          onLogout={() => setScreen("login")}
        />
        <main className="flex-1 overflow-y-auto">
          {screen === "dashboard" && <DashboardScreen setScreen={setScreen} />}
          {screen === "upload" && <UploadScreen setScreen={setScreen} />}
          {screen === "summary" && <SummaryScreen setScreen={setScreen} />}
          {screen === "flashcards" && <FlashcardsScreen />}
          {screen === "quiz" && <QuizScreen />}
          {screen === "progress" && <ProgressScreen />}
          {screen === "library" && <LibraryScreen setScreen={setScreen} />}
        </main>
      </div>
    </div>
  );
}
