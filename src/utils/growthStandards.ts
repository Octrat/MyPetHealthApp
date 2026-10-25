export const dogAdultWeight: Record<string, number> = {
    toy: 3,
    small: 7,
    medium: 18,
    large: 30,
    giant: 50
  };
  
  export const catAdultWeight: Record<string, number> = {
    small: 3,
    medium: 4.5,
    large: 6
  };
  
  export function getGrowthFactor(months: number) {
    if (months <= 2) return 0.2;
    if (months <= 4) return 0.4;
    if (months <= 6) return 0.6;
    if (months <= 9) return 0.8;
    return 1;
  }