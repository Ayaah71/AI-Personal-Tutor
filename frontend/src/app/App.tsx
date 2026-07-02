import { useState, useRef, useCallback, useEffect } from "react";
import {
  LayoutDashboard, Library, TrendingUp, Upload, Flame,
  CheckCircle, XCircle, ChevronRight, Sun, Moon,
  FileText, Brain, ArrowRight, Search, Eye, RotateCcw, Zap,
  Star, Clock, BookOpen, LogOut, Settings, Layers, Plus,
  AlertTriangle, Award, Target, Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import {
  api,
  type Document,
  type Flashcard,
  type QuizQuestion,
  type ProgressResponse,
  type UploadResponse,
} from "../api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen =
  | "login" | "dashboard" | "upload" | "summary"
  | "flashcards" | "quiz" | "progress" | "library";

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

function masteryStatus(mastery: number): "mastered" | "reviewing" | "weak" {
  if (mastery >= 80) return "mastered";
  if (mastery >= 50) return "reviewing";
  return "weak";
}

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
    Physics: "⚡", "Computer Science": "💻",
  };
  return <span className="text-lg">{map[subject] || "📚"}</span>;
}

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size, borderWidth: 2 }}
      className="rounded-full border-solid border-current border-t-transparent animate-spin"
    />
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl mb-4"
      style={{ backgroundColor: "rgba(107,30,43,0.08)", border: "1px solid rgba(107,30,43,0.2)" }}>
      <WifiOff className="w-4 h-4 text-[#6B1E2B] flex-shrink-0" />
      <p className="text-sm text-[#6B1E2B] flex-1">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1 text-xs font-medium text-[#6B1E2B] hover:opacity-75">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
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
  screen, setScreen, darkMode, toggleDark, onLogout, streak,
}: {
  screen: Screen; setScreen: (s: Screen) => void;
  darkMode: boolean; toggleDark: () => void; onLogout: () => void;
  streak: number;
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
            <span className="text-[#FAF6F0] text-sm font-semibold">{streak}-day streak</span>
          </div>
          <p className="text-[rgba(245,240,232,0.5)] text-xs leading-relaxed">Keep it up — study a little every day!</p>
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
            ST
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-sidebar-foreground">Student</p>
            <p className="text-[10px] truncate text-[rgba(245,240,232,0.4)]">scholar-ai user</p>
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

        <p className="text-xs text-[rgba(245,240,232,0.35)]">Upload your first document to get started — it's free.</p>
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
                <input type="text" placeholder="Your name" className={inputCls} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#6B1E2B")}
                  onBlur={e => (e.target.style.borderColor = "rgba(74,52,40,0.2)")}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#4A3428] mb-1.5">Email address</label>
              <input type="email" placeholder="you@example.com" className={inputCls} style={inputStyle}
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
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [prog, docs] = await Promise.all([api.getProgress(), api.listDocuments()]);
      setProgress(prog);
      setDocuments(docs.documents);
    } catch (e) {
      setError("Could not connect to backend. Make sure the server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = progress
    ? [
        { label: "Study Streak", value: String(progress.stats.streak), unit: "days", icon: Flame, iconColor: "#E07850", bg: "rgba(224,120,80,0.1)" },
        { label: "Cards Mastered", value: String(progress.stats.cards_mastered), unit: "total", icon: Star, iconColor: "#8B7020", bg: "rgba(139,112,32,0.1)" },
        { label: "Avg. Score", value: String(progress.stats.avg_score), unit: "%", icon: Award, iconColor: "#6B1E2B", bg: "rgba(107,30,43,0.1)" },
        { label: "Due Today", value: String(progress.stats.due_today), unit: "cards", icon: Clock, iconColor: "#3A6B45", bg: "rgba(58,107,69,0.1)" },
      ]
    : [];

  const weakTopics = (progress?.topics || []).filter((t) => t.mastery < 60);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {progress ? `You have ${progress.stats.due_today} cards due for review today.` : "Loading your progress…"}
          </p>
        </div>
        <button onClick={() => setScreen("upload")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Upload Material
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : (
        <>
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
                  <p className="text-sm text-muted-foreground">Quiz scores — recent history</p>
                </div>
              </div>
              {progress && progress.performance.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={progress.performance} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6B1E2B" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6B1E2B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,30,43,0.08)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontFamily: "Work Sans" }} />
                    <Area type="monotone" dataKey="score" stroke="#6B1E2B" strokeWidth={2.5} fill="url(#perfGrad)" dot={{ fill: "#6B1E2B", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#6B1E2B" }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <Brain className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">Take a quiz to see your performance graph</p>
                </div>
              )}
            </div>

            {/* Recent docs */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-1">Recent Documents</h3>
              <p className="text-sm text-muted-foreground mb-5">Your uploaded materials</p>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">No documents yet</p>
                  <button onClick={() => setScreen("upload")}
                    className="mt-3 text-sm font-medium text-[#6B1E2B] hover:opacity-75">
                    Upload your first →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.slice(0, 4).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 cursor-pointer" onClick={() => setScreen("summary")}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                        <SubjectIcon subject={doc.subject} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.title || doc.filename}</p>
                        <p className="text-xs text-muted-foreground">{doc.flashcard_count} cards</p>
                      </div>
                      <Badge status={masteryStatus(doc.mastery)} />
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setScreen("library")}
                className="w-full mt-5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-center">
                View library
              </button>
            </div>
          </div>

          {/* Weak areas + recent decks */}
          {weakTopics.length > 0 && (
            <div className="bg-[rgba(107,30,43,0.05)] border border-[rgba(107,30,43,0.15)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-4 h-4 text-[#6B1E2B]" />
                <h3 className="font-semibold text-[#6B1E2B]">Weak Areas</h3>
              </div>
              <div className="space-y-4">
                {weakTopics.map(({ topic, mastery }) => (
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
          )}
        </>
      )}
    </div>
  );
}

// ─── UploadScreen ─────────────────────────────────────────────────────────────

type UploadState = "idle" | "dragging" | "processing" | "done";

function UploadScreen({ setScreen, onUploadSuccess }: {
  setScreen: (s: Screen) => void;
  onUploadSuccess: (docId: number) => void;
}) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    api.listDocuments().then((r) => setDocuments(r.documents)).catch(() => {});
  }, []);

  const startProcessing = async (file: File) => {
    setFileName(file.name);
    setState("processing");
    setProgress(0);
    setUploadError("");
    setResult(null);

    // Animate progress bar while uploading
    let p = 0;
    const ticker = setInterval(() => {
      p += 8;
      if (p >= 90) { clearInterval(ticker); }
      setProgress(Math.min(p, 90));
    }, 200);

    try {
      const res = await api.uploadFile(file);
      clearInterval(ticker);
      setProgress(100);
      setResult(res);
      onUploadSuccess(res.doc_id);
      setTimeout(() => setState("done"), 300);
    } catch (e: unknown) {
      clearInterval(ticker);
      setState("idle");
      setUploadError(e instanceof Error ? e.message : "Upload failed. Is the backend running?");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
    const file = e.dataTransfer.files[0];
    if (file) startProcessing(file);
  }, []);

  const processingSteps = [
    { label: "Parsing document structure", done: progress > 20 },
    { label: "Extracting key concepts", done: progress > 45 },
    { label: "Generating AI summary", done: progress > 70 },
    { label: "Building study materials", done: progress > 90 },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>Upload Material</h1>
        <p className="text-muted-foreground mt-1">Drop your notes, textbooks, or slides — we handle the rest.</p>
      </div>

      {uploadError && <ErrorBanner message={uploadError} />}

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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) startProcessing(f); }} />

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: state === "dragging" ? "rgba(107,30,43,0.12)" : "rgba(107,30,43,0.08)" }}>
            <Upload className="w-8 h-8 text-[#6B1E2B]" style={{ opacity: state === "dragging" ? 1 : 0.7 }} />
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">
            {state === "dragging" ? "Release to upload" : "Drop your file here"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">or click to browse your files</p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {["PDF", "DOCX", "TXT", "Markdown"].map((ext) => (
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
          <p className="text-sm text-muted-foreground mb-2">{result?.title || fileName}</p>
          {result && (
            <p className="text-xs text-muted-foreground mb-6">
              {result.pages} page{result.pages !== 1 ? "s" : ""} · {result.flashcard_count} flashcards · {result.quiz_count} quiz questions
            </p>
          )}
          <div className="flex gap-3 flex-wrap justify-center">
            <button onClick={() => setScreen("summary")}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              View Summary
            </button>
            <button onClick={() => setScreen("flashcards")}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
              Start Flashcards
            </button>
            <button onClick={() => { setState("idle"); setResult(null); }} className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Recent uploads */}
      {documents.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-4">Recent Uploads</h3>
          <div className="space-y-2">
            {documents.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setScreen("summary")}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                  <FileText className="w-4 h-4 text-[#6B1E2B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title || doc.filename}</p>
                  <p className="text-xs text-muted-foreground">{doc.pages} pages · {doc.flashcard_count} cards</p>
                </div>
                <Badge status={masteryStatus(doc.mastery)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SummaryScreen ────────────────────────────────────────────────────────────

function SummaryScreen({ setScreen, activeDocId }: { setScreen: (s: Screen) => void; activeDocId: number | null }) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(activeDocId);
  const [highlighted, setHighlighted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listDocuments().then((r) => {
      setAllDocs(r.documents);
      if (!selectedId && r.documents.length > 0) {
        setSelectedId(r.documents[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    api.getDocument(selectedId)
      .then(setDoc)
      .catch(() => setError("Failed to load document."))
      .finally(() => setLoading(false));
  }, [selectedId]);

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

  if (allDocs.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
        <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: "'Lora', serif" }}>No documents yet</h2>
        <p className="text-muted-foreground mb-6">Upload a document to generate an AI summary.</p>
        <button onClick={() => setScreen("upload")}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          Upload Material
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[rgba(107,30,43,0.1)] text-[#6B1E2B]">AI Summary</span>
          </div>
          {/* Document selector */}
          <select
            value={selectedId || ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="text-2xl font-bold text-foreground bg-transparent border-none outline-none cursor-pointer"
            style={{ fontFamily: "'Lora', serif" }}
          >
            {allDocs.map((d) => (
              <option key={d.id} value={d.id}>{d.title || d.filename}</option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground mt-1">{doc?.subtitle || ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setHighlighted(!highlighted)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Zap className="w-3.5 h-3.5" />
            {highlighted ? "Plain text" : "Highlights"}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>
      ) : doc ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-7">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#6B1E2B]" />
              Chapter Summary
            </h3>
            <div className="space-y-4">
              {(doc.summary || "").split("\n\n").map((para, i) => (
                <div key={i}>{renderSummary(para)}</div>
              ))}
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <button onClick={() => setScreen("quiz")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <Brain className="w-4 h-4" />
                Take Quiz
              </button>
              <button onClick={() => setScreen("flashcards")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
                <Layers className="w-4 h-4" />
                Study Flashcards
              </button>
            </div>
          </div>

          {/* Key concepts + stats */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Key Concepts</h3>
              <div className="space-y-2">
                {(doc.concepts || []).map((concept, i) => (
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
                  { label: "Pages", value: String(doc.pages) },
                  { label: "Key concepts", value: String((doc.concepts || []).length) },
                  { label: "Flashcards generated", value: String(doc.flashcard_count) },
                  { label: "Quiz questions", value: String(doc.quiz_count) },
                  { label: "Subject", value: doc.subject },
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
      ) : null}
    </div>
  );
}

// ─── FlashcardsScreen ─────────────────────────────────────────────────────────

function FlashcardsScreen({ activeDocId }: { activeDocId: number | null }) {
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(activeDocId);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [docTitle, setDocTitle] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listDocuments().then((r) => {
      setAllDocs(r.documents);
      if (!selectedDocId && r.documents.length > 0) {
        setSelectedDocId(r.documents[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDocId) return;
    setLoading(true);
    setError("");
    setIndex(0);
    setFlipped(false);
    setRatings({});
    setFinished(false);
    api.getFlashcards(selectedDocId)
      .then((res) => {
        setCards(res.flashcards);
        setDocTitle(res.doc_title);
      })
      .catch(() => setError("Failed to load flashcards."))
      .finally(() => setLoading(false));
  }, [selectedDocId]);

  const card = cards[index];
  const total = cards.length;

  const rate = async (r: string) => {
    if (!card) return;
    setRatings((prev) => ({ ...prev, [index]: r }));
    try {
      await api.reviewCard(card.id, r as "Easy" | "Medium" | "Hard");
    } catch { /* non-critical */ }
    if (index < total - 1) {
      setFlipped(false);
      setTimeout(() => setIndex((i) => i + 1), 180);
    } else {
      setFinished(true);
    }
  };

  const restart = () => { setIndex(0); setFlipped(false); setRatings({}); setFinished(false); };

  if (allDocs.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <Layers className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
        <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: "'Lora', serif" }}>No flashcards yet</h2>
        <p className="text-muted-foreground mb-6">Upload a document to generate flashcards.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-full"><Spinner size={32} /></div>;
  }

  if (finished) {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    Object.values(ratings).forEach((r) => { counts[r as keyof typeof counts]++; });
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        {/* Doc selector */}
        <div className="mb-6">
          <select
            value={selectedDocId || ""}
            onChange={(e) => setSelectedDocId(Number(e.target.value))}
            className="text-sm text-muted-foreground bg-transparent border border-border rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            {allDocs.map((d) => <option key={d.id} value={d.id}>{d.title || d.filename}</option>)}
          </select>
        </div>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[#D4E8D8]">
          <Award className="w-8 h-8 text-[#3A6B45]" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Lora', serif" }}>Session Complete!</h2>
        <p className="text-muted-foreground mb-8">You reviewed {total} cards from {docTitle}.</p>
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
            <select
              value={selectedDocId || ""}
              onChange={(e) => setSelectedDocId(Number(e.target.value))}
              className="text-sm font-medium text-foreground bg-transparent border-none outline-none cursor-pointer"
            >
              {allDocs.map((d) => <option key={d.id} value={d.id}>{d.title || d.filename}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Card {index + 1} of {total}</p>
          </div>
          <div className="flex gap-1">
            {cards.map((_, i) => (
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

      {error && <ErrorBanner message={error} />}

      {/* Flip card */}
      {card && (
        <>
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
              <div
                className="absolute inset-0 bg-card rounded-3xl flex flex-col items-center justify-center p-10 text-center"
                style={{ backfaceVisibility: "hidden", border: "2px solid rgba(107,30,43,0.2)" }}>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#6B1E2B] mb-6">Question</span>
                <p className="text-xl font-semibold text-foreground leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                  {card.front}
                </p>
                <p className="text-sm text-muted-foreground mt-8">Click to reveal answer</p>
              </div>

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

          {!flipped && (
            <button onClick={() => { setFlipped(false); setIndex((i) => Math.min(i + 1, total - 1)); }}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Skip <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── QuizScreen ───────────────────────────────────────────────────────────────

function QuizScreen({ activeDocId }: { activeDocId: number | null }) {
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(activeDocId);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [docTitle, setDocTitle] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<{ question_id: number; selected_index: number }[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [finalPct, setFinalPct] = useState(0);

  useEffect(() => {
    api.listDocuments().then((r) => {
      setAllDocs(r.documents);
      if (!selectedDocId && r.documents.length > 0) setSelectedDocId(r.documents[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDocId) return;
    setLoading(true);
    setError("");
    setQIndex(0); setSelected(null); setSubmitted(false);
    setAnswers([]); setScore(0); setDone(false);
    api.getQuiz(selectedDocId)
      .then((res) => {
        setQuestions(res.questions);
        setDocTitle(res.doc_title);
      })
      .catch(() => setError("Failed to load quiz."))
      .finally(() => setLoading(false));
  }, [selectedDocId]);

  const q = questions[qIndex];
  const isCorrect = submitted && selected === q?.correct_index;

  const submit = () => {
    if (selected === null || !q) return;
    setSubmitted(true);
    setAnswers((prev) => [...prev, { question_id: q.id, selected_index: selected }]);
    if (selected === q.correct_index) setScore((s) => s + 1);
  };

  const next = async () => {
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      // Final submission
      setSubmitting(true);
      const allAnswers = [...answers];
      if (selected !== null && q) {
        allAnswers.push({ question_id: q.id, selected_index: selected });
      }
      try {
        const res = await api.submitQuiz(selectedDocId!, allAnswers);
        setFinalPct(res.pct);
      } catch {
        setFinalPct(Math.round(score / questions.length * 100));
      } finally {
        setSubmitting(false);
        setDone(true);
      }
    }
  };

  const restart = () => {
    setQIndex(0); setSelected(null); setSubmitted(false);
    setAnswers([]); setScore(0); setDone(false);
  };

  if (allDocs.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <Brain className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
        <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: "'Lora', serif" }}>No quizzes yet</h2>
        <p className="text-muted-foreground mb-6">Upload a document to generate quiz questions.</p>
      </div>
    );
  }

  if (loading || submitting) {
    return <div className="flex items-center justify-center min-h-full"><Spinner size={32} /></div>;
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <RingProgress pct={finalPct} size={100} stroke={8} />
        <h2 className="text-2xl font-bold text-foreground mt-6 mb-2" style={{ fontFamily: "'Lora', serif" }}>
          Quiz Complete
        </h2>
        <p className="text-muted-foreground mb-2">
          You scored <strong className="text-foreground">{score}/{questions.length}</strong> — {finalPct >= 80 ? "Excellent work!" : finalPct >= 60 ? "Good effort — review the explanations." : "Keep practising — you've got this."}
        </p>
        <button onClick={restart} className="mt-6 px-6 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          Retry Quiz
        </button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="flex flex-col items-center min-h-full p-8">
      <div className="w-full max-w-2xl">
        {/* Doc selector */}
        <div className="mb-4">
          <select
            value={selectedDocId || ""}
            onChange={(e) => setSelectedDocId(Number(e.target.value))}
            className="text-sm text-muted-foreground bg-transparent border border-border rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            {allDocs.map((d) => <option key={d.id} value={d.id}>{d.title || d.filename}</option>)}
          </select>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground font-medium">Question {qIndex + 1} of {questions.length}</span>
          <span className="text-sm font-semibold text-[#6B1E2B]">{score} correct</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-8">
          <div className="h-2 rounded-full bg-[#6B1E2B] transition-all duration-500"
            style={{ width: `${(qIndex / questions.length) * 100}%` }} />
        </div>

        {/* Question card */}
        <div className="bg-card border border-border rounded-3xl p-8 mb-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B1E2B] mb-4 block">Multiple Choice</span>
          <h2 className="text-xl font-semibold text-foreground leading-snug mb-8" style={{ fontFamily: "'Lora', serif" }}>
            {q.question}
          </h2>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              let style: React.CSSProperties = {};
              let cls = "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ";
              if (!submitted) {
                cls += selected === i
                  ? "border-[#6B1E2B] bg-[rgba(107,30,43,0.06)]"
                  : "border-border hover:border-[rgba(107,30,43,0.3)] hover:bg-muted/50 cursor-pointer";
              } else {
                if (i === q.correct_index) {
                  cls += "border-[#3A6B45] cursor-default";
                  style = { backgroundColor: "#D4E8D8" };
                } else if (i === selected && selected !== q.correct_index) {
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
                      borderColor: submitted && i === q.correct_index ? "#3A6B45"
                        : submitted && i === selected ? "#6B1E2B"
                        : selected === i ? "#6B1E2B" : "var(--border)",
                      backgroundColor: submitted && i === q.correct_index ? "#3A6B45"
                        : submitted && i === selected && selected !== q.correct_index ? "#6B1E2B"
                        : selected === i && !submitted ? "rgba(107,30,43,0.1)" : "transparent",
                      color: (submitted && (i === q.correct_index || (i === selected && selected !== q.correct_index))) ? "#FAF6F0"
                        : selected === i ? "#6B1E2B" : "var(--muted-foreground)",
                    }}>
                    {submitted && i === q.correct_index ? <CheckCircle className="w-4 h-4" />
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
                  {isCorrect ? "Correct!" : `Incorrect — the answer is ${q.options[q.correct_index]}`}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: isCorrect ? "#2D5A38" : "#6B1E2B", opacity: 0.85 }}>
                  {q.explanation}
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
            {qIndex < questions.length - 1 ? "Next Question" : "See Results"}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ProgressScreen ───────────────────────────────────────────────────────────

function ProgressScreen() {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api.getProgress()
      .then(setData)
      .catch(() => setError("Could not load progress data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const barColor = (mastery: number) =>
    mastery >= 80 ? "#3A6B45" : mastery >= 60 ? "#8B7020" : "#6B1E2B";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Lora', serif" }}>Progress</h1>
        <p className="text-muted-foreground mt-1">Your learning journey over time.</p>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>
      ) : data ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Overall Mastery", value: `${data.stats.overall_mastery}%`, sub: "Across all decks", color: "#6B1E2B" },
              { label: "Cards Reviewed", value: String(data.stats.cards_reviewed), sub: "All time", color: "#8B7020" },
              { label: "Hours Studied", value: String(data.stats.hours_studied), sub: "Estimated", color: "#3A6B45" },
              { label: "Accuracy Rate", value: `${data.stats.accuracy_rate}%`, sub: "Quiz average", color: "#8B5E3C" },
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
              {data.performance.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={data.performance} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6B1E2B" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6B1E2B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,30,43,0.08)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontFamily: "Work Sans", fontSize: 12 }} />
                    <Area type="monotone" dataKey="score" stroke="#6B1E2B" strokeWidth={2.5} fill="url(#progGrad)" dot={{ fill: "#6B1E2B", r: 3, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[210px]">
                  <p className="text-sm text-muted-foreground">Take quizzes to see performance history</p>
                </div>
              )}
            </div>

            {/* Mastery by topic */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-1">Mastery by Subject</h3>
              <p className="text-sm text-muted-foreground mb-5">Based on uploaded documents</p>
              {data.topics.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={data.topics} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,30,43,0.08)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="topic" width={110} tick={{ fontSize: 10, fill: "#8B6E5A", fontFamily: "Work Sans" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontFamily: "Work Sans", fontSize: 12 }} />
                    <Bar dataKey="mastery" radius={[0, 6, 6, 0]}>
                      {data.topics.map((entry, i) => (
                        <Cell key={i} fill={barColor(entry.mastery)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[210px]">
                  <p className="text-sm text-muted-foreground">Upload documents to see topic mastery</p>
                </div>
              )}
            </div>
          </div>

          {/* Topic breakdown */}
          {data.topics.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-5">Topic Breakdown</h3>
              <div className="space-y-5">
                {data.topics.map(({ topic, mastery }) => (
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
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
          <p className="text-muted-foreground">Upload documents and study to see your progress</p>
        </div>
      )}
    </div>
  );
}

// ─── LibraryScreen ────────────────────────────────────────────────────────────

function LibraryScreen({ setScreen, onSelectDoc }: {
  setScreen: (s: Screen) => void;
  onSelectDoc: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "mastered" | "reviewing" | "weak">("all");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.listDocuments()
      .then((r) => setDocuments(r.documents))
      .catch(() => setError("Could not load library."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = documents.filter((d) => {
    const status = masteryStatus(d.mastery);
    return (filter === "all" || status === filter) &&
      (d.title || d.filename).toLowerCase().includes(query.toLowerCase());
  });

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
          <p className="text-muted-foreground mt-1">{documents.length} documents · {documents.reduce((s, d) => s + d.flashcard_count, 0)} cards total</p>
        </div>
        <button onClick={() => setScreen("upload")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0">
          <Plus className="w-4 h-4" />
          New Deck
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text" placeholder="Search documents..." value={query}
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
      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-muted">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: "'Lora', serif" }}>
            {documents.length === 0 ? "No documents yet" : "No results"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {documents.length === 0
              ? "Upload your first document to get started."
              : query ? `No documents match "${query}"` : "No documents match that filter."}
          </p>
          <button onClick={() => setScreen("upload")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            Upload Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const status = masteryStatus(doc.mastery);
            return (
              <div key={doc.id} className="bg-card border border-border rounded-2xl p-5 hover:border-[rgba(107,30,43,0.35)] transition-all cursor-pointer group"
                onClick={() => { onSelectDoc(doc.id); setScreen("summary"); }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-muted text-xl flex-shrink-0">
                    <SubjectIcon subject={doc.subject} />
                  </div>
                  <Badge status={status} />
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug group-hover:text-[#6B1E2B] transition-colors" style={{ fontFamily: "'Lora', serif" }}>
                  {doc.title || doc.filename}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">{doc.subject} · {doc.flashcard_count} cards</p>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Mastery</span>
                    <span className="font-semibold" style={{ color: statusMeta[status]?.color || "#8B7020" }}>{doc.mastery}%</span>
                  </div>
                  <ProgressBar value={doc.mastery} color={statusMeta[status]?.color || "#8B7020"} />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">{doc.pages} pages</p>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onSelectDoc(doc.id); setScreen("flashcards"); }}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-[rgba(107,30,43,0.1)] hover:text-[#6B1E2B] transition-colors">
                      Study
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onSelectDoc(doc.id); setScreen("quiz"); }}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                      Quiz
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [darkMode, setDarkMode] = useState(false);
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  // Load streak for sidebar widget
  useEffect(() => {
    if (screen !== "login") {
      api.getProgress().then((r) => setStreak(r.stats.streak)).catch(() => {});
    }
  }, [screen]);

  const handleUploadSuccess = (docId: number) => {
    setActiveDocId(docId);
  };

  const handleSelectDoc = (id: number) => {
    setActiveDocId(id);
  };

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
          streak={streak}
        />
        <main className="flex-1 overflow-y-auto">
          {screen === "dashboard" && <DashboardScreen setScreen={setScreen} />}
          {screen === "upload" && <UploadScreen setScreen={setScreen} onUploadSuccess={handleUploadSuccess} />}
          {screen === "summary" && <SummaryScreen setScreen={setScreen} activeDocId={activeDocId} />}
          {screen === "flashcards" && <FlashcardsScreen activeDocId={activeDocId} />}
          {screen === "quiz" && <QuizScreen activeDocId={activeDocId} />}
          {screen === "progress" && <ProgressScreen />}
          {screen === "library" && <LibraryScreen setScreen={setScreen} onSelectDoc={handleSelectDoc} />}
        </main>
      </div>
    </div>
  );
}
