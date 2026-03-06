// src/constants/breedStandards.ts

export const breedStandards: Record<string, { weight: { min: number; max: number }, height: { min: number; max: number } }> = {

    // Собаки
    Labrador: { weight: { min: 25, max: 36 }, height: { min: 55, max: 62 } },
    Beagle: { weight: { min: 9, max: 11 }, height: { min: 33, max: 40 } },
    Husky: { weight: { min: 20, max: 27 }, height: { min: 50, max: 60 } },
    Bulldog: { weight: { min: 18, max: 23 }, height: { min: 31, max: 40 } },
  
    // Кошки
    Persian: { weight: { min: 3, max: 5 }, height: { min: 20, max: 25 } },
    Siamese: { weight: { min: 2, max: 4 }, height: { min: 20, max: 25 } },
    MaineCoon: { weight: { min: 4, max: 8 }, height: { min: 25, max: 40 } },
    Bengal: { weight: { min: 3, max: 5 }, height: { min: 25, max: 30 } },
  
  };