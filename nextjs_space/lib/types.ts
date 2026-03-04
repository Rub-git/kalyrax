// Core nutrition calculation types

export interface ProfileInput {
  age: number;
  sex: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface MacroDistribution {
  carbPercent: number;  // 55-65, default 60
  proteinPercent: number; // 10-15, default 12
  fatPercent: number;   // 25-30, default 28
}

export interface CalculationResult {
  geb: number;          // Gasto Energético Basal (kcal)
  eta: number;          // Efecto Térmico de los Alimentos (kcal)
  get: number;          // Gasto Energético Total (kcal)
  bmr: number;          // Alias for GEB (English)
  tdee: number;         // Alias for GET (English)
  carbG: number;        // Grams of carbohydrates
  proteinG: number;     // Grams of protein
  fatG: number;         // Grams of fat
  fiberTargetG: number; // Target fiber in grams
  carbPercent: number;
  proteinPercent: number;
  fatPercent: number;
  bmi: number;          // Body Mass Index
  formulaVersion: string;
}

export type MedicalFlag = 
  | 'pregnancy'
  | 'lactation'
  | 'diabetes'
  | 'renal'
  | 'eating_disorder'
  | 'allergies'
  | 'hypertension'
  | 'heart_disease';

export type DietaryPreference = 
  | 'vegetarian'
  | 'vegan'
  | 'lactose_free'
  | 'gluten_free'
  | 'budget_conscious'
  | 'halal'
  | 'kosher';

export type Goal = 
  | 'maintain'
  | 'lose_weight'
  | 'gain_weight'
  | 'improve_health';

export interface UserProfile {
  id: string;
  userId: string;
  age: number;
  sex: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  activityLevel: string;
  goal: Goal;
  medicalFlags: MedicalFlag[];
  dietaryPrefs: DietaryPreference[];
}

// Food catalog types
export interface FoodItem {
  id: string;
  name: string;
  nameEs: string;
  regionTags: string[];
  category: FoodCategory;
  servingSize: number;
  servingUnit: string;
  kcal: number;
  carbG: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
}

export type FoodCategory = 
  | 'proteins'
  | 'carbs'
  | 'fats'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'legumes'
  | 'grains'
  | 'beverages'
  | 'condiments';

// Meal plan types
export interface MealPlanDay {
  dayNumber: number;
  date: string;
  meals: MealData[];
  totalKcal: number;
  totalCarbG: number;
  totalProteinG: number;
  totalFatG: number;
  totalFiberG: number;
}

export interface MealData {
  mealType: MealType;
  name: string;
  nameEs: string;
  items: MealItemData[];
  totalKcal: number;
  totalCarbG: number;
  totalProteinG: number;
  totalFatG: number;
}

export interface MealItemData {
  foodId: string;
  foodName: string;
  foodNameEs: string;
  quantity: number;
  unit: string;
  kcal: number;
  carbG: number;
  proteinG: number;
  fatG: number;
}

export type MealType = 
  | 'breakfast'
  | 'snack_am'
  | 'lunch'
  | 'snack_pm'
  | 'dinner';

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  createdAt: Date;
}

export interface Citation {
  chunkId: string;
  sectionTitle: string;
  pageNumber: number;
  text: string;
  relevanceScore?: number;
}

// Tracking types
export interface TrackingEntry {
  id: string;
  userId: string;
  date: Date;
  mealType: MealType;
  foodId: string;
  quantity: number;
  unit: string;
}

export interface DailyTracking {
  date: string;
  entries: TrackingEntry[];
  totals: {
    kcal: number;
    carbG: number;
    proteinG: number;
    fatG: number;
    fiberG: number;
  };
  targets: {
    kcal: number;
    carbG: number;
    proteinG: number;
    fatG: number;
    fiberG: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// i18n types
export type Language = 'en' | 'es';

export interface TranslationStrings {
  [key: string]: string | TranslationStrings;
}
