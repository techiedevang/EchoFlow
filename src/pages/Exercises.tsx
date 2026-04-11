
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Mic, 
  StopCircle, 
  Award, 
  Mic2, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2,
  Target,
  CheckCircle,
  Circle,
  Sparkles,
  Trophy,
  Star
} from "lucide-react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface Exercise {
  id: number;
  phrase: string;
  difficulty: string;
  completed: boolean;
  attempts: number;
  audioURL: string | null;
  transcribedText: string | null;
  accuracy: number | null;
  startTime: number | null;
  duration: number | null;
}

const allTongueTwisters = [
  { phrase: "Peter Piper picked a peck of pickled peppers", difficulty: "Hard", emoji: "🌶️" },
  { phrase: "She sells seashells by the seashore", difficulty: "Medium", emoji: "🐚" },
  { phrase: "How much wood would a woodchuck chuck", difficulty: "Hard", emoji: "🦫" },
  { phrase: "I scream, you scream, we all scream for ice cream", difficulty: "Easy", emoji: "🍦" },
  { phrase: "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair", difficulty: "Medium", emoji: "🧸" },
  { phrase: "Betty bought some butter, but the butter was bitter", difficulty: "Hard", emoji: "🧈" },
  { phrase: "A proper copper coffee pot", difficulty: "Medium", emoji: "☕" },
  { phrase: "Toy boat, toy boat, toy boat", difficulty: "Easy", emoji: "🚢" },
  { phrase: "Unique New York, Unique New York", difficulty: "Hard", emoji: "🗽" },
  { phrase: "Red lorry, yellow lorry", difficulty: "Medium", emoji: "🚛" },
  { phrase: "Six sleek swans swam swiftly southwards", difficulty: "Hard", emoji: "🦢" },
  { phrase: "Black background, brown background", difficulty: "Easy", emoji: "🎨" }
];

const getRandomExercises = (count = 6) => {
  const shuffled = [...allTongueTwisters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((item, index) => ({
    id: index + 1,
    phrase: item.phrase,
    difficulty: item.difficulty,
    completed: false,
    attempts: 0,
    audioURL: null,
    transcribedText: null,
    accuracy: null,
    startTime: null,
    duration: null,
  }));
};

const calculateAccuracy = (original: string, transcribed: string): number => {
  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const originalNormalized = normalizeText(original);
  const transcribedNormalized = normalizeText(transcribed);

  if (!transcribedNormalized) return 0;

  const originalWords = originalNormalized.split(" ");
  const transcribedWords = transcribedNormalized.split(" ");

  let matches = 0;
  const total = originalWords.length;

  originalWords.forEach((word, index) => {
    if (transcribedWords[index] === word) {
      matches++;
    } else if (transcribedWords.includes(word)) {
      matches += 0.5;
    }
  });

  const extraWords = Math.max(transcribedWords.length - originalWords.length, 0);
  const accuracy = ((matches - extraWords * 0.2) / total) * 100;
  return Math.max(accuracy, 0);
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy": return "bg-green-100 text-green-800 border-green-200";
    case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Hard": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getDifficultyIcon = (difficulty: string) => {
  switch (difficulty) {
    case "Easy": return <Circle className="h-3 w-3" />;
    case "Medium": return <Target className="h-3 w-3" />;
    case "Hard": return <Star className="h-3 w-3" />;
    default: return <Circle className="h-3 w-3" />;
  }
};

const getFeedback = (accuracy: number) => {
  if (accuracy >= 90) return { message: "🎉 Perfect! Excellent articulation!", color: "text-emerald-600", bgColor: "bg-emerald-50" };
  if (accuracy >= 75) return { message: "👍 Great job! Almost there!", color: "text-blue-600", bgColor: "bg-blue-50" };
  if (accuracy >= 60) return { message: "💪 Good effort, keep practicing!", color: "text-orange-600", bgColor: "bg-orange-50" };
  return { message: "❌ Needs improvement. Try again!", color: "text-red-600", bgColor: "bg-red-50" };
};

const Exercises = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentExerciseId, setCurrentExerciseId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const recognition = useRef<any>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const finalTranscript = useRef("");

  useEffect(() => {
    setExercises(getRandomExercises(6));
    initializeSpeechRecognition();
  }, []);

  useEffect(() => {
    const completed = exercises.filter((ex) => ex.completed).length;
    setOverallProgress((completed / exercises.length) * 100);
  }, [exercises]);

  const initializeSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = "en-US";

      recognition.current.onresult = (event: any) => {
        const results = Array.from(event.results) as SpeechRecognitionResult[];
        const latestResult = results[results.length - 1];
        
        if (latestResult.isFinal) {
          finalTranscript.current = latestResult[0].transcript;
        }
      };
      recognition.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };
    }
  };

  const startRecording = async (exerciseId: number) => {
    if (!recognition.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setExercises((prev) =>
          prev.map((ex) =>
            ex.id === exerciseId ? { ...ex, audioURL: audioUrl, duration: Date.now() - (ex.startTime || Date.now()) } : ex
          )
        );
      };

      finalTranscript.current = "";
      setCurrentExerciseId(exerciseId);
      mediaRecorder.current.start();
      recognition.current.start();
      setIsRecording(true);

      // Set start time
      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId ? { ...ex, startTime: Date.now() } : ex
      ));
    } catch (err) {
      console.error("Microphone access error:", err);
      alert(". Please enable permissionsMicrophone access required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    if (recognition.current) {
      recognition.current.stop();
      
      recognition.current.onend = () => {
        setExercises(prev => prev.map(ex => {
          if (ex.id !== currentExerciseId) return ex;
          const accuracy = calculateAccuracy(ex.phrase, finalTranscript.current);
          return {
            ...ex,
            attempts: ex.attempts + 1,
            transcribedText: finalTranscript.current,
            accuracy,
            completed: accuracy >= 70,
            duration: ex.startTime ? Date.now() - ex.startTime : null
          };
        }));
      };
    }
    setIsRecording(false);
    setCurrentExerciseId(null);
  };

  const resetExercises = () => {
    setExercises(getRandomExercises(6));
    setOverallProgress(0);
    finalTranscript.current = "";
    setIsPlaying(null);
  };

  const toggleAudioPlayback = (exerciseId: number, audioURL: string) => {
    if (isPlaying === exerciseId) {
      setIsPlaying(null);
    } else {
      setIsPlaying(exerciseId);
      // Auto stop after 3 seconds for demo
      setTimeout(() => setIsPlaying(null), 3000);
    }
  };

  const completedCount = exercises.filter(ex => ex.completed).length;
  const averageAccuracy = exercises.filter(ex => ex.accuracy !== null)
    .reduce((sum, ex) => sum + (ex.accuracy || 0), 0) / Math.max(exercises.filter(ex => ex.accuracy !== null).length, 1);



  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        {/* Animated floating shapes */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-gradient-to-br from-pink-400/20 to-red-600/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-40 right-40 w-72 h-72 bg-gradient-to-br from-yellow-400/20 to-orange-600/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-6000"></div>
        </div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">



        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-8 shadow-xl border border-white/20">
            <Mic2 className="h-8 w-8 text-white mr-3" />
            <h1 className="text-4xl font-bold text-white">Speech Practice Studio</h1>
          </div>
          <p className="text-white/90 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            Master your pronunciation with our interactive tongue twisters and speech exercises
          </p>
        </motion.div>



        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="group relative overflow-hidden bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-rotate-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-green-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-transparent rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700"></div>
            <CardContent className="relative p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl shadow-lg ring-2 ring-emerald-300/30">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold text-gray-900">{completedCount}</div>
                  <div className="text-sm font-medium text-gray-600">/ {exercises.length}</div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Completed</h3>
                <p className="text-sm text-gray-600">Exercises finished successfully</p>
                <div className="mt-3 h-3 bg-gray-200/80 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-1000 shadow-sm"
                    style={{ width: `${(completedCount / exercises.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/30 to-transparent rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700"></div>
            <CardContent className="relative p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl shadow-lg ring-2 ring-blue-300/30">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold text-gray-900">{averageAccuracy.toFixed(1)}%</div>
                  <div className="text-sm font-medium text-gray-600">accuracy</div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Average Score</h3>
                <p className="text-sm text-gray-600">Your pronunciation accuracy</p>
                <div className="mt-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${
                        i < Math.floor(averageAccuracy / 20) 
                          ? 'text-yellow-400 fill-current drop-shadow-sm' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:rotate-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/30 to-transparent rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700"></div>
            <CardContent className="relative p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl shadow-lg ring-2 ring-purple-300/30">
                  <RotateCcw className="h-8 w-8 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold text-gray-900">
                    {exercises.reduce((sum, ex) => sum + ex.attempts, 0)}
                  </div>
                  <div className="text-sm font-medium text-gray-600">attempts</div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Total Attempts</h3>
                <p className="text-sm text-gray-600">Practice makes perfect</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-sm"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-200 shadow-sm"></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse animation-delay-400 shadow-sm"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Progress Section */}
        <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Completion Rate</span>
                <span className="font-bold text-gray-900">{overallProgress.toFixed(1)}%</span>
              </div>
              <Progress 
                value={overallProgress} 
                className="h-4 bg-gray-200/80 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-600 [&>div]:shadow-lg shadow-inner" 
              />
            </div>
          </CardContent>
        </Card>


        {/* Reset Button */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={resetExercises}
            className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-110 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center gap-3">
              <RotateCcw className="h-6 w-6 group-hover:rotate-180 transition-transform duration-700" />
              <span className="font-bold text-lg">Generate New Exercises</span>
              <Sparkles className="h-5 w-5 opacity-60" />
            </div>
          </Button>
        </div>

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {exercises.map((exercise, index) => {
            const currentItem = allTongueTwisters.find(item => item.phrase === exercise.phrase);
            const feedback = exercise.accuracy !== null ? getFeedback(exercise.accuracy) : null;
            
            return (


              <Card 
                key={exercise.id}
                className={`group relative overflow-hidden transition-all duration-700 hover:shadow-2xl hover:scale-[1.03] ${
                  exercise.completed 
                    ? "bg-white/95 backdrop-blur-lg border-2 border-emerald-300/50 shadow-2xl shadow-emerald-500/30" 
                    : "bg-white/95 backdrop-blur-lg border border-white/30 shadow-2xl hover:shadow-3xl"
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Enhanced animated background */}
                {exercise.completed && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/15 via-green-400/10 to-teal-400/15 animate-pulse"></div>
                )}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                
                {/* Card number badge */}
                <div className="absolute top-4 right-4 z-20">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-lg ring-2 ring-white/50 ${
                    exercise.completed 
                      ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white' 
                      : 'bg-white/90 text-gray-700 group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-purple-600 group-hover:text-white group-hover:ring-blue-400/30'
                  }`}>
                    {exercise.id}
                  </div>
                </div>

                <CardHeader className="relative pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {currentItem?.emoji && (
                        <div className="w-18 h-18 bg-gradient-to-br from-white to-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 ring-2 ring-white/50">
                          {currentItem.emoji}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-3 leading-relaxed group-hover:text-gray-800 transition-colors">
                        {exercise.phrase}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${getDifficultyColor(exercise.difficulty)} border-2 font-semibold px-3 py-1 shadow-sm`}
                        >
                          {getDifficultyIcon(exercise.difficulty)}
                          <span className="ml-1">{exercise.difficulty}</span>
                        </Badge>
                        {exercise.completed && (
                          <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-2 border-emerald-200 shadow-md">
                            <Trophy className="h-3 w-3 mr-1" />
                            <span className="font-semibold">Completed</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>



                <CardContent className="space-y-8">
                  {/* Enhanced Exercise Stats */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{exercise.attempts}</div>
                        <div className="text-xs text-gray-500 font-medium">Attempts</div>
                      </div>
                      {exercise.duration && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{(exercise.duration / 1000).toFixed(1)}s</div>
                          <div className="text-xs text-gray-500 font-medium">Duration</div>
                        </div>
                      )}
                    </div>
                    {exercise.completed && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                        <Sparkles className="h-4 w-4 text-yellow-600 animate-pulse" />
                        <span className="text-sm font-semibold text-yellow-700">Perfect!</span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Recording Controls */}
                  <div className="space-y-4">
                    {!isRecording || currentExerciseId !== exercise.id ? (
                      <Button
                        onClick={() => startRecording(exercise.id)}
                        disabled={isRecording}
                        className="group relative w-full py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative flex items-center justify-center gap-3">
                          <Mic className="h-6 w-6 group-hover:animate-pulse" />
                          <span className="font-bold text-lg">
                            {exercise.attempts > 0 ? "Try Again" : "Start Recording"}
                          </span>
                          {exercise.attempts === 0 && <Target className="h-5 w-5 opacity-70" />}
                        </div>
                      </Button>
                    ) : (
                      <Button
                        onClick={stopRecording}
                        variant="destructive"
                        className="group relative w-full py-5 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 animate-pulse"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                        <div className="relative flex items-center justify-center gap-3">
                          <StopCircle className="h-6 w-6" />
                          <span className="font-bold text-lg">Stop Recording</span>
                        </div>
                      </Button>
                    )}

                    {/* Enhanced Audio Playback */}
                    {exercise.audioURL && (
                      <div className="relative p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200 shadow-inner">
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={() => toggleAudioPlayback(exercise.id, exercise.audioURL!)}
                            variant="ghost"
                            size="sm"
                            className="p-3 bg-white hover:bg-gray-100 rounded-full shadow-md transition-all duration-300 hover:scale-110"
                          >
                            {isPlaying === exercise.id ? (
                              <Pause className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Play className="h-5 w-5 text-blue-600" />
                            )}
                          </Button>
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-5 w-5 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">Your Recording</span>
                          </div>
                        </div>
                        {isPlaying === exercise.id && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                            <div className="flex gap-1">
                              <div className="w-1 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-1 h-6 bg-purple-500 rounded-full animate-bounce animation-delay-100"></div>
                              <div className="w-1 h-3 bg-blue-500 rounded-full animate-bounce animation-delay-200"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>


                  {/* Enhanced Results Section */}
                  {(exercise.transcribedText || exercise.accuracy !== null) && (
                    <div className="space-y-6">
                      {exercise.transcribedText && (
                        <div className="group relative p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
                          <div className="relative">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                                <Volume2 className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <span className="text-sm font-bold text-blue-800">You said:</span>
                                <div className="text-xs text-blue-600">Speech Recognition Result</div>
                              </div>
                            </div>
                            <div className="p-4 bg-white/80 rounded-xl border border-blue-200/50">
                              <p className="text-blue-900 font-medium italic leading-relaxed">
                                "{exercise.transcribedText}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {exercise.accuracy !== null && feedback && (
                        <div className={`group relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all duration-500 ${
                          exercise.accuracy >= 90 
                            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200' 
                            : exercise.accuracy >= 75
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                            : exercise.accuracy >= 60
                            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                            : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                        }`}>
                          <div className={`absolute inset-0 rounded-2xl opacity-20 ${
                            exercise.accuracy >= 90 
                              ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                              : exercise.accuracy >= 75
                              ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                              : exercise.accuracy >= 60
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                              : 'bg-gradient-to-br from-red-400 to-pink-500'
                          }`}></div>
                          
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl shadow-lg ${
                                  exercise.accuracy >= 90 
                                    ? 'bg-gradient-to-br from-emerald-400 to-green-600' 
                                    : exercise.accuracy >= 75
                                    ? 'bg-gradient-to-br from-blue-400 to-indigo-600'
                                    : exercise.accuracy >= 60
                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-600'
                                    : 'bg-gradient-to-br from-red-400 to-pink-600'
                                }`}>
                                  <Target className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <div className="text-3xl font-extrabold text-gray-900">
                                    {exercise.accuracy.toFixed(1)}%
                                  </div>
                                  <div className="text-sm font-medium text-gray-600">Accuracy Score</div>
                                </div>
                              </div>
                              {exercise.accuracy >= 90 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-full">
                                  <Trophy className="h-6 w-6 text-yellow-600 animate-bounce" />
                                  <span className="font-bold text-yellow-700">Outstanding!</span>
                                </div>
                              )}
                            </div>

                            <div className={`p-4 rounded-xl mb-4 ${
                              exercise.accuracy >= 90 
                                ? 'bg-emerald-100/80 border border-emerald-200' 
                                : exercise.accuracy >= 75
                                ? 'bg-blue-100/80 border border-blue-200'
                                : exercise.accuracy >= 60
                                ? 'bg-yellow-100/80 border border-yellow-200'
                                : 'bg-red-100/80 border border-red-200'
                            }`}>
                              <p className={`text-base font-bold ${
                                exercise.accuracy >= 90 
                                  ? 'text-emerald-800' 
                                  : exercise.accuracy >= 75
                                  ? 'text-blue-800'
                                  : exercise.accuracy >= 60
                                  ? 'text-yellow-800'
                                  : 'text-red-800'
                              }`}>
                                {feedback.message}
                              </p>
                            </div>

                            {/* Enhanced Visual Accuracy Bar */}
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="font-semibold text-gray-700">Performance Level</span>
                                <span className="font-bold text-gray-900">
                                  {exercise.accuracy >= 90 ? 'Excellent' :
                                   exercise.accuracy >= 75 ? 'Good' :
                                   exercise.accuracy >= 60 ? 'Fair' : 'Needs Practice'}
                                </span>
                              </div>
                              <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                  <div 
                                    className={`h-full transition-all duration-2000 ease-out ${
                                      exercise.accuracy >= 90 
                                        ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600' 
                                        : exercise.accuracy >= 75
                                        ? 'bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600'
                                        : exercise.accuracy >= 60
                                        ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600'
                                        : 'bg-gradient-to-r from-red-400 via-pink-500 to-red-600'
                                    }`}
                                    style={{ width: `${Math.min(exercise.accuracy, 100)}%` }}
                                  ></div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                              </div>
                              
                              {/* Accuracy markers */}
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>


        {/* Footer */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
              <span className="text-lg font-semibold text-white">
                Keep practicing to improve your pronunciation skills! 🎯
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exercises;
