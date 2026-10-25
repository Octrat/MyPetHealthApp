// src/hooks/useCachedImage.ts - упрощенная версия
import { useState, useEffect } from 'react';
import { Image } from 'react-native';

export const useCachedImage = (remoteUrl: string | null | undefined) => {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (!remoteUrl) {
        setCachedUri(null);
        setIsLoading(false);
        return;
      }

      try {
        // Предзагружаем изображение в кэш React Native
        await Image.prefetch(remoteUrl);
        setCachedUri(remoteUrl);
      } catch (error) {
        console.log('Error prefetching image:', error);
        setCachedUri(remoteUrl);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [remoteUrl]);

  return { cachedUri, isLoading };
};