import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  avatarUrl: z.string().optional(),
  avatarStoragePath: z.string().optional(),
  createdAt: z.string(),
  role: z.enum(['admin', 'user']),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(), // <-- ДОБАВЛЕНО
  age: z.number().int().positive().optional(), // <-- ДОБАВЛЕНО
  settings: z.object({
    language: z.string(),
    notifications: z.boolean()
  })
});

export const healthAnalysisSchema = z.object({
  // --- Метаданные записи ---
  id: z.string(),
  userId: z.string(),
  imageUrl: z.string().url(),
  storagePath: z.string(),
  createdAt: z.string().datetime(),

  // --- Поля из анализа AI с численными оценками ---
  skinCondition: z.string(),
  skinConditionScore: z.number(),
  eyeCondition: z.string(),
  eyeConditionScore: z.number(),
  stressLevel: z.string(),
  stressLevelScore: z.number(),
  mood: z.string(),
  moodScore: z.number(),
  fatigue: z.string(),
  fatigueScore: z.number(),
  diagnosis: z.string(),
  recommendations: z.array(z.string()),
});

// Blog schemas
export const blogAuthorSchema = z.object({
  name: z.string().min(2),
  avatar: z.string().url().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  social: z.object({
    instagram: z.string().url().optional(),
    telegram: z.string().url().optional(),
    website: z.string().url().optional(),
  }).optional(),
});

export const blogCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const blogPostSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  excerpt: z.string().min(10),
  content: z.array(z.any()),
  authorId: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  readTime: z.number().int().positive(),
  categoryId: z.string(),
  tags: z.array(z.string()),
  image: z.string(),
  featured: z.boolean(),
  status: z.enum(['published', 'draft']),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});
