/**
 * Deterministic Nutrition Calculation Engine
 * Based on Harris-Benedict formulas from PDF_N1_M2_V5
 * 
 * CRITICAL: All calculations are deterministic and auditable
 * AI systems MUST NOT modify these calculations
 * 
 * Formula version: harris-benedict-v1.0
 * Reference pages: 51-54 of source PDF
 */

import { ProfileInput, MacroDistribution, CalculationResult } from './types';

export const FORMULA_VERSION = 'harris-benedict-v1.0';

// Activity factors (page 53)
export const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,      // Little or no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Hard exercise 6-7 days/week
  very_active: 1.9,    // Very hard exercise, physical job
};

// Default macro distribution (page 53) - 60/12/28 as per PDF
export const DEFAULT_MACROS: MacroDistribution = {
  carbPercent: 60,    // 55-65% recommended
  proteinPercent: 12, // 10-15% recommended
  fatPercent: 28,     // 25-30% recommended
};

// Energy conversion factors (page 54)
export const KCAL_PER_GRAM = {
  carbs: 4,
  protein: 4,
  fat: 9,
};

// ETA default percentage (page 52)
export const DEFAULT_ETA_PERCENT = 0.10; // 10% of GEB

/**
 * Calculate Gasto Energético Basal (GEB) using Harris-Benedict formulas
 * Reference: Pages 51-52 of PDF
 * 
 * @param age - Age in years
 * @param sex - 'male' or 'female'
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 * @returns GEB in kcal/day
 */
export function calculateGEB(
  age: number,
  sex: 'male' | 'female',
  weightKg: number,
  heightCm: number
): number {
  let geb: number;

  if (sex === 'male') {
    if (age >= 19 && age <= 30) {
      // Men 19-30: GEB = (15.057 × peso kg) + (1.0004 × talla cm) + 705.8
      geb = (15.057 * weightKg) + (1.0004 * heightCm) + 705.8;
    } else if (age >= 31 && age <= 60) {
      // Men 31-60: GEB = (11.472 × peso kg) + (0.7739 × talla cm) + 654.2
      geb = (11.472 * weightKg) + (0.7739 * heightCm) + 654.2;
    } else {
      // Men >60: GEB = (11.711 × peso kg) + (0.6176 × talla cm) + 587.7
      geb = (11.711 * weightKg) + (0.6176 * heightCm) + 587.7;
    }
  } else {
    if (age >= 19 && age <= 30) {
      // Women 19-30: GEB = (14.818 × peso kg) + (0.4868 × talla cm) + 244.5
      geb = (14.818 * weightKg) + (0.4868 * heightCm) + 244.5;
    } else if (age >= 31 && age <= 60) {
      // Women 31-60: GEB = (8.126 × peso kg) + (0.4356 × talla cm) + 585.5
      geb = (8.126 * weightKg) + (0.4356 * heightCm) + 585.5;
    } else {
      // Women >60: GEB = (9.082 × peso kg) + (0.6329 × talla cm) + 439.2
      geb = (9.082 * weightKg) + (0.6329 * heightCm) + 439.2;
    }
  }

  return Math.round(geb * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate Efecto Térmico de los Alimentos (ETA)
 * Reference: Page 52 of PDF
 * Standard: 10% of GEB (configurable 6-10%)
 * 
 * @param geb - Gasto Energético Basal
 * @param etaPercent - ETA percentage (default 0.10 = 10%)
 * @returns ETA in kcal/day
 */
export function calculateETA(geb: number, etaPercent: number = DEFAULT_ETA_PERCENT): number {
  // Clamp ETA percent between 6% and 10%
  const clampedPercent = Math.max(0.06, Math.min(0.10, etaPercent));
  return Math.round(geb * clampedPercent * 10) / 10;
}

/**
 * Calculate Gasto Energético Total (GET)
 * Reference: Page 52-53 of PDF
 * Formula: GET = GEB × Activity Factor
 * Note: ETA is included implicitly in activity factor approach
 * 
 * @param geb - Gasto Energético Basal
 * @param activityLevel - Activity level string
 * @returns GET in kcal/day
 */
export function calculateGET(
  geb: number,
  activityLevel: string
): number {
  const factor = ACTIVITY_FACTORS[activityLevel] ?? ACTIVITY_FACTORS.sedentary;
  return Math.round(geb * factor * 10) / 10;
}

/**
 * Calculate macronutrient grams from GET
 * Reference: Page 54 of PDF
 * 
 * @param get - Gasto Energético Total (kcal)
 * @param macros - Macro distribution percentages
 * @returns Object with carb, protein, fat grams
 */
export function calculateMacroGrams(
  get: number,
  macros: MacroDistribution = DEFAULT_MACROS
): { carbG: number; proteinG: number; fatG: number } {
  // Validate macro percentages sum to ~100%
  const total = macros.carbPercent + macros.proteinPercent + macros.fatPercent;
  if (total < 95 || total > 105) {
    console.warn(`Macro percentages sum to ${total}%, expected ~100%`);
  }

  // Formula: grams = (GET × percent) / kcal_per_gram
  const carbG = Math.round((get * (macros.carbPercent / 100)) / KCAL_PER_GRAM.carbs);
  const proteinG = Math.round((get * (macros.proteinPercent / 100)) / KCAL_PER_GRAM.protein);
  const fatG = Math.round((get * (macros.fatPercent / 100)) / KCAL_PER_GRAM.fat);

  return { carbG, proteinG, fatG };
}

/**
 * Calculate fiber target based on age and sex
 * Reference: Page 20 of PDF
 * 
 * @param age - Age in years
 * @param sex - 'male' or 'female'
 * @returns Fiber target in grams/day
 */
export function calculateFiberTarget(age: number, sex: 'male' | 'female'): number {
  if (age < 19) {
    if (age <= 4) return 14;
    if (age <= 8) return 18;
    if (age <= 13) return 22;
    // 14-18
    return sex === 'male' ? 30 : 26;
  }
  
  if (age <= 50) {
    // Adults 19-50
    return sex === 'male' ? 35 : 30;
  }
  
  // Adults >50
  return sex === 'male' ? 30 : 26;
}

/**
 * Calculate BMI (Body Mass Index)
 * Formula: weight_kg / (height_m²)
 * 
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 * @returns BMI value
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI classification
 * @param bmi - BMI value
 * @returns Classification string
 */
export function getBMIClassification(bmi: number): string {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/**
 * Complete nutrition calculation
 * This is the main entry point for all nutrition calculations
 * 
 * @param profile - User profile input
 * @param macros - Optional custom macro distribution
 * @param etaPercent - Optional custom ETA percentage
 * @returns Complete calculation result
 */
export function calculateNutrition(
  profile: ProfileInput,
  macros: MacroDistribution = DEFAULT_MACROS,
  etaPercent: number = DEFAULT_ETA_PERCENT
): CalculationResult {
  // Step 1: Calculate GEB (Basal Metabolic Rate)
  const geb = calculateGEB(profile.age, profile.sex, profile.weightKg, profile.heightCm);

  // Step 2: Calculate ETA (Thermic Effect of Food)
  const eta = calculateETA(geb, etaPercent);

  // Step 3: Calculate GET (Total Daily Energy Expenditure)
  const get = calculateGET(geb, profile.activityLevel);

  // Step 4: Calculate macronutrient grams
  const { carbG, proteinG, fatG } = calculateMacroGrams(get, macros);

  // Step 5: Calculate fiber target
  const fiberTargetG = calculateFiberTarget(profile.age, profile.sex);

  // Step 6: Calculate BMI
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);

  return {
    geb,
    eta,
    get,
    bmr: geb,  // English alias
    tdee: get, // English alias
    carbG,
    proteinG,
    fatG,
    fiberTargetG,
    carbPercent: macros.carbPercent,
    proteinPercent: macros.proteinPercent,
    fatPercent: macros.fatPercent,
    bmi,
    formulaVersion: FORMULA_VERSION,
  };
}

/**
 * Adjust calories based on goal
 * @param get - Base GET
 * @param goal - User's goal
 * @returns Adjusted calorie target
 */
export function adjustCaloriesForGoal(
  get: number,
  goal: 'maintain' | 'lose_weight' | 'gain_weight' | 'improve_health'
): number {
  switch (goal) {
    case 'lose_weight':
      // 500 kcal deficit for ~0.5kg/week loss
      return Math.round(get - 500);
    case 'gain_weight':
      // 300 kcal surplus for lean gain
      return Math.round(get + 300);
    case 'maintain':
    case 'improve_health':
    default:
      return Math.round(get);
  }
}

/**
 * Validate profile input
 * @param profile - Profile to validate
 * @returns Validation result with errors if any
 */
export function validateProfileInput(profile: ProfileInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (profile.age < 1 || profile.age > 120) {
    errors.push('Age must be between 1 and 120 years');
  }

  if (!['male', 'female'].includes(profile.sex)) {
    errors.push('Sex must be "male" or "female"');
  }

  if (profile.weightKg < 20 || profile.weightKg > 500) {
    errors.push('Weight must be between 20 and 500 kg');
  }

  if (profile.heightCm < 50 || profile.heightCm > 300) {
    errors.push('Height must be between 50 and 300 cm');
  }

  if (!Object.keys(ACTIVITY_FACTORS).includes(profile.activityLevel)) {
    errors.push(`Activity level must be one of: ${Object.keys(ACTIVITY_FACTORS).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate macro distribution
 * @param macros - Macro distribution to validate
 * @returns Validation result
 */
export function validateMacroDistribution(macros: MacroDistribution): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (macros.carbPercent < 45 || macros.carbPercent > 75) {
    errors.push('Carbohydrate percentage should be between 45-75%');
  }

  if (macros.proteinPercent < 10 || macros.proteinPercent > 35) {
    errors.push('Protein percentage should be between 10-35%');
  }

  if (macros.fatPercent < 20 || macros.fatPercent > 40) {
    errors.push('Fat percentage should be between 20-40%');
  }

  const total = macros.carbPercent + macros.proteinPercent + macros.fatPercent;
  if (total !== 100) {
    errors.push(`Macro percentages must sum to 100% (current: ${total}%)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
