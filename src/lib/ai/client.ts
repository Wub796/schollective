import { GoogleGenAI } from "@google/genai";

/**
 * Initializes Google Gemini Client if API key exists.
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}
