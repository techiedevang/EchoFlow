import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "react-tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Flame, Award } from "lucide-react";
import { motion } from "framer-motion";

// Custom styles for calendar heatmap
// Custom Contribution Calendar Component
const ContributionCalendar = ({ data }) => {
  const CELL_SIZE = 28;
  const CELL_GAP = 8;
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Get color based on activity level
  const getColor = (count) => {
    if (!count) return "#f0f0f0";
    if (count <= 1) return "#c6f6d5";
    if (count <= 2) return "#9ae6b4";
    if (count <= 3) return "#68d391";
    return "#22863a";
  };

  // Generate calendar data for current month only
  const generateCalendarData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks = [];
    let week = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      week.push({
        date: new Date(),
        count: 0,
        dateStr: "",
        isCurrentMonth: false,
      });
    }

    // Add days of current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = data.find((item) => item.date === dateStr);
      
      week.push({
        date,
        count: dayData?.count || 0,
        dateStr,
        isCurrentMonth: true,
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Add empty cells for remaining days
    if (week.length > 0) {
      while (week.length < 7) {
        week.push({
          date: new Date(),
          count: 0,
          dateStr: "",
          isCurrentMonth: false,
        });
      }
      weeks.push(week);
    }

    return weeks;
  };

  const weeks = generateCalendarData();
  const width = 7 * (CELL_SIZE + CELL_GAP) + 100;
  const height = weeks.length * (CELL_SIZE + CELL_GAP) + 140;

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">{MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}</h3>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Day labels */}
        {DAY_LABELS.map((day, i) => (
          <text
            key={`day-${i}`}
            x={70 + i * (CELL_SIZE + CELL_GAP)}
            y="35"
            fontSize="15"
            fill="#6b7280"
            textAnchor="middle"
            fontWeight="600"
          >
            {day}
          </text>
        ))}

        {/* Calendar cells */}
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <g key={`${weekIndex}-${dayIndex}`}>
              <rect
                x={70 + dayIndex * (CELL_SIZE + CELL_GAP)}
                y={50 + weekIndex * (CELL_SIZE + CELL_GAP)}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={day.isCurrentMonth ? getColor(day.count) : "#f3f4f6"}
                stroke={day.isCurrentMonth ? "#d1d5db" : "#e5e7eb"}
                strokeWidth="1"
                rx="4"
                className="hover:stroke-2 hover:stroke-gray-400 cursor-pointer transition-all"
                opacity={day.isCurrentMonth ? 1 : 0.6}
                data-tooltip-id="tooltip"
                data-tooltip-content={day.isCurrentMonth ? `${day.dateStr}: ${day.count} exercises` : ""}
              />
              {day.isCurrentMonth && (
                <text
                  x={70 + dayIndex * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
                  y={50 + weekIndex * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 + 6}
                  fontSize="14"
                  fill={day.count > 0 ? "#1f2937" : "#d1d5db"}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {new Date(day.dateStr).getDate()}
                </text>
              )}
            </g>
          ))
        )}

        {/* Legend */}
        <text x="70" y={height - 30} fontSize="13" fill="#9ca3af" fontWeight="500">
          Less
        </text>
        <rect
          x="130"
          y={height - 45}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill="#f0f0f0"
          stroke="#e5e7eb"
          rx="3"
        />
        <rect
          x={140 + CELL_SIZE + CELL_GAP}
          y={height - 45}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill="#c6f6d5"
          stroke="#e5e7eb"
          rx="3"
        />
        <rect
          x={150 + 2 * (CELL_SIZE + CELL_GAP)}
          y={height - 45}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill="#9ae6b4"
          stroke="#e5e7eb"
          rx="3"
        />
        <rect
          x={160 + 3 * (CELL_SIZE + CELL_GAP)}
          y={height - 45}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill="#68d391"
          stroke="#e5e7eb"
          rx="3"
        />
        <rect
          x={170 + 4 * (CELL_SIZE + CELL_GAP)}
          y={height - 45}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill="#22863a"
          stroke="#e5e7eb"
          rx="3"
        />
        <text x={180 + 5 * (CELL_SIZE + CELL_GAP)} y={height - 15} fontSize="13" fill="#9ca3af" fontWeight="500">
          More
        </text>
      </svg>
    </div>
  );
};

const calendarStyles = `
  svg rect:hover {
    stroke-width: 1.5px !important;
    filter: brightness(0.9);
  }
`;

const progressStyles = `
  /* Animated subtle gradient overlay */
  .parallax-bg::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(14,165,233,0.08), rgba(124,58,237,0.08), rgba(16,185,129,0.06));
    pointer-events: none;
    z-index: 0;
    transform: translateY(0);
    /* subtle vertical movement for a design feel (not color shifting) */
    animation: overlayFloat 28s linear infinite;
  }

  @keyframes overlayFloat {
    0% { transform: translateY(0%); }
    50% { transform: translateY(-6%); }
    100% { transform: translateY(0%); }
  }

  /* Slow parallax movement for the background image */
  .parallax-bg {
    animation: parallaxBG 45s linear infinite;
    background-position: center;
  }
  @keyframes parallaxBG {
    0% { background-position: center 0%; }
    50% { background-position: center 100%; }
    100% { background-position: center 0%; }
  }



  /* Design-focused animated background: moving shapes (no color cycling) */
  .progress-gradient {
    background: linear-gradient(135deg, #0b1220 0%, rgba(7,16,35,0.95) 40%, rgba(7,48,66,0.95) 100%);
    position: relative;
    overflow: hidden;
  }

  .progress-gradient::before {
    content: "";
    position: absolute;
    width: 80%;
    height: 80%;
    left: -30%;
    top: -20%;
    background: radial-gradient(circle at 30% 30%, rgba(124,58,237,0.78), transparent 40%);
    transform: translate3d(0,0,0);
    filter: blur(28px);
    mix-blend-mode: screen;
    opacity: 0.95;
    animation: moveBlobA 20s linear infinite;
    pointer-events: none;
    z-index: 0;
  }




  .progress-gradient::after {
    content: "";
    position: absolute;
    width: 80%;
    height: 80%;
    right: -30%;
    bottom: -20%;
    /* top pattern layer (subtle diagonal grid) then the radial blob */
    background: repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 36px), radial-gradient(circle at 70% 70%, rgba(34,197,94,0.68), transparent 35%);
    transform: translate3d(0,0,0);
    filter: blur(36px);
    mix-blend-mode: screen;
    opacity: 0.92;
    animation: moveBlobB 28s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes moveBlobA {
    0% { transform: translateX(0%) translateY(0%) rotate(0deg); }
    50% { transform: translateX(8%) translateY(-6%) rotate(8deg); }
    100% { transform: translateX(0%) translateY(0%) rotate(0deg); }
  }

  @keyframes moveBlobB {
    0% { transform: translateX(0%) translateY(0%) rotate(0deg); }
    50% { transform: translateX(-10%) translateY(6%) rotate(-6deg); }
    100% { transform: translateX(0%) translateY(0%) rotate(0deg); }
  }



  /* Floating soft blobs */
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(28px);
    opacity: 0.6;
    mix-blend-mode: screen;
    transform: translate3d(0,0,0);
    animation: floatY 18s ease-in-out infinite;
    z-index: 1;
    pointer-events: none;
  }
  .blob-1 { width: 520px; height: 520px; background: radial-gradient(circle at 30% 30%, rgba(124,58,237,0.7), rgba(124,58,237,0.12)); top: -120px; left: -80px; animation-duration: 22s; }
  .blob-2 { width: 440px; height: 440px; background: radial-gradient(circle at 70% 70%, rgba(34,197,94,0.6), rgba(34,197,94,0.10)); bottom: -100px; right: -120px; animation-duration: 28s; animation-delay: 2s; }
  .blob-3 { width: 380px; height: 380px; background: radial-gradient(circle at 50% 50%, rgba(59,130,246,0.5), rgba(59,130,246,0.10)); top: 60px; right: -120px; animation-duration: 26s; animation-delay: 4s; }



  /* Header hero title and CTA styles */
  .hero-title { text-shadow: 0 8px 36px rgba(2,6,23,0.6); }
  .cta-btn { transition: all .18s ease; border: 1px solid rgba(255,255,255,0.06); }
  .cta-btn:hover { transform: translateY(-3px); opacity: 0.98; }


  @keyframes floatY {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
  }

  /* Card hover micro-interactions */
  .card-animated { transition: transform .25s ease, box-shadow .25s ease; will-change: transform; }
  .card-animated:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px rgba(2,6,23,0.4); }
`;

// Framer Motion variants for subtle entrance animations
const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const blobVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 0.65, scale: 1, y: 0, transition: { duration: 0.9 } },
};

const RadialProgress = ({ value, size = 120 }: { value: number; size?: number }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const bg = `conic-gradient(#10b981 ${clamped}%, rgba(255,255,255,0.06) ${clamped}%)`;
  return (
    <div style={{ width: size, height: size }} className="rounded-full flex items-center justify-center" aria-hidden>
      <div style={{ background: bg }} className="rounded-full flex items-center justify-center" role="img">
        <div className="w-[86%] h-[86%] bg-slate-900/60 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xl">{clamped}%</span>
        </div>
      </div>
    </div>
  );
};

function useAnimatedNumber(target: number, duration = 700) {
  const [num, setNum] = React.useState(0);
  React.useEffect(() => {
    let raf: number;
    const start = performance.now();
    const initial = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setNum(Math.round(initial + (target - initial) * progress));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return num;
}

const ProgressPage = () => {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const [progressData, setProgressData] = useState([]);
  const [stats, setStats] = useState({});
  const [goalExercises, setGoalExercises] = useState(10);
  const [completedExercises, setCompletedExercises] = useState(0);
  const [timeRange, setTimeRange] = useState("week");
  const [heatmapData, setHeatmapData] = useState([]);
  const [feedback, setFeedback] = useState("");
  const animatedCompleted = useAnimatedNumber(completedExercises);
  const animatedAchievements = useAnimatedNumber(Object.keys(stats).length);



  // Inject custom calendar styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = calendarStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Inject animated background and widget styles
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-progress-styles', 'true');
    styleEl.textContent = progressStyles;
    document.head.appendChild(styleEl);
    return () => {
      const existing = document.querySelector('style[data-progress-styles]');
      if (existing) existing.remove();
    };
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchProgress = async () => {
        try {
          const res = await fetch(`/api/progress/${userId}`);
          const data = await res.json();
          setProgressData(data.progress);
          setStats(data.stats || {});
          setCompletedExercises(data.stats?.completedExercises || 0);

          // 🔹 Process streaks
          const streaks = data.streaks || [];
          const formattedStreaks = streaks.map(entry => ({
            date: entry.date, // Ensure MongoDB returns in YYYY-MM-DD format
            count: entry.count, // Number of exercises completed that day
          }));

          setHeatmapData(formattedStreaks);
        } catch (error) {
          console.error("Error fetching progress:", error);
        }
      };
      fetchProgress();
    }
  }, [userId]);

  const fetchAIAnalysis = async () => {
    if (!userId || !progressData || progressData.length === 0) {
      return;
    }
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, progress: progressData }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (error) {
      console.error("Error fetching AI feedback:", error);
    }
  };

  useEffect(() => {
    if (progressData && progressData.length > 0) {
      fetchAIAnalysis();
    }
  }, [progressData, userId]);

  return (
    <div className="relative min-h-screen text-white progress-gradient overflow-hidden">
      {/* Animated gradient overlay + floating blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="blob blob-1" initial="hidden" animate="visible" variants={blobVariant} transition={{ delay: 0.2 }} />
        <motion.div className="blob blob-2" initial="hidden" animate="visible" variants={blobVariant} transition={{ delay: 0.6 }} />
        <motion.div className="blob blob-3" initial="hidden" animate="visible" variants={blobVariant} transition={{ delay: 0.9 }} />
      </div>



      {/* Overlay */}
      <div className="absolute inset-0 bg-black/35"></div>

      {/* Content */}
      <div className="relative z-10">
        <SignedOut>
          <div className="min-h-screen flex items-center justify-center">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
              <p className="text-xl font-semibold text-gray-300">Please sign in to view your progress.</p>
            </motion.div>
          </div>
        </SignedOut>

        <SignedIn>
          {!isLoaded ? (
            <div className="min-h-screen flex items-center justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
                <p className="text-xl font-semibold text-gray-300">Loading your progress...</p>
              </motion.div>
            </div>
          ) : (
        <div className="relative min-h-screen p-6 md:p-12">


          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* Content */}
          <div className="relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12">
              <div className="flex items-center gap-3 mb-2 flex-col md:flex-row md:justify-center md:items-center">
                <TrendingUp className="text-green-500 h-8 w-8" />
                <h1 className="text-5xl md:text-6xl font-bold text-white hero-title">Your Progress</h1>
              </div>
              <p className="text-gray-400 text-lg mt-2 text-center">Track your learning journey and celebrate your achievements</p>


              {/* CTA Buttons */}
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 px-4 sm:px-0">
                <button className="cta-btn w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg bg-white/6 text-white text-sm sm:text-base font-medium transition-all hover:bg-white/10 active:scale-95">
                  Share Progress
                </button>
                <button className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-semibold text-sm sm:text-base shadow-sm hover:shadow-md transition-all active:scale-95">
                  Export CSV
                </button>
              </motion.div>
            </motion.div>

            <motion.div variants={pageVariants} initial="hidden" animate="visible">
            {/* Stats Cards */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-stretch">
              {/* Completed Exercises Card */}
              <motion.div variants={cardVariant}>


              <Card className="card-animated bg-blue-900/30 border-blue-500/30 hover:border-blue-500/60 transition-all backdrop-blur-md h-48 p-4 flex items-center">
                <CardHeader className="pb-3 w-full">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5 text-blue-300" />
                    Goal Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                  <div className="flex items-center justify-between">
                    <RadialProgress value={(completedExercises / goalExercises) * 100} size={84} />
                    <div className="ml-4">
                      <div className="text-3xl font-bold text-white mb-2">{animatedCompleted}/{goalExercises}</div>
                      <p className="text-sm text-gray-200">{Math.round((completedExercises / goalExercises) * 100)}% Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>

              {/* Streak Card */}
              <motion.div variants={cardVariant}>


              <Card className="card-animated bg-orange-900/30 border-orange-500/30 hover:border-orange-500/60 transition-all backdrop-blur-md h-48 p-4 flex items-center">
                <CardHeader className="pb-3 w-full">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Flame className="h-5 w-5 text-orange-300" />
                    Current Streak
                  </CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">{heatmapData.length}</div>
                    <p className="text-sm text-gray-200">Days of consistent practice</p>
                  </div>
                </CardContent>
              </Card>
              </motion.div>  

              {/* Total Stats Card */}
              <motion.div variants={cardVariant}>


              <Card className="card-animated bg-purple-900/30 border-purple-500/30 hover:border-purple-500/60 transition-all backdrop-blur-md h-48 p-4 flex items-center">
                <CardHeader className="pb-3 w-full">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="h-5 w-5 text-purple-300" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">{animatedAchievements}</div>
                    <p className="text-sm text-gray-200">Milestones unlocked</p>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Streak Heatmap */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="lg:col-span-2">


                <Card className="card-animated bg-slate-800/30 border-slate-700/50 backdrop-blur-md h-full">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">Streak Tracker</CardTitle>
                    <CardDescription className="text-gray-400">Your activity over the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>


                    <motion.div variants={cardVariant} className="bg-slate-900/50 p-6 rounded-lg border border-slate-700/50 overflow-x-auto">
                      <ContributionCalendar data={heatmapData} />
                      <Tooltip id="tooltip" className="!bg-slate-800 !text-white !border !border-slate-600" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sidebar */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="space-y-6">
                {/* Time Range Selector */}
                <motion.div variants={cardVariant}>


                <Card className="card-animated bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Time Range</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      onChange={(e) => setTimeRange(e.target.value)}
                      value={timeRange}
                      className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                    </select>
                  </CardContent>
                </Card>
                </motion.div>

                {/* AI Feedback */}
                <motion.div variants={cardVariant}>


                <Card className="card-animated bg-gradient-to-br from-emerald-900/70 to-emerald-900/40 border-emerald-500/40 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Award className="h-5 w-5 text-emerald-300" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {feedback ? (
                        <p className="text-white leading-relaxed text-sm">{feedback}</p>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-300 mb-2"></div>
                          <p className="text-gray-200 text-sm">Analyzing your progress...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              </motion.div>
            </div>

            {/* Bottom Stats Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Detailed Stats */}
              <motion.div variants={cardVariant}>


              <Card className="card-animated bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-gray-400">Completed</span>
                    <span className="text-white font-semibold">{completedExercises} exercises</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-gray-400">Goal</span>
                    <span className="text-white font-semibold">{goalExercises} exercises</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Days</span>
                    <span className="text-white font-semibold">{heatmapData.length}</span>
                  </div>
                </CardContent>
              </Card>
              </motion.div>

              {/* Encouragement Card */}
              <motion.div variants={cardVariant}>


              <Card className="card-animated bg-gradient-to-br from-indigo-900/70 to-indigo-900/40 border-indigo-500/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Keep Going! 🚀</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed">
                    You're making great progress! Continue practicing daily to reach your goals and unlock new achievements.
                  </p>
                </CardContent>
              </Card>
              </motion.div>
            </motion.div>
            </motion.div>
          </div>
          </div>
          </div>
          )}
        </SignedIn>
      </div>
    </div>
  );
};

export default ProgressPage;
