import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { GEMINI_MODEL_NAME } from '../constants';

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable is not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const initializeChatWithSystemInstruction = (systemInstruction: string): Chat => {
  const client = getAiClient();
  try {
    return client.chats.create({
      model: GEMINI_MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
        // When expecting JSON feedback, we might want to set responseMimeType if Gemini supports it for chat.
        // For now, system instruction guides JSON output.
      },
    });
  } catch (error) {
    console.error("Error initializing Gemini chat:", error);
    throw new Error("Failed to initialize AI caller chat session. Please ensure your API key is valid and has access to the model.");
  }
};

export const sendMessageToAI = async (chat: Chat, messageText: string): Promise<string> => {
  try {
    // For feedback, Gemini is instructed to return JSON. The app will parse it.
    // If we were using generateContent directly for feedback, we'd set responseMimeType: "application/json"
    const result: GenerateContentResponse = await chat.sendMessage({ message: messageText });
    return result.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes("429") || error.message.toLowerCase().includes("quota")) {
            throw new Error("The AI is currently busy (Rate limit or Quota Exceeded). Please try again later.");
        }
        if (error.message.toLowerCase().includes("api key not valid")) {
            throw new Error("Your API key is not valid. Please check your API key and try again.");
        }
         if (error.message.toLowerCase().includes("candidate was blocked due to recitation")) {
            throw new Error("AI response was blocked due to content policy (recitation). Try rephrasing or a different scenario.");
        }
         if (error.message.toLowerCase().includes("candidate was blocked due to safety")) {
            throw new Error("AI response was blocked due to safety settings. Try rephrasing or a different scenario.");
        }
    }
    throw new Error("Failed to get a response from the AI. Please check your connection or API key.");
  }
};
