
// src/utils/healthCheck.ts

export type SizeCategory = 'toy' | 'small' | 'medium' | 'large' | 'giant';

export interface HealthRange {
  min: number;
  max: number;
}

export interface PetHealthAnalysis {
  weightStatus: 'ниже нормы' | 'норма' | 'выше нормы';
  heightStatus: 'ниже нормы' | 'норма' | 'выше нормы';
  weightRange: HealthRange;
  heightRange: HealthRange;
}

/**
 * Важно:
 * Категория размера и возраст сами по себе не позволяют надёжно
 * определить медицинскую норму веса и роста питомца.
 *
 * Пока для породы не заданы проверенные диапазоны, возвращаем null,
 * чтобы приложение не показывало владельцу недостоверные результаты.
 *
 * В дальнейшем диапазоны следует хранить по конкретной породе,
 * а для растущих животных учитывать возрастную группу.
 */
export function analyzePetHealthByCategory(_params: {
  sizeCategory: SizeCategory;
  weight: number;
  height: number;
  age: number;
  sex: 'male' | 'female';
  neutered: boolean;
}): PetHealthAnalysis | null {
  return null;
}
