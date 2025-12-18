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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Navigation / Header */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-40 h-16 flex items-center px-4 justify-center md:justify-start">
        <div className="flex items-center gap-2 text-indigo-600">
          <BrainCircuit size={28} strokeWidth={2.5} />
          <h1 className="text-xl font-bold tracking-tight">StudySnap AI</h1>
        </div>
      </nav>

      <main className="pt-20 pb-8 px-4 h-full min-h-screen flex flex-col items-center justify-center max-w-md mx-auto md:max-w-2xl">
        
        {/* VIEW: WELCOME */}
        {appState === AppState.WELCOME && (
          <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full w-48 h-48"></div>
              <img 
                src="https://picsum.photos/400/300?grayscale" 
                alt="Study" 
                className="relative rounded-2xl shadow-2xl w-full max-w-xs object-cover aspect-[4/3] border-4 border-white"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
                <Sparkles className="text-yellow-500 w-8 h-8" />
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <h2 className="text-3xl font-bold text-gray-900">Turn Notes into Quizzes</h2>
              <p className="text-gray-500">
                Snap a photo of your textbook or notes. AI will create a practice test instantly.
              </p>
            </div>

            <button 
              onClick={startFlow}
              className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              <Camera size={24} />
              <span>Snap a Photo</span>
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
          <div className="w-full bg-white rounded-3xl shadow-xl p-8 space-y-6">
            <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100 relative mb-4 border border-gray-200">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium">Image Captured</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Quiz Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Number of Questions: <span className="text-indigo-600 font-bold">{questionCount}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={questionCount} 
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setAppState(AppState.CAMERA)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Retake
              </button>
              <button 
                onClick={handleGenerate}
                className="flex-[2] py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Generate Quiz
              </button>
            </div>
          </div>
        )}

        {/* VIEW: GENERATING */}
        {appState === AppState.GENERATING && (
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="text-indigo-600 animate-pulse" size={32} />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">Analyzing your study material...</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                Gemini is reading the text and crafting {questionCount} challenging questions for you.
              </p>
            </div>
          </div>
        )}

        {/* VIEW: ERROR */}
        {appState === AppState.ERROR && (
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Oops!</h3>
            <p className="text-gray-600 mb-6">{errorMsg || "Something went wrong."}</p>
            <button 
              onClick={() => setAppState(AppState.CAMERA)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
            >
              Try Again
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
          <div className="w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 animate-scale-up">
            <div className="inline-block p-4 rounded-full bg-green-100 mb-2">
              <BookOpen className="w-12 h-12 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Quiz Complete!</h2>
              <p className="text-gray-500">Here is how you did</p>
            </div>

            <div className="py-6 border-y border-gray-100">
              <div className="text-6xl font-black text-indigo-600 mb-2">
                {Math.round((score / questions.length) * 100)}%
              </div>
              <p className="text-lg font-medium text-gray-600">
                You got <span className="text-gray-900">{score}</span> out of <span className="text-gray-900">{questions.length}</span> correct
              </p>
            </div>

            <button 
              onClick={resetApp}
              className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
            >
              Study Another Topic
            </button>
          </div>
        )}

      </main>
    </div>
  );
}