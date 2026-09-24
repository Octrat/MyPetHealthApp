// backend/src/services/geminiService.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// ВОЗВРАЩАЕМСЯ К ПРОВЕРЕННОЙ МОДЕЛИ
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

console.log('🔧 Gemini Service initialized');

/**
 * Ассистент с контекстом питомца
 */
export async function askGeminiWithContext(question, petContext, history = []) {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
      console.error('❌ API ключ не настроен');
      return '😞 Извините, API ключ не настроен. Пожалуйста, сообщите разработчику.';
    }

    const fullPrompt = `${petContext}

Ты — Доктор Хвост, опытный ветеринар. Ответь на вопрос пользователя.

Вопрос: ${question}

Дай максимально подробный ответ, не менее 10-15 предложений.
Включи в ответ анализ данных питомца, сравнение с нормой, конкретные рекомендации.
Будь дружелюбным, используй эмодзи.`;

    console.log('📝 Отправляем запрос в Gemini...');
    
    const response = await axios.post(GEMINI_URL, {
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.9,
      }
    }, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const answer = response.data.candidates[0].content.parts[0].text;
      console.log('✅ Получен ответ, длина:', answer.length);
      return answer;
    }
    
    console.error('❌ Пустой ответ');
    return '😞 Не удалось получить ответ. Попробуйте еще раз.';
    
  } catch (error) {
    console.error('❌ Ошибка Gemini with context:', error.message);
    return '😞 Извините, сейчас не могу ответить. Попробуйте позже.';
  }
}

export async function askGemini(question, history = []) {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
      return '😞 Извините, API ключ не настроен.';
    }

    const response = await axios.post(GEMINI_URL, {
      contents: [{ role: 'user', parts: [{ text: question }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.9,
      }
    }, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text;
    }
    return '😞 Не удалось получить ответ.';
    
  } catch (error) {
    console.error('❌ Ошибка Gemini:', error.message);
    return '😞 Извините, сейчас не могу ответить. Попробуйте позже.';
  }
}

export default { askGemini, askGeminiWithContext };