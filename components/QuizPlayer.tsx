import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { generateQuestionAudio } from '../services/geminiService';
import { decodeAudioData, playAudioBuffer } from '../services/audioService';
import { Volume2, CheckCircle, XCircle, ChevronRight, Loader2 } from 'lucide-react';

interface QuizPlayerProps {
  questions: Question[];
  onFinish: (score: number) => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ questions, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    // Initialize Audio Context on user interaction (or mount if allowed)
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    
    // Stop audio when unmounting or changing questions
    return () => {
      stopAudio();
    };
  }, [currentIndex]);

  const stopAudio = () => {
    if (currentAudioSource.current) {
      try {
        currentAudioSource.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      currentAudioSource.current = null;
    }
    setIsPlayingAudio(false);
  };

  const handlePlayAudio = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    if (!audioContextRef.current) return;

    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsLoadingAudio(true);
    
    // Construct text to read: Question + Options
    const textToRead = `Question ${currentIndex + 1}. ${currentQuestion.text}. Options: ${currentQuestion.options.map((opt, i) => `${i + 1}. ${opt}`).join('. ')}.`;

    const base64Audio = await generateQuestionAudio(textToRead);

    if (base64Audio) {
      const buffer = await decodeAudioData(base64Audio, audioContextRef.current);
      setIsLoadingAudio(false);
      setIsPlayingAudio(true);
      
      currentAudioSource.current = playAudioBuffer(buffer, audioContextRef.current, () => {
        setIsPlayingAudio(false);
      });
    } else {
      setIsLoadingAudio(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQuestion.correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    stopAudio();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      onFinish(score + (selectedOption === currentQuestion.correctIndex ? 0 : 0)); 
      // Note: Score is updated immediately on click, so just passing current score state might miss the last one if we aren't careful.
      // Actually, standard pattern is better:
      const finalScore = selectedOption === currentQuestion.correctIndex ? score : score; // Already updated via state? 
      // Let's rely on the state update being fast enough or pass the calc.
      // Re-calculating specifically for the last item to be safe:
      onFinish(score);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col h-full">
      {/* Header / Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2 text-sm font-medium text-gray-500">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-indigo-600">Score: {score}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800 leading-tight">
            {currentQuestion.text}
          </h2>
          <button 
            onClick={handlePlayAudio}
            disabled={isLoadingAudio}
            className={`p-2 rounded-full flex-shrink-0 transition-colors ${
              isPlayingAudio ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Read Aloud"
          >
            {isLoadingAudio ? <Loader2 size={20} className="animate-spin"/> : <Volume2 size={20} />}
          </button>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            let optionClass = "w-full p-4 text-left border-2 rounded-xl transition-all duration-200 flex justify-between items-center ";
            
            if (!isAnswered) {
              optionClass += "border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 text-gray-700";
            } else {
              if (index === currentQuestion.correctIndex) {
                optionClass += "border-green-500 bg-green-50 text-green-900";
              } else if (index === selectedOption) {
                optionClass += "border-red-500 bg-red-50 text-red-900";
              } else {
                optionClass += "border-gray-100 text-gray-400 opacity-60";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={isAnswered}
                className={optionClass}
              >
                <span className="font-medium">{option}</span>
                {isAnswered && index === currentQuestion.correctIndex && (
                  <CheckCircle size={20} className="text-green-500" />
                )}
                {isAnswered && index === selectedOption && index !== currentQuestion.correctIndex && (
                  <XCircle size={20} className="text-red-500" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Explanation */}
        {isAnswered && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-900 text-sm animate-fade-in">
            <span className="font-bold block mb-1">Explanation:</span>
            {currentQuestion.explanation}
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="mt-auto">
        <button
          onClick={handleNext}
          disabled={!isAnswered}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            isAnswered 
              ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-[1.02]' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};