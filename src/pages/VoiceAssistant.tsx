


import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";

import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageCircle, 
  Settings,
  Waves,
  Bot,
  User,
  Clock,
  Sparkles,
  Trash2
} from "lucide-react";

// Declare global interface for Web Speech API compatibility
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Conversation {
  user_text: string;
  ai_response: string;
  timestamp: string;
}

// Define the API base URL
const API_BASE_URL = "http://localhost:5000";

// Quick action phrases for easy interaction
const quickActions = [
  "Hello, how are you?",
  "Tell me about your day",
  "What can you help me with?",
  "How do I practice English?",
  "I need help with pronunciation"
];

export default function VoiceAssistant() {
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [listening, setListening] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Ref to hold the SpeechRecognition instance
  const recognition = useRef<any>(null);
  
  // Clerk user hook
  const { user } = useUser();
  const userId = user?.id;

  // 1. Fetch history when component mounts or user ID changes
  useEffect(() => {
    if (userId) {
      fetchConversationHistory();
    }
  }, [userId]);

  // 2. TTS Function (Speech Synthesis)
  const speakResponse = (text: string) => {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  // 3. Fetch Conversation History
  const fetchConversationHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/voice-assistant/history/${userId}`);
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversation history:", error);
    }
  };

  // 4. Start Listening (Speech-to-Text)
  const startListening = () => {
    if (!userId || listening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser. Please use Chrome.");
      return;
    }

    recognition.current = new SpeechRecognition();
    recognition.current.continuous = false;
    recognition.current.interimResults = false;
    
    recognition.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      sendToAI(transcript);
    };
    
    recognition.current.onend = () => {
      setListening(false);
    };

    recognition.current.start();
    setListening(true);
  };

  // 5. Stop Listening (Manual Stop)
  const stopListening = () => {
    recognition.current?.stop();
    setListening(false);
  };

  // 6. Stop Speaking (User Control)
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // 7. Send to Flask Backend & Trigger TTS
  const sendToAI = async (text: string) => {
    if (!userId || !text.trim()) return;

    setIsProcessing(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/voice-assistant`, {
        user_id: userId,
        text: text
      });
      
      const aiText = response.data.response;
      setAiResponse(aiText);
      speakResponse(aiText);
      fetchConversationHistory(); 
    } catch (error) {
      console.error("Error communicating with AI:", error);
      setAiResponse("Sorry, I encountered an error communicating with the server.");
      setIsSpeaking(false);
    } finally {
      setIsProcessing(false);
    }
  };


  // Handle quick action clicks
  const handleQuickAction = (action: string) => {
    setUserInput(action);
    sendToAI(action);
  };



  // Clear all conversations
  const clearConversations = async (forceClear = false) => {
    if (!userId && !forceClear) {
      console.log("No user ID found");
      return;
    }
    
    // Show confirmation dialog only if not forcing clear
    if (!forceClear && !window.confirm("Are you sure you want to clear all conversations? This action cannot be undone.")) {
      return;
    }
    
    setIsClearing(true);
    console.log("Clearing conversations for user:", userId);
    
    try {
      if (userId && !forceClear) {
        const response = await axios.delete(`${API_BASE_URL}/api/voice-assistant/history/${userId}`);
        console.log("Clear response:", response);
      }
      
      // Clear locally regardless of API success
      setConversations([]);
      setAiResponse("");
      console.log("Conversations cleared successfully");
    } catch (error: any) {
      console.error("Error clearing conversations:", error);
      
      // Always clear locally as fallback
      setConversations([]);
      setAiResponse("");
      console.log("Cleared conversations locally due to API error");
      
      if (!forceClear) {
        alert("Conversations cleared locally. If this was a server error, please try again later.");
      }
    } finally {
      setIsClearing(false);
    }
  };

  // Force clear conversations (for testing/debugging)
  const forceClearConversations = () => {
    clearConversations(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[url('/back.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent" />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                delay: i * 1.5,
              }}
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {/* Left Column - Main Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                EchoFlow Voice Assistant
              </h1>
              <p className="text-purple-200 text-lg">
                Your AI-powered English learning companion
              </p>
              <Badge variant="secondary" className="mt-2 bg-purple-500/20 text-purple-100">
                <Sparkles className="w-3 h-3 mr-1" />
                Powered by AI
              </Badge>
            </motion.div>

            {/* Main Voice Interface Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                <CardContent className="p-8">
                  {/* Voice Visualizer */}
                  <div className="flex justify-center mb-8">
                    <motion.div
                      className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg ${
                        listening ? 'shadow-purple-500/50' : ''
                      }`}
                      animate={{
                        scale: listening ? [1, 1.1, 1] : 1,
                        rotate: isSpeaking ? 360 : 0,
                      }}
                      transition={{
                        scale: { duration: 1, repeat: listening ? Infinity : 0 },
                        rotate: { duration: 2, repeat: isSpeaking ? Infinity : 0, ease: "linear" },
                      }}
                    >
                      {listening ? (
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-purple-300"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      ) : null}
                      
                      <motion.div
                        className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center"
                        animate={{ 
                          backgroundColor: listening ? '#8b5cf6' : '#ffffff33',
                        }}
                      >
                        {listening ? (
                          <Waves className="w-8 h-8 text-white animate-pulse" />
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Status Display */}
                  <div className="text-center mb-6">
                    <AnimatePresence mode="wait">
                      {listening && (
                        <motion.div
                          key="listening"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center justify-center space-x-2 text-purple-200"
                        >
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                          <span className="text-lg font-medium">Listening...</span>
                        </motion.div>
                      )}
                      {isSpeaking && (
                        <motion.div
                          key="speaking"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center justify-center space-x-2 text-blue-200"
                        >
                          <Volume2 className="w-4 h-4 animate-pulse" />
                          <span className="text-lg font-medium">AI is speaking...</span>
                        </motion.div>
                      )}
                      {isProcessing && (
                        <motion.div
                          key="processing"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center justify-center space-x-2 text-yellow-200"
                        >
                          <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
                          <span className="text-lg font-medium">Processing...</span>
                        </motion.div>
                      )}
                      {!listening && !isSpeaking && !isProcessing && (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-gray-300"
                        >
                          <span className="text-lg font-medium">Ready to listen</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <Button
                      onClick={startListening}
                      disabled={listening || isSpeaking || isProcessing || !userId}
                      className={`${
                        listening
                          ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-500/25'
                      } transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105`}
                      size="lg"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {listening ? "Listening..." : "Start Speaking"}
                    </Button>
                    


                    <Button
                      onClick={stopListening}
                      disabled={!listening}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-orange-500/25 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      size="lg"
                    >
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                    

                    <Button
                      onClick={stopSpeaking}
                      disabled={!isSpeaking}
                      variant="destructive"
                      className="bg-red-500/80 hover:bg-red-600 shadow-red-500/25"
                      size="lg"
                    >
                      <VolumeX className="w-4 h-4 mr-2" />
                      Stop AI
                    </Button>
                  </div>

                  {/* User Input Display */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Your Speech
                      </label>
                      <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <Textarea
                            value={userInput}
                            placeholder={listening ? "Speak now..." : "Your spoken words will appear here..."}
                            className="bg-transparent border-none text-white placeholder:text-gray-400 resize-none min-h-[80px]"
                            readOnly
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* AI Response Display */}
                    <AnimatePresence>
                      {aiResponse && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <label className="block text-sm font-medium text-blue-200 mb-2">
                            AI Response
                          </label>
                          <Card className={`bg-gradient-to-r ${
                            isSpeaking 
                              ? 'from-blue-500/20 to-purple-500/20 border-blue-400/50' 
                              : 'from-purple-500/20 to-pink-500/20 border-purple-400/50'
                          } border backdrop-blur-sm shadow-lg`}>
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <motion.div
                                  animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
                                  transition={{ duration: 1, repeat: isSpeaking ? Infinity : 0 }}
                                >
                                  <Bot className="w-5 h-5 text-blue-300 mt-1" />
                                </motion.div>
                                <p className="text-white flex-1 leading-relaxed">{aiResponse}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleQuickAction(action)}
                        disabled={isSpeaking || listening || isProcessing}
                        className="text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-white hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {action}
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Conversation History */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                <CardContent className="p-6">

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Recent Conversations
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearConversations}
                        disabled={conversations.length === 0}
                        className="text-red-300 hover:text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Clear all conversations"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-white hover:bg-white/10"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    <AnimatePresence>
                      {conversations.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 text-gray-400"
                        >
                          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No conversations yet</p>
                          <p className="text-sm">Start speaking to begin!</p>
                        </motion.div>
                      ) : (
                        conversations.slice(-8).reverse().map((conv, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="space-y-3"
                          >
                            {/* User Message */}
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <Card className="bg-purple-500/20 border-purple-400/30">
                                  <CardContent className="p-3">
                                    <p className="text-white text-sm">{conv.user_text}</p>
                                    <div className="flex items-center mt-2 text-xs text-purple-200">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {new Date(conv.timestamp).toLocaleTimeString()}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>

                            {/* AI Response */}
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <Card className="bg-blue-500/20 border-blue-400/30">
                                  <CardContent className="p-3">
                                    <p className="text-white text-sm">{conv.ai_response}</p>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Voice Speed</label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            defaultValue="1"
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Voice Pitch</label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            defaultValue="1"
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-white/30 text-white hover:bg-white/10"
                          onClick={() => {
                            const voices = window.speechSynthesis.getVoices();
                            console.log('Available voices:', voices);
                          }}
                        >
                          Check Available Voices
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
