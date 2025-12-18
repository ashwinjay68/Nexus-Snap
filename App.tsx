import React, { useState } from 'react';
import { Camera, BookOpen, BrainCircuit, Sparkles, AlertCircle } from 'lucide-react';
import { CameraView } from './components/CameraView';
import { QuizPlayer } from './components/QuizPlayer';
import { AppState, Question } from './types';
import { generateQuizFromImage } from './services/geminiService';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startFlow = () => setAppState(AppState.CAMERA);

  const handleCapture = (image: string) => {
    setCapturedImage(image);
    setAppState(AppState.CONFIG);
  };

  const handleGenerate = async () => {
    if (!capturedImage) return;
    
    setAppState(AppState.GENERATING);
    setErrorMsg(null);
    
    try {
      const generatedQuestions = await generateQuizFromImage(capturedImage, questionCount);
      setQuestions(generatedQuestions);
      setAppState(AppState.QUIZ);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to analyze image. Please try again with a clearer photo.");
      setAppState(AppState.ERROR);
    }
  };

  const handleQuizFinish = (finalScore: number) => {
    setScore(finalScore);
    setAppState(AppState.RESULT);
  };

  const resetApp = () => {
    setAppState(AppState.WELCOME);
    setCapturedImage(null);
    setQuestions([]);
    setScore(0);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-black selection:text-white">
      
      {/* Top Navigation / Header */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-40 h-16 flex items-center px-4 justify-center md:justify-start">
        <div className="flex items-center gap-3 text-black">
          <BrainCircuit size={24} strokeWidth={2} />
          <h1 className="text-lg font-semibold tracking-tight uppercase tracking-wider text-xs md:text-sm">Nexus Cloud | Student Bridge</h1>
        </div>
      </nav>

      <main className="pt-20 pb-8 px-4 h-full min-h-screen flex flex-col items-center justify-center max-w-md mx-auto md:max-w-2xl">
        
        {/* VIEW: WELCOME */}
        {appState === AppState.WELCOME && (
          <div className="flex flex-col items-center text-center space-y-10 animate-fade-in w-full">
            <div className="relative w-full max-w-sm">
              <div className="border border-gray-200 p-2 bg-gray-50 rounded-none">
                <img 
                  src="https://picsum.photos/400/300?grayscale" 
                  alt="Study" 
                  className="w-full h-auto object-cover aspect-[4/3] filter grayscale contrast-125"
                />
              </div>
              <div className="absolute -bottom-5 -right-5 bg-black text-white p-3 border border-black">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-4 max-w-sm">
              <h2 className="text-4xl font-bold text-black tracking-tighter">Nexus Cloud</h2>
              <p className="text-gray-500 font-medium">
                Digitize your notes. Generate quizzes. Bridge the gap to mastery.
              </p>
            </div>

            <button 
              onClick={startFlow}
              className="w-full max-w-xs bg-black hover:bg-gray-800 text-white font-medium py-4 px-8 rounded-none border border-black transition-all transform flex items-center justify-center gap-3"
            >
              <Camera size={20} />
              <span>SCAN NOTES</span>
            </button>
          </div>
        )}

        {/* VIEW: CAMERA */}
        {appState === AppState.CAMERA && (
          <CameraView 
            onCapture={handleCapture} 
            onCancel={() => setAppState(AppState.WELCOME)} 
          />
        )}

        {/* VIEW: CONFIG */}
        {appState === AppState.CONFIG && capturedImage && (
          <div className="w-full bg-white border border-gray-200 p-6 space-y-6">
            <div className="w-full h-56 overflow-hidden bg-gray-50 relative mb-4 border border-gray-200">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover grayscale opacity-90" />
              <div className="absolute bottom-4 right-4 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Source Acquired
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                 <h3 className="text-lg font-bold text-black uppercase tracking-wide">Configuration</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-4 flex justify-between">
                  <span>QUESTION COUNT</span>
                  <span className="text-black font-bold text-lg">{questionCount}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={questionCount} 
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 appearance-none cursor-pointer accent-black rounded-none"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
                  <span>01</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setAppState(AppState.CAMERA)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors uppercase text-sm tracking-wide rounded-none"
              >
                Retake
              </button>
              <button 
                onClick={handleGenerate}
                className="flex-[2] py-3 px-4 bg-black text-white font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-wide rounded-none"
              >
                <BrainCircuit size={18} />
                Generate
              </button>
            </div>
          </div>
        )}

        {/* VIEW: GENERATING */}
        {appState === AppState.GENERATING && (
          <div className="flex flex-col items-center justify-center text-center space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-2 border-gray-100 border-t-black rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-black uppercase tracking-widest">Processing</h3>
              <p className="text-gray-400 max-w-xs mx-auto text-sm">
                Nexus is analyzing data points to construct your assessment matrix.
              </p>
            </div>
          </div>
        )}

        {/* VIEW: ERROR */}
        {appState === AppState.ERROR && (
          <div className="bg-white p-8 border border-red-200 text-center max-w-sm">
            <div className="w-12 h-12 bg-red-50 flex items-center justify-center mx-auto mb-4 rounded-full">
              <AlertCircle className="text-red-500" size={24} />
            </div>
            <h3 className="text-lg font-bold text-black mb-2 uppercase">System Alert</h3>
            <p className="text-gray-600 mb-6 text-sm">{errorMsg || "An unexpected error occurred."}</p>
            <button 
              onClick={() => setAppState(AppState.CAMERA)}
              className="w-full py-3 bg-black text-white font-medium hover:bg-gray-800 uppercase text-xs tracking-widest rounded-none"
            >
              Re-initialize
            </button>
          </div>
        )}

        {/* VIEW: QUIZ */}
        {appState === AppState.QUIZ && questions.length > 0 && (
          <QuizPlayer 
            questions={questions} 
            onFinish={handleQuizFinish} 
          />
        )}

        {/* VIEW: RESULT */}
        {appState === AppState.RESULT && (
          <div className="w-full bg-white border border-gray-200 p-8 text-center space-y-8 animate-fade-in">
            <div className="inline-block p-4 bg-gray-50 mb-2 border border-gray-100">
              <BookOpen className="w-8 h-8 text-black" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-black mb-1 uppercase tracking-tight">Session Concluded</h2>
              <p className="text-gray-400 text-sm">Assessment data ready</p>
            </div>

            <div className="py-8 border-y border-dashed border-gray-200">
              <div className="text-7xl font-black text-black mb-2 tracking-tighter">
                {Math.round((score / questions.length) * 100)}<span className="text-3xl font-thin text-gray-400">%</span>
              </div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                Score: {score} / {questions.length}
              </p>
            </div>

            <button 
              onClick={resetApp}
              className="w-full py-4 bg-black text-white font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-all rounded-none"
            >
              Start New Session
            </button>
          </div>
        )}

      </main>
    </div>
  );
}