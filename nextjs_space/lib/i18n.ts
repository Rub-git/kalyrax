export type Language = 'en' | 'es';

export const translations = {
  en: {
    // App
    appName: 'NutriCoach',
    tagline: 'Your AI-Powered Nutrition Assistant',
    
    // Navigation
    dashboard: 'Dashboard',
    mealPlan: 'Meal Plan',
    tracking: 'Tracking',
    chat: 'NutriCoach Chat',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Sign Out',
    login: 'Sign In',
    signup: 'Sign Up',
    
    // Auth
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Name',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    signInWith: 'Sign in with',
    orContinueWith: 'Or continue with',
    
    // Profile
    age: 'Age',
    years: 'years',
    sex: 'Sex',
    male: 'Male',
    female: 'Female',
    weight: 'Weight',
    height: 'Height',
    activityLevel: 'Activity Level',
    goal: 'Goal',
    medicalConditions: 'Medical Conditions',
    dietaryPreferences: 'Dietary Preferences',
    saveProfile: 'Save Profile',
    
    // Activity Levels
    sedentary: 'Sedentary (little or no exercise)',
    light: 'Light (exercise 1-3 days/week)',
    moderate: 'Moderate (exercise 3-5 days/week)',
    active: 'Active (hard exercise 6-7 days/week)',
    very_active: 'Very Active (very hard exercise, physical job)',
    
    // Goals
    maintain: 'Maintain Weight',
    lose_weight: 'Lose Weight',
    gain_weight: 'Gain Weight',
    improve_health: 'Improve Overall Health',
    
    // Medical Flags
    pregnancy: 'Pregnancy',
    lactation: 'Lactation/Breastfeeding',
    diabetes: 'Diabetes',
    renal: 'Renal/Kidney Issues',
    eating_disorder: 'Eating Disorder History',
    allergies: 'Food Allergies',
    hypertension: 'Hypertension',
    heart_disease: 'Heart Disease',
    
    // Dietary Preferences
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    lactose_free: 'Lactose-Free',
    gluten_free: 'Gluten-Free',
    budget_conscious: 'Budget-Conscious',
    
    // Calculations
    yourResults: 'Your Nutrition Results',
    geb: 'Basal Metabolic Rate (GEB/BMR)',
    eta: 'Thermic Effect of Food (ETA)',
    get: 'Total Daily Energy (GET/TDEE)',
    dailyCalories: 'Daily Calories',
    macronutrients: 'Macronutrients',
    carbohydrates: 'Carbohydrates',
    protein: 'Protein',
    fat: 'Fat',
    fiber: 'Fiber Target',
    bmi: 'Body Mass Index (BMI)',
    formulaVersion: 'Formula Version',
    learnMore: 'Learn More',
    recalculate: 'Recalculate',
    
    // Meal Plan
    generatePlan: 'Generate Meal Plan',
    weeklyPlan: 'Weekly Meal Plan',
    shoppingList: 'Shopping List',
    breakfast: 'Breakfast',
    snack_am: 'Morning Snack',
    lunch: 'Lunch',
    snack_pm: 'Afternoon Snack',
    dinner: 'Dinner',
    day: 'Day',
    regenerate: 'Regenerate',
    
    // Tracking
    trackMeal: 'Track Meal',
    addFood: 'Add Food',
    dailyProgress: 'Daily Progress',
    consumed: 'Consumed',
    target: 'Target',
    remaining: 'Remaining',
    selectFood: 'Select Food',
    quantity: 'Quantity',
    unit: 'Unit',
    searchFoods: 'Search foods...',
    
    // Chat
    askNutriCoach: 'Ask NutriCoach...',
    typeMessage: 'Type your message...',
    suggestedQuestions: 'Suggested Questions',
    explainCalculations: 'Explain my calculations',
    suggestSnacks: 'Suggest healthy snacks',
    swapIngredient: 'Help me swap an ingredient',
    citations: 'References',
    page: 'Page',
    
    // Disclaimers
    disclaimer: 'Disclaimer',
    disclaimerText: 'This app provides nutritional information and is not a substitute for professional medical advice. Consult a healthcare provider before making dietary changes.',
    medicalWarning: 'Based on your health profile, we recommend consulting with a healthcare professional before following any nutrition advice.',
    
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    error: 'Error',
    success: 'Success',
    kcal: 'kcal',
    grams: 'g',
    perDay: 'per day',
    of: 'of',
    welcome: 'Welcome',
    getStarted: 'Get Started',
    completeProfile: 'Complete Your Profile',
    startOnboarding: 'Let\'s set up your nutrition profile to get personalized recommendations.',
    
    // Days
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  },
  es: {
    // App
    appName: 'NutriCoach',
    tagline: 'Tu Asistente de Nutrición con IA',
    
    // Navigation
    dashboard: 'Panel',
    mealPlan: 'Plan de Comidas',
    tracking: 'Seguimiento',
    chat: 'Chat NutriCoach',
    profile: 'Perfil',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    
    // Auth
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    name: 'Nombre',
    createAccount: 'Crear Cuenta',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    dontHaveAccount: '¿No tienes una cuenta?',
    signInWith: 'Iniciar sesión con',
    orContinueWith: 'O continúa con',
    
    // Profile
    age: 'Edad',
    years: 'años',
    sex: 'Sexo',
    male: 'Masculino',
    female: 'Femenino',
    weight: 'Peso',
    height: 'Altura',
    activityLevel: 'Nivel de Actividad',
    goal: 'Objetivo',
    medicalConditions: 'Condiciones Médicas',
    dietaryPreferences: 'Preferencias Dietéticas',
    saveProfile: 'Guardar Perfil',
    
    // Activity Levels
    sedentary: 'Sedentario (poco o ningún ejercicio)',
    light: 'Ligero (ejercicio 1-3 días/semana)',
    moderate: 'Moderado (ejercicio 3-5 días/semana)',
    active: 'Activo (ejercicio intenso 6-7 días/semana)',
    very_active: 'Muy Activo (ejercicio muy intenso, trabajo físico)',
    
    // Goals
    maintain: 'Mantener Peso',
    lose_weight: 'Perder Peso',
    gain_weight: 'Ganar Peso',
    improve_health: 'Mejorar Salud General',
    
    // Medical Flags
    pregnancy: 'Embarazo',
    lactation: 'Lactancia',
    diabetes: 'Diabetes',
    renal: 'Problemas Renales',
    eating_disorder: 'Historial de Trastorno Alimenticio',
    allergies: 'Alergias Alimentarias',
    hypertension: 'Hipertensión',
    heart_disease: 'Enfermedad Cardíaca',
    
    // Dietary Preferences
    vegetarian: 'Vegetariano',
    vegan: 'Vegano',
    lactose_free: 'Sin Lactosa',
    gluten_free: 'Sin Gluten',
    budget_conscious: 'Económico',
    
    // Calculations
    yourResults: 'Tus Resultados Nutricionales',
    geb: 'Gasto Energético Basal (GEB)',
    eta: 'Efecto Térmico de los Alimentos (ETA)',
    get: 'Gasto Energético Total (GET)',
    dailyCalories: 'Calorías Diarias',
    macronutrients: 'Macronutrimentos',
    carbohydrates: 'Carbohidratos',
    protein: 'Proteínas',
    fat: 'Grasas',
    fiber: 'Meta de Fibra',
    bmi: 'Índice de Masa Corporal (IMC)',
    formulaVersion: 'Versión de Fórmula',
    learnMore: 'Saber Más',
    recalculate: 'Recalcular',
    
    // Meal Plan
    generatePlan: 'Generar Plan de Comidas',
    weeklyPlan: 'Plan Semanal',
    shoppingList: 'Lista de Compras',
    breakfast: 'Desayuno',
    snack_am: 'Colación Mañana',
    lunch: 'Comida',
    snack_pm: 'Colación Tarde',
    dinner: 'Cena',
    day: 'Día',
    regenerate: 'Regenerar',
    
    // Tracking
    trackMeal: 'Registrar Comida',
    addFood: 'Agregar Alimento',
    dailyProgress: 'Progreso Diario',
    consumed: 'Consumido',
    target: 'Meta',
    remaining: 'Restante',
    selectFood: 'Seleccionar Alimento',
    quantity: 'Cantidad',
    unit: 'Unidad',
    searchFoods: 'Buscar alimentos...',
    
    // Chat
    askNutriCoach: 'Pregunta a NutriCoach...',
    typeMessage: 'Escribe tu mensaje...',
    suggestedQuestions: 'Preguntas Sugeridas',
    explainCalculations: 'Explícame mis cálculos',
    suggestSnacks: 'Sugiere snacks saludables',
    swapIngredient: 'Ayúdame a cambiar un ingrediente',
    citations: 'Referencias',
    page: 'Página',
    
    // Disclaimers
    disclaimer: 'Aviso',
    disclaimerText: 'Esta aplicación proporciona información nutricional y no sustituye el consejo médico profesional. Consulta a un profesional de salud antes de hacer cambios en tu dieta.',
    medicalWarning: 'Según tu perfil de salud, te recomendamos consultar con un profesional de la salud antes de seguir cualquier consejo nutricional.',
    
    // Common
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    error: 'Error',
    success: 'Éxito',
    kcal: 'kcal',
    grams: 'g',
    perDay: 'por día',
    of: 'de',
    welcome: 'Bienvenido',
    getStarted: 'Comenzar',
    completeProfile: 'Completa Tu Perfil',
    startOnboarding: 'Configuremos tu perfil nutricional para obtener recomendaciones personalizadas.',
    
    // Days
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  },
};

export function t(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value ?? key;
}
