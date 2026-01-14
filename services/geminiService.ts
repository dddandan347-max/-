import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends a chat message to Gemini and returns the response.
 */
export const sendChatMessage = async (message: string, history: {role: string, parts: {text: string}[]}[] = []): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        systemInstruction: "你是一个专业的视频制作网站助手。请用中文回答用户关于视频模版、剪辑技巧以及网站功能的问题。语气要专业、热情且乐于助人。",
      }
    });

    const result: GenerateContentResponse = await chat.sendMessage({
      message: message
    });

    return result.text || "抱歉，我暂时无法生成回复。";
  } catch (error) {
    console.error("Error in chat:", error);
    throw error;
  }
};

/**
 * Analyzes an image using Gemini.
 */
export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.split(',')[1] || base64Image;
    const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    return response.text || "无法分析该图片。";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};