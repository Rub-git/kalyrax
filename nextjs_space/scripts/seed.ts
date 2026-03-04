import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Food catalog data - 150+ items covering USA/Mexico/LATAM
const foodItems = [
  // PROTEINS (20+ items)
  { name: 'Chicken Breast', nameEs: 'Pechuga de Pollo', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 165, carbG: 0, proteinG: 31, fatG: 3.6, fiberG: 0 },
  { name: 'Whole Egg', nameEs: 'Huevo Entero', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 50, servingUnit: 'g', kcal: 78, carbG: 0.6, proteinG: 6.3, fatG: 5.3, fiberG: 0 },
  { name: 'Egg White', nameEs: 'Clara de Huevo', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 33, servingUnit: 'g', kcal: 17, carbG: 0.2, proteinG: 3.6, fatG: 0.1, fiberG: 0 },
  { name: 'Canned Tuna', nameEs: 'Atún en Lata', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 116, carbG: 0, proteinG: 26, fatG: 0.8, fiberG: 0 },
  { name: 'Salmon Fillet', nameEs: 'Filete de Salmón', category: 'proteins', regionTags: ['usa', 'mexico'], servingSize: 100, servingUnit: 'g', kcal: 208, carbG: 0, proteinG: 20, fatG: 13, fiberG: 0 },
  { name: 'Ground Beef (lean)', nameEs: 'Carne Molida (magra)', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 250, carbG: 0, proteinG: 26, fatG: 15, fiberG: 0 },
  { name: 'Beef Sirloin', nameEs: 'Solomillo de Res', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 200, carbG: 0, proteinG: 27, fatG: 10, fiberG: 0 },
  { name: 'Pork Loin', nameEs: 'Lomo de Cerdo', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 143, carbG: 0, proteinG: 26, fatG: 3.5, fiberG: 0 },
  { name: 'Turkey Breast', nameEs: 'Pechuga de Pavo', category: 'proteins', regionTags: ['usa', 'mexico'], servingSize: 100, servingUnit: 'g', kcal: 135, carbG: 0, proteinG: 30, fatG: 0.7, fiberG: 0 },
  { name: 'Shrimp', nameEs: 'Camarón', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 85, carbG: 0, proteinG: 20, fatG: 0.5, fiberG: 0 },
  { name: 'Tilapia', nameEs: 'Tilapia', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 96, carbG: 0, proteinG: 20, fatG: 1.7, fiberG: 0 },
  { name: 'Sardines', nameEs: 'Sardinas', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 208, carbG: 0, proteinG: 25, fatG: 11, fiberG: 0 },
  { name: 'Greek Yogurt', nameEs: 'Yogurt Griego', category: 'proteins', regionTags: ['usa', 'mexico'], servingSize: 170, servingUnit: 'g', kcal: 100, carbG: 6, proteinG: 17, fatG: 0.7, fiberG: 0 },
  { name: 'Cottage Cheese', nameEs: 'Requesón', category: 'proteins', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 98, carbG: 3.4, proteinG: 11, fatG: 4.3, fiberG: 0 },
  { name: 'Tofu (firm)', nameEs: 'Tofu Firme', category: 'proteins', regionTags: ['usa', 'mexico'], servingSize: 100, servingUnit: 'g', kcal: 144, carbG: 3, proteinG: 15, fatG: 8, fiberG: 2 },
  { name: 'Tempeh', nameEs: 'Tempeh', category: 'proteins', regionTags: ['usa'], servingSize: 100, servingUnit: 'g', kcal: 193, carbG: 9, proteinG: 19, fatG: 11, fiberG: 0 },
  { name: 'Chorizo', nameEs: 'Chorizo Mexicano', category: 'proteins', regionTags: ['mexico', 'latam'], servingSize: 60, servingUnit: 'g', kcal: 273, carbG: 1.1, proteinG: 14, fatG: 23, fiberG: 0 },
  { name: 'Carnitas', nameEs: 'Carnitas', category: 'proteins', regionTags: ['mexico'], servingSize: 100, servingUnit: 'g', kcal: 270, carbG: 0, proteinG: 22, fatG: 20, fiberG: 0 },
  { name: 'Beef Cecina', nameEs: 'Cecina de Res', category: 'proteins', regionTags: ['mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 250, carbG: 2, proteinG: 35, fatG: 12, fiberG: 0 },

  // LEGUMES (15+ items)
  { name: 'Black Beans', nameEs: 'Frijoles Negros', category: 'legumes', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 132, carbG: 24, proteinG: 9, fatG: 0.5, fiberG: 8.7 },
  { name: 'Pinto Beans', nameEs: 'Frijoles Pintos', category: 'legumes', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 143, carbG: 27, proteinG: 9, fatG: 0.6, fiberG: 9 },
  { name: 'Kidney Beans', nameEs: 'Frijoles Rojos', category: 'legumes', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 127, carbG: 23, proteinG: 9, fatG: 0.5, fiberG: 7.4 },
  { name: 'Chickpeas', nameEs: 'Garbanzos', category: 'legumes', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 164, carbG: 27, proteinG: 9, fatG: 2.6, fiberG: 7.6 },
  { name: 'Lentils', nameEs: 'Lentejas', category: 'legumes', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 116, carbG: 20, proteinG: 9, fatG: 0.4, fiberG: 8 },
  { name: 'White Beans', nameEs: 'Alubias Blancas', category: 'legumes', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 139, carbG: 25, proteinG: 9, fatG: 0.4, fiberG: 7 },
  { name: 'Refried Beans', nameEs: 'Frijoles Refritos', category: 'legumes', regionTags: ['usa', 'mexico'], servingSize: 100, servingUnit: 'g', kcal: 89, carbG: 14, proteinG: 5, fatG: 1.3, fiberG: 5 },
  { name: 'Edamame', nameEs: 'Edamame', category: 'legumes', regionTags: ['usa'], servingSize: 100, servingUnit: 'g', kcal: 121, carbG: 10, proteinG: 12, fatG: 5, fiberG: 5 },
  { name: 'Split Peas', nameEs: 'Chícharos Secos', category: 'legumes', regionTags: ['usa', 'mexico'], servingSize: 100, servingUnit: 'g', kcal: 118, carbG: 21, proteinG: 8, fatG: 0.4, fiberG: 8.3 },
  { name: 'Fava Beans', nameEs: 'Habas', category: 'legumes', regionTags: ['mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 110, carbG: 19, proteinG: 8, fatG: 0.4, fiberG: 5.4 },

  // GRAINS & CARBS (25+ items)
  { name: 'White Rice (cooked)', nameEs: 'Arroz Blanco (cocido)', category: 'grains', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 130, carbG: 28, proteinG: 2.7, fatG: 0.3, fiberG: 0.4 },
  { name: 'Brown Rice (cooked)', nameEs: 'Arroz Integral (cocido)', category: 'grains', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 112, carbG: 24, proteinG: 2.6, fatG: 0.9, fiberG: 1.8 },
  { name: 'Corn Tortilla', nameEs: 'Tortilla de Maíz', category: 'grains', regionTags: ['usa', 'mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 68, carbG: 14, proteinG: 1.8, fatG: 0.8, fiberG: 1.8 },
  { name: 'Flour Tortilla', nameEs: 'Tortilla de Harina', category: 'grains', regionTags: ['usa', 'mexico'], servingSize: 45, servingUnit: 'g', kcal: 140, carbG: 24, proteinG: 4, fatG: 3.5, fiberG: 1 },
  { name: 'White Bread', nameEs: 'Pan Blanco', category: 'grains', regionTags: ['usa', 'mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 79, carbG: 15, proteinG: 2.7, fatG: 1, fiberG: 0.6 },
  { name: 'Whole Wheat Bread', nameEs: 'Pan Integral', category: 'grains', regionTags: ['usa', 'mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 69, carbG: 12, proteinG: 3.6, fatG: 1.1, fiberG: 1.9 },
  { name: 'Oatmeal (dry)', nameEs: 'Avena (seca)', category: 'grains', regionTags: ['usa', 'mexico', 'latam'], servingSize: 40, servingUnit: 'g', kcal: 152, carbG: 27, proteinG: 5.3, fatG: 2.7, fiberG: 4 },
  { name: 'Pasta (cooked)', nameEs: 'Pasta (cocida)', category: 'grains', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 131, carbG: 25, proteinG: 5, fatG: 1.1, fiberG: 1.8 },
  { name: 'Quinoa (cooked)', nameEs: 'Quinoa (cocida)', category: 'grains', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 120, carbG: 21, proteinG: 4.4, fatG: 1.9, fiberG: 2.8 },
  { name: 'Sweet Potato', nameEs: 'Camote', category: 'carbs', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 86, carbG: 20, proteinG: 1.6, fatG: 0.1, fiberG: 3 },
  { name: 'White Potato', nameEs: 'Papa Blanca', category: 'carbs', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 77, carbG: 17, proteinG: 2, fatG: 0.1, fiberG: 2.2 },
  { name: 'Corn (cooked)', nameEs: 'Elote (cocido)', category: 'carbs', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 96, carbG: 21, proteinG: 3.4, fatG: 1.5, fiberG: 2.4 },
  { name: 'Plantain', nameEs: 'Plátano Macho', category: 'carbs', regionTags: ['mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 122, carbG: 32, proteinG: 1.3, fatG: 0.4, fiberG: 2.3 },
  { name: 'Yuca/Cassava', nameEs: 'Yuca', category: 'carbs', regionTags: ['mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 160, carbG: 38, proteinG: 1.4, fatG: 0.3, fiberG: 1.8 },
  { name: 'Bolillo (Mexican Roll)', nameEs: 'Bolillo', category: 'grains', regionTags: ['mexico'], servingSize: 70, servingUnit: 'g', kcal: 180, carbG: 36, proteinG: 6, fatG: 1, fiberG: 1.5 },
  { name: 'Amaranth', nameEs: 'Amaranto', category: 'grains', regionTags: ['mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 371, carbG: 66, proteinG: 14, fatG: 7, fiberG: 6.7 },
  { name: 'Cornmeal (Masa Harina)', nameEs: 'Masa Harina', category: 'grains', regionTags: ['mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 109, carbG: 23, proteinG: 2.7, fatG: 1.1, fiberG: 2 },
  { name: 'Cereal (Corn Flakes)', nameEs: 'Cereal (Corn Flakes)', category: 'grains', regionTags: ['usa', 'mexico'], servingSize: 30, servingUnit: 'g', kcal: 113, carbG: 25, proteinG: 2, fatG: 0.4, fiberG: 0.9 },
  { name: 'Granola', nameEs: 'Granola', category: 'grains', regionTags: ['usa', 'mexico'], servingSize: 50, servingUnit: 'g', kcal: 230, carbG: 33, proteinG: 5, fatG: 9, fiberG: 3 },

  // FATS & OILS (15+ items)
  { name: 'Olive Oil', nameEs: 'Aceite de Oliva', category: 'fats', regionTags: ['usa', 'mexico', 'latam'], servingSize: 15, servingUnit: 'ml', kcal: 119, carbG: 0, proteinG: 0, fatG: 14, fiberG: 0 },
  { name: 'Avocado', nameEs: 'Aguacate', category: 'fats', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 160, carbG: 9, proteinG: 2, fatG: 15, fiberG: 7 },
  { name: 'Almonds', nameEs: 'Almendras', category: 'fats', regionTags: ['usa', 'mexico'], servingSize: 30, servingUnit: 'g', kcal: 173, carbG: 6, proteinG: 6, fatG: 15, fiberG: 3.5 },
  { name: 'Walnuts', nameEs: 'Nueces', category: 'fats', regionTags: ['usa', 'mexico'], servingSize: 30, servingUnit: 'g', kcal: 196, carbG: 4, proteinG: 4.6, fatG: 20, fiberG: 2 },
  { name: 'Peanuts', nameEs: 'Cacahuates', category: 'fats', regionTags: ['usa', 'mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 170, carbG: 5, proteinG: 7, fatG: 14, fiberG: 2.5 },
  { name: 'Peanut Butter', nameEs: 'Crema de Cacahuate', category: 'fats', regionTags: ['usa', 'mexico'], servingSize: 32, servingUnit: 'g', kcal: 191, carbG: 7, proteinG: 7, fatG: 16, fiberG: 1.6 },
  { name: 'Chia Seeds', nameEs: 'Semillas de Chía', category: 'fats', regionTags: ['usa', 'mexico', 'latam'], servingSize: 15, servingUnit: 'g', kcal: 73, carbG: 6, proteinG: 2.5, fatG: 5, fiberG: 5 },
  { name: 'Flax Seeds', nameEs: 'Semillas de Linaza', category: 'fats', regionTags: ['usa', 'mexico', 'latam'], servingSize: 15, servingUnit: 'g', kcal: 80, carbG: 4, proteinG: 2.7, fatG: 6, fiberG: 4 },
  { name: 'Sunflower Seeds', nameEs: 'Semillas de Girasol', category: 'fats', regionTags: ['usa', 'mexico'], servingSize: 30, servingUnit: 'g', kcal: 175, carbG: 6, proteinG: 6, fatG: 15, fiberG: 2.5 },
  { name: 'Coconut Oil', nameEs: 'Aceite de Coco', category: 'fats', regionTags: ['usa', 'mexico', 'latam'], servingSize: 15, servingUnit: 'ml', kcal: 121, carbG: 0, proteinG: 0, fatG: 14, fiberG: 0 },
  { name: 'Canola Oil', nameEs: 'Aceite de Canola', category: 'fats', regionTags: ['usa', 'mexico'], servingSize: 15, servingUnit: 'ml', kcal: 124, carbG: 0, proteinG: 0, fatG: 14, fiberG: 0 },
  { name: 'Butter', nameEs: 'Mantequilla', category: 'fats', regionTags: ['usa', 'mexico', 'latam'], servingSize: 14, servingUnit: 'g', kcal: 102, carbG: 0, proteinG: 0.1, fatG: 12, fiberG: 0 },
  { name: 'Mayonnaise', nameEs: 'Mayonesa', category: 'fats', regionTags: ['usa', 'mexico', 'latam'], servingSize: 15, servingUnit: 'g', kcal: 94, carbG: 0.1, proteinG: 0.1, fatG: 10, fiberG: 0 },
  { name: 'Cream Cheese', nameEs: 'Queso Crema', category: 'fats', regionTags: ['usa', 'mexico'], servingSize: 30, servingUnit: 'g', kcal: 99, carbG: 1.6, proteinG: 1.7, fatG: 10, fiberG: 0 },
  { name: 'Pepitas (Pumpkin Seeds)', nameEs: 'Pepitas de Calabaza', category: 'fats', regionTags: ['mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 170, carbG: 4, proteinG: 9, fatG: 14, fiberG: 1.7 },

  // VEGETABLES (30+ items)
  { name: 'Tomato', nameEs: 'Jitomate', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 18, carbG: 3.9, proteinG: 0.9, fatG: 0.2, fiberG: 1.2 },
  { name: 'Onion', nameEs: 'Cebolla', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 40, carbG: 9, proteinG: 1.1, fatG: 0.1, fiberG: 1.7 },
  { name: 'Bell Pepper', nameEs: 'Pimiento', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 26, carbG: 6, proteinG: 1, fatG: 0.3, fiberG: 2.1 },
  { name: 'Broccoli', nameEs: 'Brócoli', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 34, carbG: 7, proteinG: 2.8, fatG: 0.4, fiberG: 2.6 },
  { name: 'Spinach', nameEs: 'Espinaca', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 23, carbG: 3.6, proteinG: 2.9, fatG: 0.4, fiberG: 2.2 },
  { name: 'Lettuce (Romaine)', nameEs: 'Lechuga Romana', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 17, carbG: 3.3, proteinG: 1.2, fatG: 0.3, fiberG: 2.1 },
  { name: 'Carrot', nameEs: 'Zanahoria', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 41, carbG: 10, proteinG: 0.9, fatG: 0.2, fiberG: 2.8 },
  { name: 'Cucumber', nameEs: 'Pepino', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 15, carbG: 3.6, proteinG: 0.7, fatG: 0.1, fiberG: 0.5 },
  { name: 'Zucchini', nameEs: 'Calabacita', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 17, carbG: 3.1, proteinG: 1.2, fatG: 0.3, fiberG: 1 },
  { name: 'Cauliflower', nameEs: 'Coliflor', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 25, carbG: 5, proteinG: 1.9, fatG: 0.3, fiberG: 2 },
  { name: 'Jalapeño Pepper', nameEs: 'Chile Jalapeño', category: 'vegetables', regionTags: ['usa', 'mexico'], servingSize: 14, servingUnit: 'g', kcal: 4, carbG: 0.9, proteinG: 0.1, fatG: 0, fiberG: 0.4 },
  { name: 'Serrano Pepper', nameEs: 'Chile Serrano', category: 'vegetables', regionTags: ['mexico'], servingSize: 6, servingUnit: 'g', kcal: 2, carbG: 0.4, proteinG: 0.1, fatG: 0, fiberG: 0.2 },
  { name: 'Cilantro', nameEs: 'Cilantro', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 10, servingUnit: 'g', kcal: 2, carbG: 0.4, proteinG: 0.2, fatG: 0.1, fiberG: 0.3 },
  { name: 'Celery', nameEs: 'Apio', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 14, carbG: 3, proteinG: 0.7, fatG: 0.2, fiberG: 1.6 },
  { name: 'Green Beans', nameEs: 'Ejotes', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 31, carbG: 7, proteinG: 1.8, fatG: 0.1, fiberG: 3.4 },
  { name: 'Mushrooms', nameEs: 'Champiñones', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 22, carbG: 3.3, proteinG: 3.1, fatG: 0.3, fiberG: 1 },
  { name: 'Cabbage', nameEs: 'Repollo/Col', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 25, carbG: 6, proteinG: 1.3, fatG: 0.1, fiberG: 2.5 },
  { name: 'Garlic', nameEs: 'Ajo', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 3, servingUnit: 'g', kcal: 4, carbG: 1, proteinG: 0.2, fatG: 0, fiberG: 0.1 },
  { name: 'Asparagus', nameEs: 'Espárragos', category: 'vegetables', regionTags: ['usa', 'mexico'], servingSize: 100, servingUnit: 'g', kcal: 20, carbG: 3.9, proteinG: 2.2, fatG: 0.1, fiberG: 2.1 },
  { name: 'Kale', nameEs: 'Col Rizada/Kale', category: 'vegetables', regionTags: ['usa', 'mexico'], servingSize: 100, servingUnit: 'g', kcal: 49, carbG: 9, proteinG: 4.3, fatG: 0.9, fiberG: 3.6 },
  { name: 'Chayote', nameEs: 'Chayote', category: 'vegetables', regionTags: ['mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 19, carbG: 4.5, proteinG: 0.8, fatG: 0.1, fiberG: 1.7 },
  { name: 'Nopales (Cactus Pads)', nameEs: 'Nopales', category: 'vegetables', regionTags: ['mexico'], servingSize: 100, servingUnit: 'g', kcal: 16, carbG: 3.3, proteinG: 1.3, fatG: 0.1, fiberG: 2.2 },
  { name: 'Radish', nameEs: 'Rábano', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 16, carbG: 3.4, proteinG: 0.7, fatG: 0.1, fiberG: 1.6 },
  { name: 'Beets', nameEs: 'Betabel', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 43, carbG: 10, proteinG: 1.6, fatG: 0.2, fiberG: 2.8 },
  { name: 'Eggplant', nameEs: 'Berenjena', category: 'vegetables', regionTags: ['usa', 'mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 25, carbG: 6, proteinG: 1, fatG: 0.2, fiberG: 3 },
  { name: 'Poblano Pepper', nameEs: 'Chile Poblano', category: 'vegetables', regionTags: ['mexico'], servingSize: 75, servingUnit: 'g', kcal: 20, carbG: 4.5, proteinG: 1, fatG: 0.2, fiberG: 1.3 },
  { name: 'Tomatillo', nameEs: 'Tomate Verde', category: 'vegetables', regionTags: ['mexico'], servingSize: 100, servingUnit: 'g', kcal: 32, carbG: 6, proteinG: 1, fatG: 1, fiberG: 1.9 },

  // FRUITS (25+ items)
  { name: 'Banana', nameEs: 'Plátano', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 120, servingUnit: 'g', kcal: 105, carbG: 27, proteinG: 1.3, fatG: 0.4, fiberG: 3.1 },
  { name: 'Apple', nameEs: 'Manzana', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 180, servingUnit: 'g', kcal: 95, carbG: 25, proteinG: 0.5, fatG: 0.3, fiberG: 4.4 },
  { name: 'Orange', nameEs: 'Naranja', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 130, servingUnit: 'g', kcal: 62, carbG: 15, proteinG: 1.2, fatG: 0.2, fiberG: 3.1 },
  { name: 'Mango', nameEs: 'Mango', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 165, servingUnit: 'g', kcal: 99, carbG: 25, proteinG: 1.4, fatG: 0.6, fiberG: 2.6 },
  { name: 'Papaya', nameEs: 'Papaya', category: 'fruits', regionTags: ['mexico', 'latam'], servingSize: 145, servingUnit: 'g', kcal: 62, carbG: 16, proteinG: 0.7, fatG: 0.4, fiberG: 2.5 },
  { name: 'Strawberries', nameEs: 'Fresas', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 150, servingUnit: 'g', kcal: 48, carbG: 12, proteinG: 1, fatG: 0.5, fiberG: 3 },
  { name: 'Watermelon', nameEs: 'Sandía', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 150, servingUnit: 'g', kcal: 45, carbG: 11, proteinG: 0.9, fatG: 0.2, fiberG: 0.6 },
  { name: 'Pineapple', nameEs: 'Piña', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 165, servingUnit: 'g', kcal: 82, carbG: 22, proteinG: 0.9, fatG: 0.2, fiberG: 2.3 },
  { name: 'Lime', nameEs: 'Limón', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 67, servingUnit: 'g', kcal: 20, carbG: 7, proteinG: 0.5, fatG: 0.1, fiberG: 1.9 },
  { name: 'Grapefruit', nameEs: 'Toronja', category: 'fruits', regionTags: ['usa', 'mexico'], servingSize: 230, servingUnit: 'g', kcal: 76, carbG: 19, proteinG: 1.5, fatG: 0.2, fiberG: 2.5 },
  { name: 'Grapes', nameEs: 'Uvas', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 150, servingUnit: 'g', kcal: 104, carbG: 27, proteinG: 1.1, fatG: 0.2, fiberG: 1.4 },
  { name: 'Cantaloupe', nameEs: 'Melón', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 150, servingUnit: 'g', kcal: 51, carbG: 12, proteinG: 1.3, fatG: 0.3, fiberG: 1.4 },
  { name: 'Guava', nameEs: 'Guayaba', category: 'fruits', regionTags: ['mexico', 'latam'], servingSize: 55, servingUnit: 'g', kcal: 37, carbG: 8, proteinG: 1.4, fatG: 0.5, fiberG: 3 },
  { name: 'Peach', nameEs: 'Durazno', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 150, servingUnit: 'g', kcal: 58, carbG: 14, proteinG: 1.4, fatG: 0.4, fiberG: 2.3 },
  { name: 'Pear', nameEs: 'Pera', category: 'fruits', regionTags: ['usa', 'mexico', 'latam'], servingSize: 180, servingUnit: 'g', kcal: 102, carbG: 27, proteinG: 0.6, fatG: 0.2, fiberG: 5.5 },
  { name: 'Blueberries', nameEs: 'Arándanos', category: 'fruits', regionTags: ['usa', 'mexico'], servingSize: 150, servingUnit: 'g', kcal: 85, carbG: 22, proteinG: 1.1, fatG: 0.5, fiberG: 3.6 },
  { name: 'Raspberries', nameEs: 'Frambuesas', category: 'fruits', regionTags: ['usa', 'mexico'], servingSize: 125, servingUnit: 'g', kcal: 65, carbG: 15, proteinG: 1.5, fatG: 0.8, fiberG: 8 },
  { name: 'Kiwi', nameEs: 'Kiwi', category: 'fruits', regionTags: ['usa', 'mexico'], servingSize: 69, servingUnit: 'g', kcal: 42, carbG: 10, proteinG: 0.8, fatG: 0.4, fiberG: 2.1 },
  { name: 'Passion Fruit', nameEs: 'Maracuyá', category: 'fruits', regionTags: ['mexico', 'latam'], servingSize: 18, servingUnit: 'g', kcal: 17, carbG: 4, proteinG: 0.4, fatG: 0.1, fiberG: 1.9 },
  { name: 'Pitaya (Dragon Fruit)', nameEs: 'Pitaya', category: 'fruits', regionTags: ['mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 50, carbG: 11, proteinG: 1.1, fatG: 0.4, fiberG: 3 },
  { name: 'Tamarind', nameEs: 'Tamarindo', category: 'fruits', regionTags: ['mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 72, carbG: 19, proteinG: 0.8, fatG: 0.2, fiberG: 1.6 },
  { name: 'Jicama', nameEs: 'Jícama', category: 'fruits', regionTags: ['mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 38, carbG: 9, proteinG: 0.7, fatG: 0.1, fiberG: 4.9 },
  { name: 'Mamey', nameEs: 'Mamey', category: 'fruits', regionTags: ['mexico', 'latam'], servingSize: 100, servingUnit: 'g', kcal: 124, carbG: 32, proteinG: 1.5, fatG: 0.5, fiberG: 5.4 },
  { name: 'Coconut (fresh)', nameEs: 'Coco (fresco)', category: 'fruits', regionTags: ['mexico', 'latam'], servingSize: 45, servingUnit: 'g', kcal: 159, carbG: 7, proteinG: 1.5, fatG: 15, fiberG: 4 },

  // DAIRY (15+ items)
  { name: 'Whole Milk', nameEs: 'Leche Entera', category: 'dairy', regionTags: ['usa', 'mexico', 'latam'], servingSize: 240, servingUnit: 'ml', kcal: 149, carbG: 12, proteinG: 8, fatG: 8, fiberG: 0 },
  { name: 'Skim Milk', nameEs: 'Leche Descremada', category: 'dairy', regionTags: ['usa', 'mexico', 'latam'], servingSize: 240, servingUnit: 'ml', kcal: 83, carbG: 12, proteinG: 8, fatG: 0.2, fiberG: 0 },
  { name: '2% Milk', nameEs: 'Leche 2%', category: 'dairy', regionTags: ['usa', 'mexico'], servingSize: 240, servingUnit: 'ml', kcal: 122, carbG: 12, proteinG: 8, fatG: 5, fiberG: 0 },
  { name: 'Cheddar Cheese', nameEs: 'Queso Cheddar', category: 'dairy', regionTags: ['usa', 'mexico'], servingSize: 30, servingUnit: 'g', kcal: 114, carbG: 0.4, proteinG: 7, fatG: 9.4, fiberG: 0 },
  { name: 'Panela Cheese', nameEs: 'Queso Panela', category: 'dairy', regionTags: ['mexico'], servingSize: 30, servingUnit: 'g', kcal: 67, carbG: 0.3, proteinG: 6, fatG: 4.5, fiberG: 0 },
  { name: 'Queso Fresco', nameEs: 'Queso Fresco', category: 'dairy', regionTags: ['mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 74, carbG: 0.6, proteinG: 5, fatG: 6, fiberG: 0 },
  { name: 'Oaxaca Cheese', nameEs: 'Queso Oaxaca', category: 'dairy', regionTags: ['mexico'], servingSize: 30, servingUnit: 'g', kcal: 85, carbG: 1, proteinG: 6, fatG: 7, fiberG: 0 },
  { name: 'Mozzarella Cheese', nameEs: 'Queso Mozzarella', category: 'dairy', regionTags: ['usa', 'mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 85, carbG: 0.6, proteinG: 6, fatG: 6.3, fiberG: 0 },
  { name: 'Plain Yogurt', nameEs: 'Yogurt Natural', category: 'dairy', regionTags: ['usa', 'mexico', 'latam'], servingSize: 150, servingUnit: 'g', kcal: 92, carbG: 7, proteinG: 5, fatG: 5, fiberG: 0 },
  { name: 'Low-fat Yogurt', nameEs: 'Yogurt Bajo en Grasa', category: 'dairy', regionTags: ['usa', 'mexico'], servingSize: 150, servingUnit: 'g', kcal: 75, carbG: 9, proteinG: 6, fatG: 1.5, fiberG: 0 },
  { name: 'Sour Cream', nameEs: 'Crema Agria', category: 'dairy', regionTags: ['usa', 'mexico', 'latam'], servingSize: 30, servingUnit: 'g', kcal: 59, carbG: 1.2, proteinG: 0.7, fatG: 5.8, fiberG: 0 },
  { name: 'Mexican Crema', nameEs: 'Crema Mexicana', category: 'dairy', regionTags: ['mexico'], servingSize: 30, servingUnit: 'g', kcal: 60, carbG: 1, proteinG: 0.6, fatG: 6, fiberG: 0 },
  { name: 'Evaporated Milk', nameEs: 'Leche Evaporada', category: 'dairy', regionTags: ['usa', 'mexico', 'latam'], servingSize: 30, servingUnit: 'ml', kcal: 40, carbG: 3, proteinG: 2, fatG: 2.4, fiberG: 0 },
  { name: 'Almond Milk', nameEs: 'Leche de Almendra', category: 'dairy', regionTags: ['usa', 'mexico'], servingSize: 240, servingUnit: 'ml', kcal: 39, carbG: 3.4, proteinG: 1, fatG: 2.5, fiberG: 0 },
  { name: 'Oat Milk', nameEs: 'Leche de Avena', category: 'dairy', regionTags: ['usa', 'mexico'], servingSize: 240, servingUnit: 'ml', kcal: 120, carbG: 16, proteinG: 3, fatG: 5, fiberG: 2 },

  // BEVERAGES (10+ items)
  { name: 'Orange Juice', nameEs: 'Jugo de Naranja', category: 'beverages', regionTags: ['usa', 'mexico', 'latam'], servingSize: 240, servingUnit: 'ml', kcal: 112, carbG: 26, proteinG: 1.7, fatG: 0.5, fiberG: 0.5 },
  { name: 'Coffee (black)', nameEs: 'Café Negro', category: 'beverages', regionTags: ['usa', 'mexico', 'latam'], servingSize: 240, servingUnit: 'ml', kcal: 2, carbG: 0, proteinG: 0.3, fatG: 0, fiberG: 0 },
  { name: 'Green Tea', nameEs: 'Té Verde', category: 'beverages', regionTags: ['usa', 'mexico'], servingSize: 240, servingUnit: 'ml', kcal: 2, carbG: 0, proteinG: 0, fatG: 0, fiberG: 0 },
  { name: 'Horchata', nameEs: 'Horchata', category: 'beverages', regionTags: ['mexico', 'latam'], servingSize: 240, servingUnit: 'ml', kcal: 150, carbG: 32, proteinG: 1, fatG: 2, fiberG: 0 },
  { name: 'Jamaica (Hibiscus Tea)', nameEs: 'Agua de Jamaica', category: 'beverages', regionTags: ['mexico'], servingSize: 240, servingUnit: 'ml', kcal: 80, carbG: 20, proteinG: 0, fatG: 0, fiberG: 0 },
  { name: 'Tamarind Water', nameEs: 'Agua de Tamarindo', category: 'beverages', regionTags: ['mexico', 'latam'], servingSize: 240, servingUnit: 'ml', kcal: 100, carbG: 25, proteinG: 0.5, fatG: 0, fiberG: 0.5 },
  { name: 'Coconut Water', nameEs: 'Agua de Coco', category: 'beverages', regionTags: ['mexico', 'latam'], servingSize: 240, servingUnit: 'ml', kcal: 46, carbG: 9, proteinG: 1.7, fatG: 0.5, fiberG: 2.6 },
  { name: 'Protein Shake', nameEs: 'Malteada de Proteína', category: 'beverages', regionTags: ['usa', 'mexico'], servingSize: 250, servingUnit: 'ml', kcal: 150, carbG: 6, proteinG: 25, fatG: 3, fiberG: 1 },

  // CONDIMENTS (10+ items)
  { name: 'Salsa Verde', nameEs: 'Salsa Verde', category: 'condiments', regionTags: ['mexico'], servingSize: 30, servingUnit: 'g', kcal: 10, carbG: 2, proteinG: 0.3, fatG: 0.1, fiberG: 0.5 },
  { name: 'Salsa Roja', nameEs: 'Salsa Roja', category: 'condiments', regionTags: ['mexico'], servingSize: 30, servingUnit: 'g', kcal: 12, carbG: 2.5, proteinG: 0.4, fatG: 0.1, fiberG: 0.6 },
  { name: 'Guacamole', nameEs: 'Guacamole', category: 'condiments', regionTags: ['usa', 'mexico'], servingSize: 30, servingUnit: 'g', kcal: 50, carbG: 3, proteinG: 0.6, fatG: 4.5, fiberG: 2 },
  { name: 'Pico de Gallo', nameEs: 'Pico de Gallo', category: 'condiments', regionTags: ['mexico'], servingSize: 30, servingUnit: 'g', kcal: 5, carbG: 1, proteinG: 0.2, fatG: 0, fiberG: 0.3 },
  { name: 'Honey', nameEs: 'Miel de Abeja', category: 'condiments', regionTags: ['usa', 'mexico', 'latam'], servingSize: 21, servingUnit: 'g', kcal: 64, carbG: 17, proteinG: 0.1, fatG: 0, fiberG: 0 },
  { name: 'Maple Syrup', nameEs: 'Jarabe de Maple', category: 'condiments', regionTags: ['usa'], servingSize: 30, servingUnit: 'ml', kcal: 78, carbG: 20, proteinG: 0, fatG: 0, fiberG: 0 },
  { name: 'Ketchup', nameEs: 'Salsa Cátsup', category: 'condiments', regionTags: ['usa', 'mexico', 'latam'], servingSize: 17, servingUnit: 'g', kcal: 19, carbG: 4.5, proteinG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Mustard', nameEs: 'Mostaza', category: 'condiments', regionTags: ['usa', 'mexico', 'latam'], servingSize: 5, servingUnit: 'g', kcal: 3, carbG: 0.3, proteinG: 0.2, fatG: 0.2, fiberG: 0.1 },
  { name: 'Soy Sauce', nameEs: 'Salsa de Soya', category: 'condiments', regionTags: ['usa', 'mexico'], servingSize: 15, servingUnit: 'ml', kcal: 9, carbG: 1, proteinG: 1.3, fatG: 0, fiberG: 0 },
  { name: 'Hot Sauce', nameEs: 'Salsa Picante', category: 'condiments', regionTags: ['usa', 'mexico'], servingSize: 5, servingUnit: 'ml', kcal: 1, carbG: 0.1, proteinG: 0, fatG: 0, fiberG: 0 },
];

// Nutrition rules based on PDF
const nutritionRules = [
  {
    ruleType: 'geb_formula',
    parameters: {
      name: 'Harris-Benedict Revised',
      male: {
        '19-30': { weightCoef: 15.057, heightCoef: 1.0004, constant: 705.8 },
        '31-60': { weightCoef: 11.472, heightCoef: 0.7739, constant: 654.2 },
        '>60': { weightCoef: 11.711, heightCoef: 0.6176, constant: 587.7 },
      },
      female: {
        '19-30': { weightCoef: 14.818, heightCoef: 0.4868, constant: 244.5 },
        '31-60': { weightCoef: 8.126, heightCoef: 0.4356, constant: 585.5 },
        '>60': { weightCoef: 9.082, heightCoef: 0.6329, constant: 439.2 },
      },
    },
    version: 'harris-benedict-v1.0',
  },
  {
    ruleType: 'eta_formula',
    parameters: {
      name: 'Thermic Effect of Food',
      defaultPercent: 0.10,
      minPercent: 0.06,
      maxPercent: 0.10,
      description: 'ETA = GEB × 10%',
    },
    version: 'eta-v1.0',
  },
  {
    ruleType: 'activity_factor',
    parameters: {
      sedentary: { factor: 1.2, description: 'Little or no exercise' },
      light: { factor: 1.375, description: 'Light exercise 1-3 days/week' },
      moderate: { factor: 1.55, description: 'Moderate exercise 3-5 days/week' },
      active: { factor: 1.725, description: 'Hard exercise 6-7 days/week' },
      very_active: { factor: 1.9, description: 'Very hard exercise, physical job' },
    },
    version: 'activity-v1.0',
  },
  {
    ruleType: 'macro_distribution',
    parameters: {
      carbs: { min: 55, max: 65, default: 60, kcalPerGram: 4 },
      protein: { min: 10, max: 15, default: 12, kcalPerGram: 4 },
      fat: { min: 25, max: 30, default: 28, kcalPerGram: 9 },
    },
    version: 'macros-v1.0',
  },
  {
    ruleType: 'fiber_recommendation',
    parameters: {
      male: { '19-50': 35, '>50': 30 },
      female: { '19-50': 30, '>50': 26 },
      generalMin: 25,
      generalMax: 30,
    },
    version: 'fiber-v1.0',
  },
];

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.trackingEntry.deleteMany();
  await prisma.mealItem.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.calculation.deleteMany();
  await prisma.equivalentsCatalog.deleteMany();
  await prisma.foodItem.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.pdfChunk.deleteMany();
  await prisma.nutritionRule.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  console.log('Creating test user...');
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  const testUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      passwordHash: hashedPassword,
      name: 'John Doe',
      languagePreference: 'en',
    },
  });

  // Create test profile
  console.log('Creating test profile...');
  await prisma.profile.create({
    data: {
      userId: testUser.id,
      age: 30,
      sex: 'male',
      weightKg: 75,
      heightCm: 175,
      activityLevel: 'moderate',
      goal: 'maintain',
      medicalFlags: [],
      dietaryPrefs: [],
    },
  });

  // Seed food items
  console.log(`Seeding ${foodItems.length} food items...`);
  for (const food of foodItems) {
    await prisma.foodItem.create({
      data: {
        name: food.name,
        nameEs: food.nameEs,
        regionTags: food.regionTags,
        category: food.category,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        kcal: food.kcal,
        carbG: food.carbG,
        proteinG: food.proteinG,
        fatG: food.fatG,
        fiberG: food.fiberG,
      },
    });
  }
  console.log('Food items seeded successfully!');

  // Seed nutrition rules
  console.log('Seeding nutrition rules...');
  for (const rule of nutritionRules) {
    await prisma.nutritionRule.create({
      data: {
        ruleType: rule.ruleType,
        parameters: rule.parameters,
        version: rule.version,
        isActive: true,
      },
    });
  }
  console.log('Nutrition rules seeded!');

  // Seed PDF chunks
  console.log('Seeding PDF chunks...');
  try {
    const chunksPath = '/home/ubuntu/nutrition_app/docs/pdf_chunks.json';
    const chunksData = fs.readFileSync(chunksPath, 'utf-8');
    const chunks = JSON.parse(chunksData);

    for (const chunk of chunks) {
      await prisma.pdfChunk.create({
        data: {
          chunkId: chunk.chunk_id,
          sectionTitle: chunk.section_title,
          pageNumber: chunk.page_number,
          text: chunk.text,
        },
      });
    }
    console.log(`${chunks.length} PDF chunks seeded!`);
  } catch (error) {
    console.error('Error seeding PDF chunks:', error);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
