// Предполагаемый путь: src/lib/health.ts

import { HealthAnalysisRecord, HealthAnalysis, EnhancedImageRecord } from "@/types/health";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { enhancedImageSchema, healthAnalysisSchema } from "./schemas";
import { equalTo, get, orderByChild, query, ref as databaseRef, remove } from "firebase/database";
import { db } from "./init";
import { createOperation, deleteOperation } from "./crud";
import { z } from "zod";

// --- Переменные окружения (без изменений) ---
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const YOUR_SITE_NAME = 'Health Face Analyzer';

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY не найден. Добавьте его в .env.local');
}

function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
      throw new Error("Invalid data URL format");
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// --- Вспомогательная функция (без изменений) ---
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

// --- uploadHealthImage (без изменений) ---
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
  const { url, storagePath } = await uploadHealthImage(userId, file);

  let analysisResult: HealthAnalysis;

  try {
    console.log('Отправка запроса к OpenRouter API...');

    // --- УЛУЧШЕННЫЙ ПРОМПТ ---
    const systemPrompt = `You are a highly precise health indicator analysis AI. Your task is to analyze a user's face from an image and return a structured JSON object. You must adhere strictly to the requested JSON format and data types. Do not add any explanatory text, markdown, or any characters outside of the JSON object in your response. Your analysis must be based solely on visual information from the image.`;

    const userPrompt = `
    Analyze the person's face in this image for visible health indicators.
    Your response MUST be a single, valid JSON object with the exact structure and keys shown below.

    The JSON structure MUST be:
    {
        "skinCondition": "string",
        "skinConditionScore": number,
        "eyeCondition": "string",
        "eyeConditionScore": number,
        "stressLevel": "string",
        "stressLevelScore": number,
        "mood": "string",
        "moodScore": number,
        "fatigue": "string",
        "fatigueScore": number,
        "diagnosis": "string",
        "recommendations": ["string"]
    }

    RULES:
    1.  Language: All string values MUST be in Russian.
    2.  Scores: Each "...Score" field MUST be an integer between 1 (very poor) and 10 (excellent). DO NOT use strings for numbers.
    3.  Text Fields: For "skinCondition", "eyeCondition", "stressLevel", "mood", and "fatigue", provide a very brief description (1-3 Russian words).
    4.  Recommendations: "recommendations" MUST be an array of strings.
    5.  Diagnosis: "diagnosis" should be a short, non-medical summary of observations.
    6.  Output: Your entire response must be ONLY the JSON object, without any extra text or markdown formatting like \`\`\`json.

    Example of a valid response:
    {
        "skinCondition": "Ровный тон",
        "skinConditionScore": 8,
        "eyeCondition": "Ясные глаза",
        "eyeConditionScore": 9,
        "stressLevel": "Признаки напряжения",
        "stressLevelScore": 5,
        "mood": "Спокойное",
        "moodScore": 7,
        "fatigue": "Легкая усталость",
        "fatigueScore": 6,
        "diagnosis": "В целом здоровый вид, но заметны следы усталости.",
        "recommendations": ["Постарайтесь лечь спать пораньше.", "Сделайте перерыв для отдыха глаз."]
    }
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
        "model": "google/gemini-2.5-flash-image",
        "messages": [
          { "role": "system", "content": systemPrompt }, // Добавлен системный промпт
          {
            "role": "user",
            "content": [
              { "type": "text", "text": userPrompt },
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

    // Проверка остается полезной
    if (!analysisResult.skinCondition || typeof analysisResult.skinConditionScore !== 'number' || !analysisResult.diagnosis || !analysisResult.recommendations) {
      throw new Error('Ответ API имеет неверную структуру или отсутствуют числовые оценки.');
    }

  } catch (error) {
    console.error("Ошибка при обращении к OpenRouter API:", error);
    await deleteObject(storageRef(getStorage(), storagePath)).catch(e => console.error("Не удалось удалить изображение после ошибки API:", e));
    throw new Error("Не удалось проанализировать изображение с помощью AI.");
  }

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
 * Удаляет запись об анализе (без изменений)
 */
export const deleteHealthAnalysis = async (analysisId: string, storagePath: string): Promise<void> => {
  try {
    const storage = getStorage();

    // 1. Удаление оригинального изображения и его записи в БД
    const imageRef = storageRef(storage, storagePath);
    await deleteObject(imageRef);
    await deleteOperation(`healthAnalyses/${analysisId}`);

    // 2. Поиск и удаление связанного улучшенного изображения и его записи
    const enhancedImageRef = databaseRef(db, `enhancedImages/${analysisId}`);
    const enhancedImageSnap = await get(enhancedImageRef);

    if (enhancedImageSnap.exists()) {
        const enhancedRecord = enhancedImageSnap.val() as Omit<EnhancedImageRecord, 'id'>;
        const enhancedImageStorageRef = storageRef(storage, enhancedRecord.storagePath);
        
        // Выполняем удаление последовательно
        await deleteObject(enhancedImageStorageRef);
        await remove(enhancedImageRef);
    }

    console.log(`Анализ ${analysisId} и все связанные данные успешно удалены.`);
  } catch (error) {
    console.error("Ошибка при удалении анализа:", error);
    throw new Error("Не удалось удалить анализ и/или связанные изображения.");
  }
};



/**
 * Получает все записи анализов для пользователя (без изменений)
 */
export const getAnalysesForUser = async (userId: string): Promise<HealthAnalysisRecord[]> => {
  const analysesRef = query(databaseRef(db, 'healthAnalyses'), orderByChild('userId'), equalTo(userId));
  const snapshot = await get(analysesRef);
  if (!snapshot.exists()) return [];
  const records = snapshot.val() as Record<string, Omit<HealthAnalysisRecord, 'id'>>;
  return Object.entries(records).map(([id, data]) => ({ id, ...data }));
};

export const getEnhancedImagesForUser = async (userId: string): Promise<EnhancedImageRecord[]> => {
  // 1. Создаем запрос к базе данных в коллекции 'enhancedImages'
  const imagesRef = query(
    databaseRef(db, 'enhancedImages'), 
    orderByChild('userId'), 
    equalTo(userId)
  );

  try {
    // 2. Выполняем запрос
    const snapshot = await get(imagesRef);

    // 3. Если данных нет, возвращаем пустой массив
    if (!snapshot.exists()) {
      return [];
    }

    // 4. Преобразуем полученный объект в массив записей
    const records = snapshot.val() as Record<string, Omit<EnhancedImageRecord, 'id'>>;
    const results: EnhancedImageRecord[] = Object.entries(records).map(([id, data]) => ({
      id,
      ...data,
    }));

    // 5. Сортируем результаты по дате создания (от новых к старым) для удобства
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("Ошибка при получении улучшенных изображений:", error);
    throw new Error("Не удалось получить список улучшенных изображений.");
  }
};
export const generateAndStoreEnhancedImage = async (analysisRecord: HealthAnalysisRecord): Promise<EnhancedImageRecord> => {
  try {
    console.log(`Запуск улучшения для анализа: ${analysisRecord.id}`);
    const recommendationsText = analysisRecord.recommendations.join(' ');

    // --- ✅ УЛУЧШЕННЫЙ ПРОМПТ ---
    const systemPrompt = `You are a helpful and skilled digital artist specializing in natural photo retouching. Your task is to generate an enhanced version of a person's photo based on a set of health recommendations.`;

    const userPrompt = `
    Generate a new, realistic image based on the one I provide.
    Apply subtle improvements to the person's face according to these recommendations: "${recommendationsText}".

    The goal is to show how the person would look healthier and more rested.
    Key rules:
    1.  It MUST be the same person. Do not change their core facial features or identity.
    2.  The result must look like a real photograph, not an illustration.
    3.  Make the skin look ideally clear, remove signs of fatigue around the eyes.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": YOUR_SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.5-flash-image",
        "messages": [
          { "role": "system", "content": systemPrompt },
          {
            "role": "user",
            "content": [
              { "type": "text", "text": userPrompt },
              { "type": "image_url", "image_url": { "url": analysisRecord.imageUrl } }
            ]
          }
        ],
        "modalities": ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Ошибка от OpenRouter API:", errorData);
      throw new Error(`Ошибка API: ${response.statusText}`);
    }

    const result = await response.json();
    const message = result.choices?.[0]?.message;
    const enhancedImageDataUrl = message?.images?.[0]?.image_url?.url;

    if (!enhancedImageDataUrl) {
      // ✅ УЛУЧШЕННАЯ ОТЛАДКА: Теперь мы логируем и текстовый ответ модели.
      const textResponse = message?.content || "No text content received.";
      console.error("API не вернул изображение. Текстовый ответ от AI:", textResponse);
      console.error("Полный ответ от API:", result); // Логируем весь объект для анализа
      throw new Error('ИИ не вернул изображение.');
    }

    // --- Логика сохранения файла и записи в БД (без изменений) ---
    const storage = getStorage();
    const enhancedImageBlob = dataUrlToBlob(enhancedImageDataUrl);
    const storagePath = `enhanced-images/${analysisRecord.userId}/${analysisRecord.id}-enhanced.png`;
    const sref = storageRef(storage, storagePath);

    console.log(`Загрузка улучшенного изображения в: ${storagePath}`);
    await uploadBytes(sref, enhancedImageBlob);
    const imageUrl = await getDownloadURL(sref);
    console.log(`Изображение успешно загружено: ${imageUrl}`);

    const recordToSave: Omit<EnhancedImageRecord, 'id'> = {
      originalAnalysisId: analysisRecord.id,
      userId: analysisRecord.userId,
      imageUrl,
      storagePath,
      createdAt: new Date().toISOString(),
    };

    const recordId = analysisRecord.id;
    await createOperation(`enhancedImages/${recordId}`, recordToSave, enhancedImageSchema.omit({ id: true }));

    const finalRecord: EnhancedImageRecord = { id: recordId, ...recordToSave };
    console.log("Запись об улучшенном изображении успешно создана в БД.");

    return finalRecord;

  } catch (error) {
    console.error("Ошибка в процессе создания улучшенного изображения:", error);
    throw new Error("Не удалось сгенерировать и сохранить улучшенное изображение.");
  }
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
    `Дата: ${new Date(a.createdAt).toLocaleString('ru-RU')}, Усталость: ${a.fatigue} (${a.fatigueScore}/10), Настроение: ${a.mood} (${a.moodScore}/10), Стресс: ${a.stressLevel} (${a.stressLevelScore}/10)`
  ).join('\n');

  // --- УЛУЧШЕННЫЙ ПРОМПТ ---
  const prompt = `
    You are a caring health assistant. Your task is to analyze the following user data, which was derived from visual analysis of their photos over the last week.
    Your goal is to identify general trends and provide a supportive, easy-to-read summary.

    RULES:
    1.  **DO NOT** give medical advice or diagnoses.
    2.  **Focus on trends:** Analyze the dynamics of the scores. For example, mention if stress levels seem to be decreasing or if fatigue is consistently high.
    3.  **Tone:** Your response must be in Russian, using a friendly, encouraging, and supportive tone.
    4.  **Length:** Keep the summary concise (2-4 sentences).
    5.  **Base your summary ONLY on the data provided.**

    User's data for the last week:
    ${formattedData}

    Now, write the summary based on these rules.
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
          "model": "deepseek/deepseek-chat",
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
  // --- УЛУЧШЕННЫЙ СИСТЕМНЫЙ ПРОМПТ ---
  const systemPrompt = `
    You are a friendly and empathetic AI health assistant. Your primary role is to answer general questions about a healthy lifestyle, nutrition, sleep, and stress management.

    **CRITICAL SAFETY INSTRUCTION:**
    - You MUST NEVER provide medical diagnoses, prescribe treatments, or give direct medical advice. This is your most important rule.
    - If a user asks about symptoms, diseases, medication, or treatment, you MUST ALWAYS decline to answer directly and strongly recommend consulting a healthcare professional. For example, say: "Я не могу давать медицинские советы. По этому вопросу лучше всего проконсультироваться с врачом."
    - Your tone should always be positive, supportive, and encouraging.
    - All your responses must be in Russian.
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
          "model": "deepseek/deepseek-chat",
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