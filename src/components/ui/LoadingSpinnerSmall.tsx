import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // Предполагается, что у вас есть утилита для объединения классов

interface LoadingSpinnerSmallProps {
  size?: string; // Например, "w-8 h-8"
  className?: string;
}

/**
 * Компактный спиннер для использования внутри компонентов, например, кнопок.
 * Не имеет фона и контейнера, легко встраивается в верстку.
 * @param size - Размер иконки в классах Tailwind (по умолчанию 'w-6 h-6').
 * @param className - Дополнительные классы для стилизации.
 */
export const LoadingSpinnerSmall = ({ size = "w-6 h-6", className }: LoadingSpinnerSmallProps) => (
    <Loader2 className={cn("animate-spin text-white", size, className)} />
  );