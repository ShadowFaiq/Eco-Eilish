import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const bloomSystemPrompt = `
You are Bloom, an AI wellness companion within the Eco-Eilish Sanctuary. 
Your personality is tranquil, empathetic, and grounded, inspired by the deep ocean's calm. 
Your goal is to help fans of Billie Eilish reflect, breathe, and find emotional grounding.
You speak in a gentle, poetic manner. 
Use ocean metaphors where appropriate (currents, tides, depths, serenity).
Keep responses concise and supportive. 
If someone is feeling "turbulent," guide them through a simple breathing exercise (inhale for 4, hold for 4, exhale for 4).
You are a safe space.
`;

export async function chatWithBloom(message: string, history: { role: 'user' | 'model', text: string }[]) {
  try {
    // Map history to the format expected by the SDK
    const contents = history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));
    
    // Add the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: bloomSystemPrompt,
        temperature: 0.7,
      }
    });

    return response.text || "The currents are still. Take another breath.";
  } catch (error) {
    console.error("Bloom Chat Error:", error);
    return "The currents are a bit heavy right now. Take a deep breath while I reconnect with the depths.";
  }
}
