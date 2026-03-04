'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Flame, Dumbbell, Apple, Zap, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/components/providers';
import Link from 'next/link';
import {
  calculateGEB,
  calculateGET,
  calculateMacroGrams,
  calculateBMI,
  getBMIClassification,
  calculateFiberTarget,
  DEFAULT_MACROS,
  ACTIVITY_FACTORS,
} from '@/lib/calc-engine';

export type CalculatorType = 'macro' | 'calorie' | 'protein' | 'meal_plan';

interface CalculatorResult {
  tdee: number;
  bmr: number;
  bmi: number;
  bmiCategory: string;
  carbG: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
}

interface SEOCalculatorProps {
  type: CalculatorType;
  onCalculate?: (inputs: Record<string, unknown>, results: Record<string, unknown>) => void;
}

const activityOptions = [
  { value: 'sedentary', labelEn: 'Sedentary (little or no exercise)', labelEs: 'Sedentario (poco o nada de ejercicio)' },
  { value: 'light', labelEn: 'Light (exercise 1-3 days/week)', labelEs: 'Ligero (ejercicio 1-3 días/semana)' },
  { value: 'moderate', labelEn: 'Moderate (exercise 3-5 days/week)', labelEs: 'Moderado (ejercicio 3-5 días/semana)' },
  { value: 'active', labelEn: 'Active (exercise 6-7 days/week)', labelEs: 'Activo (ejercicio 6-7 días/semana)' },
  { value: 'very_active', labelEn: 'Very Active (intense exercise daily)', labelEs: 'Muy activo (ejercicio intenso diario)' },
];

export function SEOCalculator({ type, onCalculate }: SEOCalculatorProps) {
  const { language, t } = useLanguage();
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  
  const [formData, setFormData] = useState({
    age: '',
    sex: 'male',
    weight: '',
    height: '',
    activityLevel: 'moderate',
    unit: 'metric', // metric or imperial
  });

  const handleCalculate = () => {
    const age = parseInt(formData.age);
    const sex = formData.sex as 'male' | 'female';
    
    // Convert to metric if imperial
    let weightKg = parseFloat(formData.weight);
    let heightCm = parseFloat(formData.height);
    
    if (formData.unit === 'imperial') {
      weightKg = weightKg * 0.453592; // lbs to kg
      heightCm = heightCm * 2.54; // inches to cm
    }

    // Calculate values
    const bmr = calculateGEB(age, sex, weightKg, heightCm);
    const tdee = calculateGET(bmr, formData.activityLevel);
    const bmi = calculateBMI(weightKg, heightCm);
    const bmiCategory = getBMIClassification(bmi);
    
    // Calculate macros based on calculator type
    let macros = DEFAULT_MACROS;
    if (type === 'protein') {
      // Higher protein for protein calculator
      macros = { carbPercent: 45, proteinPercent: 30, fatPercent: 25 };
    }
    
    const { carbG, proteinG, fatG } = calculateMacroGrams(tdee, macros);
    const fiberG = calculateFiberTarget(age, sex);

    const calculatedResult: CalculatorResult = {
      tdee: Math.round(tdee),
      bmr: Math.round(bmr),
      bmi,
      bmiCategory,
      carbG,
      proteinG,
      fatG,
      fiberG,
    };

    setResult(calculatedResult);
    setShowResult(true);
    
    if (onCalculate) {
      onCalculate({
        age,
        sex,
        weightKg,
        heightCm,
        activityLevel: formData.activityLevel,
        unit: formData.unit,
      }, calculatedResult as unknown as Record<string, unknown>);
    }
  };

  const isFormValid = formData.age && formData.weight && formData.height && 
    parseInt(formData.age) > 0 && parseFloat(formData.weight) > 0 && parseFloat(formData.height) > 0;

  const getTitle = () => {
    switch (type) {
      case 'macro': return language === 'en' ? 'Macro Calculator' : 'Calculadora de Macros';
      case 'calorie': return language === 'en' ? 'Calorie Calculator' : 'Calculadora de Calorías';
      case 'protein': return language === 'en' ? 'Protein Calculator' : 'Calculadora de Proteínas';
      case 'meal_plan': return language === 'en' ? 'Meal Plan Generator' : 'Generador de Plan de Comidas';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'macro': return <Calculator className="h-6 w-6" />;
      case 'calorie': return <Flame className="h-6 w-6" />;
      case 'protein': return <Dumbbell className="h-6 w-6" />;
      case 'meal_plan': return <Apple className="h-6 w-6" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-2 border-emerald-100 shadow-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              {getIcon()}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
          </div>

          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Unit Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                  <button
                    onClick={() => setFormData({ ...formData, unit: 'metric' })}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      formData.unit === 'metric'
                        ? 'bg-white shadow text-emerald-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {language === 'en' ? 'Metric (kg/cm)' : 'Métrico (kg/cm)'}
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, unit: 'imperial' })}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      formData.unit === 'imperial'
                        ? 'bg-white shadow text-emerald-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {language === 'en' ? 'Imperial (lbs/in)' : 'Imperial (lbs/in)'}
                  </button>
                </div>

                {/* Sex Selection */}
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Sex' : 'Sexo'}</Label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFormData({ ...formData, sex: 'male' })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                        formData.sex === 'male'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {language === 'en' ? 'Male' : 'Masculino'}
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, sex: 'female' })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                        formData.sex === 'female'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {language === 'en' ? 'Female' : 'Femenino'}
                    </button>
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label htmlFor="age">{language === 'en' ? 'Age' : 'Edad'}</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder={language === 'en' ? 'Enter your age' : 'Ingresa tu edad'}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    min="1"
                    max="120"
                    className="text-lg py-6"
                  />
                </div>

                {/* Weight & Height */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">
                      {language === 'en' ? 'Weight' : 'Peso'} ({formData.unit === 'metric' ? 'kg' : 'lbs'})
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder={formData.unit === 'metric' ? '70' : '154'}
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      min="1"
                      className="text-lg py-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">
                      {language === 'en' ? 'Height' : 'Altura'} ({formData.unit === 'metric' ? 'cm' : 'inches'})
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder={formData.unit === 'metric' ? '175' : '69'}
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      min="1"
                      className="text-lg py-6"
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Activity Level' : 'Nivel de Actividad'}</Label>
                  <div className="space-y-2">
                    {activityOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, activityLevel: option.value })}
                        className={`w-full text-left py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                          formData.activityLevel === option.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {language === 'en' ? option.labelEn : option.labelEs}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCalculate}
                  disabled={!isFormValid}
                  className="w-full py-6 text-lg bg-emerald-600 hover:bg-emerald-700"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {language === 'en' ? 'Calculate Now' : 'Calcular Ahora'}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {result && (
                  <>
                    {/* Main Result */}
                    <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
                      {type === 'calorie' || type === 'meal_plan' ? (
                        <>
                          <p className="text-gray-600 mb-2">
                            {language === 'en' ? 'Your Daily Calories' : 'Tus Calorías Diarias'}
                          </p>
                          <p className="text-5xl font-bold text-emerald-600">
                            {result.tdee.toLocaleString()}
                          </p>
                          <p className="text-gray-500 mt-1">kcal/day</p>
                        </>
                      ) : type === 'protein' ? (
                        <>
                          <p className="text-gray-600 mb-2">
                            {language === 'en' ? 'Your Daily Protein Target' : 'Tu Meta Diaria de Proteína'}
                          </p>
                          <p className="text-5xl font-bold text-emerald-600">
                            {result.proteinG}g
                          </p>
                          <p className="text-gray-500 mt-1">
                            {language === 'en' ? 'protein per day' : 'proteína por día'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600 mb-2">
                            {language === 'en' ? 'Your Daily Macros' : 'Tus Macros Diarios'}
                          </p>
                          <div className="flex justify-center gap-6 mt-4">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-amber-500">{result.carbG}g</p>
                              <p className="text-sm text-gray-500">{language === 'en' ? 'Carbs' : 'Carbohidratos'}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-red-500">{result.proteinG}g</p>
                              <p className="text-sm text-gray-500">{language === 'en' ? 'Protein' : 'Proteína'}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-blue-500">{result.fatG}g</p>
                              <p className="text-sm text-gray-500">{language === 'en' ? 'Fat' : 'Grasa'}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{language === 'en' ? 'BMR (Basal Metabolic Rate)' : 'TMB (Tasa Metabólica Basal)'}</p>
                        <p className="text-xl font-semibold">{result.bmr} kcal</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">BMI</p>
                        <p className="text-xl font-semibold">{result.bmi} <span className="text-sm font-normal text-gray-500">({result.bmiCategory})</span></p>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl text-white">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Dumbbell className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {language === 'en' ? 'Ready for the 7-Day Challenge?' : '¿Listo para el Reto de 7 Días?'}
                          </h3>
                          <p className="text-emerald-100 text-sm mb-4">
                            {language === 'en' 
                              ? 'Get a personalized meal plan and join our high-protein challenge to transform your nutrition.'
                              : 'Obtén un plan de comidas personalizado y únete a nuestro reto de alta proteína para transformar tu nutrición.'}
                          </p>
                          <Link href="/get-started">
                            <Button className="bg-white text-emerald-600 hover:bg-emerald-50">
                              {language === 'en' ? 'Start Free Challenge' : 'Iniciar Reto Gratis'}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Recalculate button */}
                    <Button
                      variant="outline"
                      onClick={() => setShowResult(false)}
                      className="w-full"
                    >
                      {language === 'en' ? 'Calculate Again' : 'Calcular de Nuevo'}
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
