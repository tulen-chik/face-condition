import { Loader2 } from "lucide-react";

/**
 * Полноэкранный спиннер загрузки для всей страницы.
 * Используется во время первоначальной загрузки данных.
 */
export const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="text-center text-gray-400">
        <Loader2 className="w-12 h-12 mx-auto animate-spin text-white" />
        <p className="mt-4 text-lg">Загрузка...</p>
      </div>
    </div>
  );