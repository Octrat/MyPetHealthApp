// src/utils/healthCheck.ts
export type SizeCategory = 'toy' | 'small' | 'medium' | 'large' | 'giant';

interface GrowthParams {
  age: number; // в годах
  sex: 'male' | 'female';
  neutered: boolean;
}

interface CategoryStandards {
  weight: (params: GrowthParams) => { min: number; max: number };
  height: (params: GrowthParams) => { min: number; max: number };
}

const categoryStandards: Record<SizeCategory, CategoryStandards> = {
  toy: {
    weight: ({ age }) => ({
      min: 1 + age * 0.5,
      max: 4 + age * 0.5,
    }),
    height: ({ age }) => ({
      min: 15 + age * 0.5,
      max: 25 + age * 0.5,
    }),
  },
  small: {
    weight: ({ age }) => ({ min: 4 + age, max: 10 + age * 1.5 }),
    height: ({ age }) => ({ min: 20 + age, max: 30 + age }),
  },
  medium: {
    weight: ({ age }) => ({ min: 10 + age * 2, max: 20 + age * 3 }),
    height: ({ age }) => ({ min: 30 + age * 1.5, max: 45 + age * 2 }),
  },
  large: {
    weight: ({ age }) => ({ min: 20 + age * 3, max: 35 + age * 4 }),
    height: ({ age }) => ({ min: 50 + age * 2, max: 65 + age * 3 }),
  },
  giant: {
    weight: ({ age }) => ({ min: 35 + age * 5, max: 70 + age * 6 }),
    height: ({ age }) => ({ min: 60 + age * 3, max: 85 + age * 4 }),
  },
};

export function analyzePetHealthByCategory(params: {
  sizeCategory: SizeCategory;
  weight: number;
  height: number;
  age: number;
  sex: 'male' | 'female';
  neutered: boolean;
}) {
  const { sizeCategory, weight, height, age, sex, neutered } = params;
  const standard = categoryStandards[sizeCategory];
  if (!standard) return null;

  const weightRange = standard.weight({ age, sex, neutered });
  const heightRange = standard.height({ age, sex, neutered });

  let weightStatus: 'ниже нормы' | 'норма' | 'выше нормы' = 'норма';
  if (weight < weightRange.min) weightStatus = 'ниже нормы';
  if (weight > weightRange.max) weightStatus = 'выше нормы';

  let heightStatus: 'ниже нормы' | 'норма' | 'выше нормы' = 'норма';
  if (height < heightRange.min) heightStatus = 'ниже нормы';
  if (height > heightRange.max) heightStatus = 'выше нормы';

  return { weightStatus, heightStatus, weightRange, heightRange };
}