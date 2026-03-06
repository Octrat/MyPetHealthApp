// src/utils/healthCheck.ts

import { breedStandards } from '../constants/breedStandards';

export function analyzePetHealth(pet: { breed_name?: string; weight?: number; height?: number }) {
  if (!pet.breed_name) return null;

  const standard = breedStandards[pet.breed_name];
  if (!standard) return null;

  let weightStatus = 'норма';
  if (pet.weight! < standard.weight.min) weightStatus = 'ниже нормы';
  if (pet.weight! > standard.weight.max) weightStatus = 'выше нормы';

  let heightStatus = 'норма';
  if (pet.height! < standard.height.min) heightStatus = 'ниже нормы';
  if (pet.height! > standard.height.max) heightStatus = 'выше нормы';

  return { weightStatus, heightStatus };
}