// backend/src/services/geminiService.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Ты — Доктор Хвост, дружелюбный и заботливый ветеринарный помощник.

Твоя задача — помогать владельцам кошек и собак с вопросами о здоровье, уходе, питании, воспитании.
Отвечай максимально по делу. Дай конкретные советы.
Всегда предупреждай: "При серьезных симптомах обратитесь к ветеринару".`;

export async function askGemini(question, history = []) {
  try {
    const contents = [];
    
    for (const msg of history) {
      contents.push({
        role: msg.isUser ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
    
    contents.push({
      role: 'user',
      parts: [{ text: question }]
    });
    
    const response = await axios.post(GEMINI_URL, {
      contents: contents,
      generationConfig: {
        maxOutputTokens: 2048,  // Максимально возможный лимит
        temperature: 0.5,
      }
    }, {
      timeout: 60000,  // Увеличил таймаут до 60 секунд
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      let answer = response.data.candidates[0].content.parts[0].text;
      
      // Если ответ всё ещё обрезан, добавляем примечание
      if (response.data.candidates[0].finishReason === 'MAX_TOKENS') {
        answer += '\n\n📝 *Продолжение в следующем сообщении*';
      }
      
      return answer;
    } else {
      return '😞 Не удалось получить ответ. Попробуйте еще раз.';
    }
  } catch (error) {
    console.error('Ошибка Gemini:', error.message);
    
    if (error.response?.status === 429) {
      return '😅 Доктор Хвост очень популярен! Лимит вопросов временно исчерпан. Попробуйте через несколько минут. 🐾';
    }
    
    return '😞 Извините, сейчас не могу ответить. Попробуйте позже.';
  }
}