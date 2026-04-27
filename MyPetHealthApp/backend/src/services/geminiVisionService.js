// backend/src/services/geminiVisionService.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// ⭐ ИСПОЛЬЗУЕМ ТУ ЖЕ МОДЕЛЬ, ЧТО И В ЧАТЕ - gemini-2.5-flash
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

console.log('🔧 Gemini Vision Service initialized');
console.log('🔧 Using model: gemini-2.5-flash (same as chat)');

// Кэш для результатов (как в чате не используется, но добавим для оптимизации)
const recognitionCache = new Map();
const CACHE_TTL = 3600000; // 1 час

function getImageHash(imageBase64) {
  let hash = 0;
  const str = imageBase64.substring(0, 500);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

/**
 * Распознавание породы через Gemini (используя ту же модель что и чат)
 */
export async function recognizeBreedWithGemini(imageBase64, species = 'dog') {
  try {
    // Проверка API ключа
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
      console.error('❌ API ключ не настроен');
      return createErrorResponse('API ключ не настроен');
    }

    // Проверка кэша
    const cacheKey = `${species}_${getImageHash(imageBase64)}`;
    if (recognitionCache.has(cacheKey)) {
      const cached = recognitionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('📦 Используем кэш');
        return { ...cached.result, fromCache: true };
      }
    }

    // Очищаем base64 от префикса если есть
    let cleanBase64 = imageBase64;
    if (imageBase64.includes(',')) {
      cleanBase64 = imageBase64.split(',')[1];
    }
    
    if (!cleanBase64 || cleanBase64.length < 100) {
      console.error('❌ Некорректное изображение');
      return createErrorResponse('Некорректное изображение');
    }
    
    const speciesText = species === 'dog' ? 'собаки' : 'кошки';
    
    // Промпт как в чате, но с JSON выводом
    const prompt = `Ты — эксперт по определению пород ${speciesText}. Определи породу на этом фото.

Верни ТОЛЬКО JSON в этом формате (без markdown, без лишних слов):
{
  "primary_breed": "название породы на русском",
  "confidence": 0.85,
  "description": "1-2 предложения о породе на русском",
  "traits": {
    "size": "Small|Medium|Large",
    "coat_type": "short|medium|long|curly|wirehaired",
    "energy_level": "low|medium|high",
    "shedding": "low|medium|high"
  },
  "care_tips": ["совет по уходу 1", "совет по уходу 2"],
  "health_notes": ["заметка о здоровье 1"],
  "alternative_breeds": ["похожая порода 1"]
}

Если не уверен, поставь confidence ниже 0.6.`;

    // Формируем запрос как в чате, но с изображением
    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: cleanBase64
            }
          }
        ]
      }
    ];
    
    console.log('📤 Отправка запроса к Gemini Vision...');
    
    const response = await axios.post(GEMINI_URL, {
      contents: contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.3,
      }
    }, {
      timeout: 60000,  // Такой же таймаут как в чате
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Пустой ответ от Gemini');
    }

    let text = response.data.candidates[0].content.parts[0].text;
    console.log('📝 Получен ответ, длина:', text.length);
    
    // Очищаем от markdown
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Ошибка парсинга JSON:', parseError.message);
      console.log('Текст:', text.substring(0, 200));
      // Пробуем извлечь JSON из текста если есть
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e) {
          return createErrorResponse('Ошибка формата ответа');
        }
      } else {
        return createErrorResponse('Ошибка формата ответа');
      }
    }
    
    const finalResult = {
      success: true,
      fallback: false,
      breed: {
        name: result.primary_breed || (species === 'dog' ? 'Собака' : 'Кошка'),
        confidence: Math.min(0.99, Math.max(0.1, result.confidence || 0.5))
      },
      description: result.description || `Порода: ${result.primary_breed || 'не определена'}`,
      traits: result.traits || {
        size: 'Medium',
        coat_type: 'short',
        energy_level: 'medium',
        shedding: 'medium'
      },
      care_tips: result.care_tips || ['Регулярные визиты к ветеринару'],
      health_notes: result.health_notes || ['Следите за здоровьем питомца'],
      alternative_breeds: result.alternative_breeds || []
    };
    
    // Сохраняем в кэш
    recognitionCache.set(cacheKey, {
      result: finalResult,
      timestamp: Date.now()
    });
    
    console.log('✅ Распознано:', finalResult.breed.name, `(уверенность: ${finalResult.breed.confidence})`);
    return finalResult;
    
  } catch (error) {
    console.error('❌ Gemini ошибка:', error.message);
    
    if (error.response?.status === 429) {
      console.log('Лимит запросов, используем fallback');
    } else if (error.code === 'ECONNABORTED') {
      console.log('Таймаут запроса');
    }
    
    // Возвращаем fallback ответ (но с success: true чтобы фронт не упал)
    return {
      success: true,
      fallback: true,
      breed: {
        name: species === 'dog' ? 'Порода не определена' : 'Порода не определена',
        confidence: 0.3
      },
      description: `Это ${species === 'dog' ? 'собака' : 'кошка'}. Для точного определения породы попробуйте сделать фото при хорошем освещении.`,
      traits: {
        size: 'Medium',
        coat_type: 'short',
        energy_level: 'medium',
        shedding: 'medium'
      },
      care_tips: ['Регулярные визиты к ветеринару', 'Сбалансированное питание'],
      health_notes: ['Следите за весом питомца'],
      alternative_breeds: []
    };
  }
}

/**
 * Быстрое распознавание (только порода)
 */
export async function quickBreedRecognize(imageBase64, species = 'dog') {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
      return { success: false, breed: 'API не настроен', confidence: 0, is_mixed: false };
    }

    let cleanBase64 = imageBase64;
    if (imageBase64.includes(',')) {
      cleanBase64 = imageBase64.split(',')[1];
    }
    
    const speciesText = species === 'dog' ? 'собаки' : 'кошки';
    const prompt = `Определи породу ${speciesText} на этом фото. Верни ТОЛЬКО JSON: {"breed": "название породы на русском", "confidence": 0.9, "is_mixed": false}`;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: cleanBase64
            }
          }
        ]
      }
    ];

    const response = await axios.post(GEMINI_URL, {
      contents: contents,
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.2,
      }
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    let text = response.data.candidates[0].content.parts[0].text;
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(text);
    
    return {
      success: true,
      breed: result.breed || 'Неизвестно',
      confidence: result.confidence || 0.5,
      is_mixed: result.is_mixed || false
    };
    
  } catch (error) {
    console.error('Quick recognize error:', error.message);
    return {
      success: false,
      breed: 'Ошибка определения',
      confidence: 0,
      is_mixed: false
    };
  }
}

/**
 * Создает ответ с ошибкой
 */
function createErrorResponse(errorMessage) {
  return {
    success: false,
    error: errorMessage,
    breed: {
      name: 'Не удалось определить',
      confidence: 0.1
    },
    description: 'Попробуйте сделать более четкое фото или введите породу вручную',
    traits: {
      size: 'Unknown',
      coat_type: 'unknown',
      energy_level: 'unknown',
      shedding: 'unknown'
    },
    care_tips: [],
    health_notes: [],
    alternative_breeds: []
  };
}