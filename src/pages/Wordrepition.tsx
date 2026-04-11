import { useState, useEffect, useRef } from "react";  
import { Button } from "@/components/ui/button";  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";  
import { Brain, Mic, Volume2, Timer, RotateCw, Sparkles, Target, Trophy, Star, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";


// Declare global types for SpeechRecognition  
declare global {  
  interface Window {  
    SpeechRecognition: any;  
    webkitSpeechRecognition: any;  
  }  
}  

// Medium difficulty words  
const mediumWords = [  
  "Mountain", "Forest", "Castle", "Notebook", "Balloon", "Bicycle", "Planet",  
  "Lighthouse", "Horizon", "Butterfly", "Adventure", "Beautiful", "Celebrate",  
  "Discovery", "Elephant", "Fantastic", "Generous", "Happiness", "Important",  
  "Journey", "Knowledge", "Language", "Memories", "Nutrition", "Original",  
  "Peaceful", "Question", "Remember", "Surprise", "Tomorrow", "Universe",  
  "Vacation", "Wonderful", "Yourself", "Afternoon",
];  

// Difficult words  
const difficultWords = [  
  "Ephemeral", "Mellifluous", "Euphoria", "Ineffable", "Oscillate", "Nocturnal",  
  "Garrulous", "Vestigial", "Pernicious", "Wanderlust", "Vernacular", "Loquacious",  
  "Incandescent", "Sublime", "Axiom", "Effervescent", "Quiddity", "Nebulous",  
  "Limerence", "Fandangle", "Bombastic"     
];  

// Get 5 words: 2 difficult and 3 medium  
const getRandomWords = (): string[] => {  // ✅ Explicitly set return type
  const randomMediumWords: string[] = [];
  const randomDifficultWords: string[] = [];

  for (let i = 0; i < 3; i++) {
    const randomMediumWord = mediumWords[Math.floor(Math.random() * mediumWords.length)];
    randomMediumWords.push(randomMediumWord);
  }

  for (let i = 0; i < 2; i++) {
    const randomDifficultWord = difficultWords[Math.floor(Math.random() * difficultWords.length)];
    randomDifficultWords.push(randomDifficultWord);
  }

  return [...randomDifficultWords, ...randomMediumWords];  // ✅ This will now be recognized as string[]
};



const WordRepetitionGame = () => {
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null); 
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);  
  const [isMemorizing, setIsMemorizing] = useState(true);  
  const [timeLeft, setTimeLeft] = useState(6);
  const recognitionRef = useRef<any>(null);  
  const navigate = useNavigate();  
  const { user } = useUser();
  const userId = user?.id;
  const [speechResult, setSpeechResult] = useState("");  

  // Initialize SpeechRecognition  
  useEffect(() => {  
    const SpeechRecognition =  
      window.SpeechRecognition || window.webkitSpeechRecognition;  

    if (!SpeechRecognition) {  
      alert("Speech Recognition is not supported in this browser.");  
      return;  
    }  

    recognitionRef.current = new SpeechRecognition();  
    recognitionRef.current.continuous = false;  
    recognitionRef.current.interimResults = false;  
    recognitionRef.current.lang = "en-US";  

    recognitionRef.current.onresult = (event: any) => {
      let speechResult = "";
      
      // Capture all recognized words in case of multiple results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        speechResult += event.results[i][0].transcript + " ";
      }
    
      speechResult = speechResult.trim();
      setSpeechResult(speechResult);  
    
      setFeedback({ message: `You said: "${speechResult}"`, type: "success" });
    
      const userWords = speechResult.toLowerCase().split(" ");
      let correctCount = 0;
    
      targetWords.forEach((word) => {
        if (userWords.includes(word.toLowerCase())) {
          correctCount++;
        }
      });
    
      const accuracy = Math.round((correctCount / targetWords.length) * 100);
    
      setTimeout(() => {
        setFeedback({
          message: `You said: "${speechResult}"\nAccuracy: ${accuracy}% (${correctCount}/${targetWords.length} words correct)`,
          type: accuracy >= 70 ? "success" : "error",
        });
        saveProgress(accuracy, speechResult);  
      }, 1500);
    };
    
    recognitionRef.current.onerror = (event: any) => {  
      console.error("Speech recognition error:", event.error);  
      setFeedback({ message: "Sorry, there was an error with speech recognition.", type: 'error' });  
    };  

    recognitionRef.current.onend = () => {  
      setIsRecording(false);  
    }; 
  }, [targetWords]);  

  // Timer effect for memorization
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isMemorizing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isMemorizing, timeLeft]);

  // Fetch User Progress on Component Mount
  useEffect(() => {
    if (userId) {
      fetchUserProgress();
    }
  }, [userId]);

  const startRecording = () => {  
    if (!isRecording) {  
      recognitionRef.current?.start();  
      setIsRecording(true);  
      setIsMemorizing(false);  
    }  
  };  

  const stopRecording = () => {  
    if (isRecording) {  
      recognitionRef.current?.stop();  
      setIsRecording(false);  
    }  
  };  

  const startNewRound = () => {  
    const randomWords: string[] = getRandomWords();
    setTargetWords(randomWords);  
    setFeedback(null);  
    setIsRecording(false);  
    setIsMemorizing(true);  
    setTimeLeft(6);
  
    setTimeout(() => {  
      setIsMemorizing(false);  
    }, 6000);  
  };  

  const fetchUserProgress = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/word-repetition/progress/${userId}`);
      setUserProgress(response.data.progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };
  
  const saveProgress = async (accuracy: number, speechResult: string) => {
    try {
      await axios.post("http://localhost:5000/api/word-repetition/progress", {
        user_id: userId,
        accuracy: accuracy,
        words_attempted: targetWords.length,
        correct_words: accuracy >= 70 ? targetWords.length : Math.round((accuracy / 100) * targetWords.length),
        user_speech: speechResult, 
        target_words: targetWords,
        timestamp: new Date().toISOString(),
      });
  
      fetchUserProgress();  
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };


  return (  
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        {/* Floating animated shapes */}
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
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-8 shadow-xl border border-white/20">
            <Brain className="h-8 w-8 text-white mr-3" />
            <h1 className="text-4xl font-bold text-white">Memory Challenge</h1>
          </div>
          <p className="text-white/90 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            Test your memory and pronunciation skills with our interactive word challenge
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Memorization Section */}
          {isMemorizing && targetWords.length > 0 && (  
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                    <Timer className="h-6 w-6 text-white" />
                  </div>
                  Memorize These Words
                </h2>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                  <Timer className="h-5 w-5 text-purple-600" />
                  <span className="text-xl font-mono font-bold text-purple-800">{timeLeft}s</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {targetWords.map((word, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="text-xl font-bold text-purple-800">{word}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recording Status */}
          {isRecording && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-red-100 to-pink-100 rounded-2xl border-2 border-red-200 shadow-lg"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Mic className="h-8 w-8 text-red-600" />
              </motion.div>
              <span className="text-xl font-bold text-red-700">Listening...</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "w-full h-20 text-xl gap-3 rounded-2xl shadow-xl transition-all duration-300",
                  isRecording 
                    ? "bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800" 
                    : "bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800"
                )}
              >
                {isRecording ? (
                  <>
                    <Volume2 className="h-7 w-7" />
                    <span className="font-bold">Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-7 w-7" />
                    <span className="font-bold">Start Practice</span>
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={startNewRound}
                className="w-full h-20 text-xl gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl shadow-xl transition-all duration-300"
              >
                <RotateCw className="h-7 w-7" />
                <span className="font-bold">New Challenge</span>
              </Button>
            </motion.div>
          </div>

          {/* Feedback */}
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-6 rounded-2xl border-2 shadow-xl",
                feedback.type === 'success' 
                  ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
                  : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  feedback.type === 'success' ? "bg-emerald-500" : "bg-red-500"
                )}>
                  {feedback.type === 'success' ? (
                    <Trophy className="h-6 w-6 text-white" />
                  ) : (
                    <Target className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-lg font-semibold leading-relaxed",
                    feedback.type === 'success' ? "text-emerald-800" : "text-red-800"
                  )}>
                    {feedback.message.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordRepetitionGame;
