import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question } from "../types";

// Ensure API key is present
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateQuizFromImage = async (
  base64Image: string,
  questionCount: number
): Promise<Question[]> => {
  
  // Clean base64 string if it contains metadata header
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        },
        {
          text: `Analyze this study material. Generate exactly ${questionCount} multiple-choice questions based on the content. The questions should test understanding of the key concepts shown. Return the output strictly as a JSON array.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            text: { type: Type.STRING, description: "The question text" },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Array of 4 possible answers"
            },
            correctIndex: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" },
            explanation: { type: Type.STRING, description: "Short explanation why the answer is correct" }
          },
          required: ["id", "text", "options", "correctIndex", "explanation"]
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate quiz content");
  }

  try {
    const data = JSON.parse(response.text);
    return data as Question[];
  } catch (e) {
    console.error("JSON Parse error:", e);
    throw new Error("Invalid response format from AI");
  }
};

export const generateQuestionAudio = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, authoritative voice for study
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Generation error:", error);
    return null;
  }
};