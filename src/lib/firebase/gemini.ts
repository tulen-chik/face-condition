import { HealthAnalysisRecord, HealthAnalysis } from "@/types/health";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { healthAnalysisSchema } from "./schemas";
import { equalTo, get, orderByChild, query, ref as databaseRef } from "firebase/database";
import { db } from "./init";
import { createOperation, deleteOperation } from "./crud";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY не найден. Добавьте его в .env.local');
}

// 2. Инициализируем модель Gemini
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }); // Рекомендуется использовать более новые модели, если доступны

// 3. Вспомогательная функция для конвертации File в формат для Gemini API
async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

    const data = await base64EncodedDataPromise;
    return {
      inlineData: { data, mimeType: file.type },
    };
  }

/**
 * Загружает изображение для анализа здоровья в Firebase Storage.
 * @param userId - ID пользователя для организации хранения.
 * @param file - Файл изображения.
 * @returns Объект с URL и путем к файлу в Storage.
 */
export const uploadHealthImage = async (userId: string, file: File) => {
const storage = getStorage();
const id = `${Date.now()}-${file.name}`;
const path = `health-analyses/${userId}/${id}`; // Организуем файлы по пользователям
const sref = storageRef(storage, path);

await uploadBytes(sref, file);
const url = await getDownloadURL(sref);

return { url, storagePath: path };
};

/**
 * Основная функция: анализирует изображение, загружает его и сохраняет результат.
 * @param userId - ID пользователя.
 * @param file - Файл изображения для анализа.
 * @returns Сохраненная запись анализа.
 */
export const analyzeAndStoreFaceHealth = async (userId: string, file: File): Promise<HealthAnalysisRecord> => {
// Шаг 1: Загружаем изображение в Firebase Storage
const { url, storagePath } = await uploadHealthImage(userId, file);

// --- Шаг 2: РЕАЛЬНЫЙ ВЫЗОВ GEMINI API ---
let analysisResult: HealthAnalysis;

try {
    console.log('Отправка запроса к Google AI API...');

    // Обновленный промпт, который просит модель вернуть СТРОГО JSON с новой структурой
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

    // Конвертируем файл для API
    const imagePart = await fileToGenerativePart(file);

    // Отправляем промпт и изображение
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const responseText = response.text();

    // Парсим JSON из ответа модели
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    analysisResult = JSON.parse(cleanedJson);
    console.log(analysisResult)
    // Валидация, что объект содержит нужные новые поля
    if (!analysisResult.skinCondition || !analysisResult.diagnosis || !analysisResult.recommendations) {
        throw new Error('Ответ API имеет неверную структуру.');
    }

} catch (error) {
    console.error("Ошибка при обращении к Gemini API:", error);
    // Если API не сработало, удаляем уже загруженное изображение
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
 * @param analysisId - ID записи анализа в базе данных.
 * @param storagePath - Путь к файлу в Firebase Storage.
 */
export const deleteHealthAnalysis = async (analysisId: string, storagePath: string): Promise<void> => {
try {
    // Удаляем изображение из Storage
    const storage = getStorage();
    const imageRef = storageRef(storage, storagePath);
    const deleteImagePromise = deleteObject(imageRef);

    // Удаляем запись из Realtime Database
    const deleteDbRecordPromise = deleteOperation(`healthAnalyses/${analysisId}`);

    // Выполняем обе операции параллельно
    await Promise.all([deleteImagePromise, deleteDbRecordPromise]);
    console.log(`Анализ ${analysisId} и связанное изображение успешно удалены.`);
} catch (error) {
    console.error("Ошибка при удалении анализа:", error);
    throw new Error("Не удалось удалить анализ и/или изображение.");
}
};

/**
 * Получает все записи анализов для конкретного пользователя.
 * @param userId - ID пользователя.
 * @returns Массив записей анализов.
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
 * Анализирует данные о здоровье за последнюю неделю и возвращает сводку от ИИ.
 * @param userId - ID пользователя.
 * @returns Строка с аналитической сводкой от Gemini.
 */
export const getWeeklyHealthSummary = async (userId: string): Promise<string> => {
// Шаг 1: Получаем все анализы пользователя
const allAnalyses = await getAnalysesForUser(userId);

// Шаг 2: Фильтруем записи за последние 7 дней
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

const recentAnalyses = allAnalyses
    .filter(a => new Date(a.createdAt) >= oneWeekAgo)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

// Если данных нет, возвращаем сообщение
if (recentAnalyses.length === 0) {
    return "За последнюю неделю нет данных для анализа. Добавьте хотя бы одну запись, чтобы получить сводку.";
}

// Шаг 3: Форматируем данные для промпта, используя новые поля
const formattedData = recentAnalyses.map(a =>
    `Дата: ${new Date(a.createdAt).toLocaleDateString('ru-RU')}, Общее наблюдение: ${a.diagnosis}, Уровень усталости: ${a.fatigue}, Настроение: ${a.mood}`
).join('\n');

// Шаг 4: Создаем промпт для анализа
const prompt = `
    Ты — внимательный ассистент по здоровью. Проанализируй следующие данные, полученные из визуального анализа фотографий пользователя за последнюю неделю.
    Не давай медицинских советов или диагнозов. Твоя задача — выявить общие тенденции и дать ободряющую, легко читаемую сводку.

    Данные для анализа:
    ${formattedData}

    Основываясь на этих данных, напиши краткую сводку (2-4 предложения). Обрати внимание на возможные изменения в уровне усталости или настроении.
    Например: "За последнюю неделю я заметил, что ваш уровень усталости немного колебался. Кажется, в последние пару дней вы выглядите более отдохнувшим. Так держать!"
    Твой ответ должен быть в дружелюбном и поддерживающем тоне.
`;

try {
    console.log('Отправка запроса на недельный анализ...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
} catch (error) {
    console.error("Ошибка при генерации недельной сводки:", error);
    throw new Error("Не удалось получить аналитическую сводку от ИИ.");
}
};


/**
 * Отправляет сообщение в чат с ИИ-ассистентом по здоровью.
 * @param message - Сообщение пользователя.
 * @param history - История предыдущих сообщений для поддержания контекста.
 * @returns Ответ от ИИ.
 */
export const chatWithHealthAI = async (message: string, history: any[]): Promise<string> => {
const systemInstruction = {
    role: "system",
    parts: [{ text: `
    Ты — дружелюбный и эмпатичный ИИ-ассистент по здоровью.
    Твоя главная задача — отвечать на общие вопросы о здоровом образе жизни, питании, сне и стрессе.
    ВАЖНО: Ты НИКОГДА не должен ставить медицинские диагнозы, назначать лечение или давать прямые медицинские советы.
    Если пользователь спрашивает о симптомах болезни или лечении, твой ответ ВСЕГДА должен включать рекомендацию обратиться к врачу.
    Будь позитивным и поддерживающим.
    `}],
};

const chat = model.startChat({
    systemInstruction: systemInstruction,
    history: history,
    generationConfig: {
      maxOutputTokens: 500,
    },
  });

try {
    console.log('Отправка сообщения в чат...');
    const result = await chat.sendMessage(message);
    const response = result.response;
    return response.text();
} catch (error) {
    console.error("Ошибка в чате с ИИ:", error);
    throw new Error("Не удалось получить ответ от ассистента.");
}
};