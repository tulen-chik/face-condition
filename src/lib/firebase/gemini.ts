import { HealthAnalysisRecord, HealthAnalysis } from "@/types/health";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { healthAnalysisSchema } from "./schemas"; // Предполагается, что у вас есть этот файл
import { equalTo, get, orderByChild, query, ref as databaseRef } from "firebase/database";
import { db } from "./init"; // Предполагается, что у вас есть этот файл
import { createOperation, deleteOperation } from "./crud"; // Предполагается, что у вас есть этот файл

// --- 1. Получаем переменные окружения для OpenRouter ---
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const YOUR_SITE_NAME = 'Health Face Analyzer'; // Можете изменить на название вашего проекта

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY не найден. Добавьте его в .env.local');
}

// --- 2. Вспомогательная функция для конвертации File в Base64 Data URL ---
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Загружает изображение для анализа здоровья в Firebase Storage.
 * (Эта функция остается без изменений)
 */
export const uploadHealthImage = async (userId: string, file: File) => {
  const storage = getStorage();
  const id = `${Date.now()}-${file.name}`;
  const path = `health-analyses/${userId}/${id}`;
  const sref = storageRef(storage, path);

  await uploadBytes(sref, file);
  const url = await getDownloadURL(sref);

  return { url, storagePath: path };
};

/**
 * Основная функция: анализирует изображение через OpenRouter, загружает его и сохраняет результат.
 */
export const analyzeAndStoreFaceHealth = async (userId: string, file: File): Promise<HealthAnalysisRecord> => {
  // Шаг 1: Загружаем изображение в Firebase Storage
  const { url, storagePath } = await uploadHealthImage(userId, file);

  // --- Шаг 2: ВЫЗОВ API OPENROUTER ---
  let analysisResult: HealthAnalysis;

  try {
    console.log('Отправка запроса к OpenRouter API...');

    const prompt = `
    Проанализируй лицо человека на этом изображении на предмет видимых индикаторов состояния здоровья.
    Основывайся ТОЛЬКО на визуальной информации.
    Твой ответ должен быть валидным JSON-объектом со следующей структурой и ключами:
    {
        "skinCondition": "string",
        "eyeCondition": "string",
        "stressLevel": "string",
        "mood": "string",
        "fatigue": "string",
        "diagnosis": "string",
        "recommendations": ["string"]
    }
    ВАЖНО: Пиши только по русски.
    Не добавляй в свой ответ ничего, кроме этого JSON-объекта(всегда придерживайся этой структуры). Никакого текста до или после, никаких markdown-блоков.
    `;

    const imageUrlBase64 = await fileToDataUrl(file);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": YOUR_SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.5-flash-image-preview", // Модель с поддержкой анализа изображений
        "messages": [
          {
            "role": "user",
            "content": [
              { "type": "text", "text": prompt },
              { "type": "image_url", "image_url": { "url": imageUrlBase64 } }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Ошибка от OpenRouter API:", errorData);
        throw new Error(`Ошибка API: ${response.statusText}`);
    }

    const result = await response.json();
    const responseText = result.choices[0].message.content;

    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    analysisResult = JSON.parse(cleanedJson);

    if (!analysisResult.skinCondition || !analysisResult.diagnosis || !analysisResult.recommendations) {
      throw new Error('Ответ API имеет неверную структуру.');
    }

  } catch (error) {
    console.error("Ошибка при обращении к OpenRouter API:", error);
    await deleteObject(storageRef(getStorage(), storagePath)).catch(e => console.error("Не удалось удалить изображение после ошибки API:", e));
    throw new Error("Не удалось проанализировать изображение с помощью AI.");
  }
  // --- КОНЕЦ ВЫЗОВА API ---

  // Шаг 3: Сохраняем результат в Realtime Database
  const analysisId = Date.now().toString();
  const recordToSave: Omit<HealthAnalysisRecord, 'id'> = {
    userId,
    ...analysisResult,
    imageUrl: url,
    storagePath,
    createdAt: new Date().toISOString(),
  };

  await createOperation(`healthAnalyses/${analysisId}`, recordToSave, healthAnalysisSchema.omit({ id: true }));

  return { id: analysisId, ...recordToSave };
};

/**
 * Удаляет запись об анализе из Realtime Database и связанное изображение из Storage.
 */
export const deleteHealthAnalysis = async (analysisId: string, storagePath: string): Promise<void> => {
  try {
    const storage = getStorage();
    const imageRef = storageRef(storage, storagePath);
    const deleteImagePromise = deleteObject(imageRef);
    const deleteDbRecordPromise = deleteOperation(`healthAnalyses/${analysisId}`);
    await Promise.all([deleteImagePromise, deleteDbRecordPromise]);
    console.log(`Анализ ${analysisId} и связанное изображение успешно удалены.`);
  } catch (error) {
    console.error("Ошибка при удалении анализа:", error);
    throw new Error("Не удалось удалить анализ и/или изображение.");
  }
};

/**
 * Получает все записи анализов для конкретного пользователя.
 */
export const getAnalysesForUser = async (userId: string): Promise<HealthAnalysisRecord[]> => {
    const analysesRef = query(databaseRef(db, 'healthAnalyses'), orderByChild('userId'), equalTo(userId));
    const snapshot = await get(analysesRef);

    if (!snapshot.exists()) {
        return [];
    }

    const records = snapshot.val() as Record<string, Omit<HealthAnalysisRecord, 'id'>>;
    return Object.entries(records).map(([id, data]) => ({ id, ...data }));
};

/**
 * Анализирует данные о здоровье за последнюю неделю через OpenRouter.
 */
export const getWeeklyHealthSummary = async (userId: string): Promise<string> => {
  const allAnalyses = await getAnalysesForUser(userId);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentAnalyses = allAnalyses
    .filter(a => new Date(a.createdAt) >= oneWeekAgo)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (recentAnalyses.length === 0) {
    return "За последнюю неделю нет данных для анализа. Добавьте хотя бы одну запись, чтобы получить сводку.";
  }

  const formattedData = recentAnalyses.map(a =>
    `Дата: ${new Date(a.createdAt).toLocaleDateString('ru-RU')}, Общее наблюдение: ${a.diagnosis}, Уровень усталости: ${a.fatigue}, Настроение: ${a.mood}`
  ).join('\n');

  const prompt = `
    Ты — внимательный ассистент по здоровью. Проанализируй следующие данные, полученные из визуального анализа фотографий пользователя за последнюю неделю.
    Не давай медицинских советов или диагнозов. Твоя задача — выявить общие тенденции и дать ободряющую, легко читаемую сводку.
    Данные для анализа:\n${formattedData}\n
    Основываясь на этих данных, напиши краткую сводку (2-4 предложения). Обрати внимание на возможные изменения в уровне усталости или настроении.
    Твой ответ должен быть в дружелюбном и поддерживающем тоне.
  `;

  try {
    console.log('Отправка запроса на недельный анализ через OpenRouter...');
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": YOUR_SITE_URL,
          "X-Title": YOUR_SITE_NAME,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-3.5-turbo", // Для текста можно использовать модель попроще
          "messages": [{ "role": "user", "content": prompt }]
        })
      });

      if (!response.ok) throw new Error(`Ошибка API: ${response.statusText}`);
      const result = await response.json();
      return result.choices[0].message.content;

  } catch (error) {
    console.error("Ошибка при генерации недельной сводки:", error);
    throw new Error("Не удалось получить аналитическую сводку от ИИ.");
  }
};

/**
 * Отправляет сообщение в чат с ИИ-ассистентом по здоровью через OpenRouter.
 */
export const chatWithHealthAI = async (message: string, history: any[]): Promise<string> => {
  const systemPrompt = `
    Ты — дружелюбный и эмпатичный ИИ-ассистент по здоровью.
    Твоя главная задача — отвечать на общие вопросы о здоровом образе жизни, питании, сне и стрессе.
    ВАЖНО: Ты НИКОГДА не должен ставить медицинские диагнозы, назначать лечение или давать прямые медицинские советы.
    Если пользователь спрашивает о симптомах болезни или лечении, твой ответ ВСЕГДА должен включать рекомендацию обратиться к врачу.
    Будь позитивным и поддерживающим.
  `;

  const messages = [
    { "role": "system", "content": systemPrompt },
    ...history,
    { "role": "user", "content": message }
  ];

  try {
    console.log('Отправка сообщения в чат через OpenRouter...');
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": YOUR_SITE_URL,
          "X-Title": YOUR_SITE_NAME,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-3.5-turbo",
          "messages": messages
        })
      });

      if (!response.ok) throw new Error(`Ошибка API: ${response.statusText}`);
      const result = await response.json();
      return result.choices[0].message.content;

  } catch (error) {
    console.error("Ошибка в чате с ИИ:", error);
    throw new Error("Не удалось получить ответ от ассистента.");
  }
};