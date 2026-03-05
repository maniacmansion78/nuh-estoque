import { addDays, subDays } from "date-fns";

export type Category = "Vegetais" | "Proteínas" | "Temperos" | "Bebidas";
export type Unit = "kg" | "L" | "un";
export type MovementType = "in" | "out";

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  min_quantity: number;
  price: number;
  expiry_date: string;
  supplier_id: string;
  alert_days: number; // dias antes do vencimento para alertar
}

export interface Movement {
  id: string;
  ingredient_id: string;
  type: MovementType;
  quantity: number;
  date: string;
  user_id: string;
  expiry_date?: string;
}

const today = new Date();

export const suppliers: Supplier[] = [
  { id: "s1", name: "Thai Fresh Imports", contact: "(11) 99999-0001", email: "contato@thaifresh.com" },
  { id: "s2", name: "Hortifruti Central", contact: "(11) 99999-0002", email: "vendas@horticentral.com" },
  { id: "s3", name: "Temperos do Oriente", contact: "(11) 99999-0003", email: "pedidos@temperosoriente.com" },
  { id: "s4", name: "Bebidas Premium", contact: "(11) 99999-0004", email: "contato@bebidaspremium.com" },
];

export const ingredients: Ingredient[] = [
  { id: "i1", name: "Leite de Coco", category: "Bebidas", quantity: 12, unit: "L", min_quantity: 5, price: 14.9, expiry_date: addDays(today, 15).toISOString(), supplier_id: "s1", alert_days: 7 },
  { id: "i2", name: "Manjericão Thai", category: "Vegetais", quantity: 2, unit: "kg", min_quantity: 3, price: 28.0, expiry_date: addDays(today, 2).toISOString(), supplier_id: "s2", alert_days: 3 },
  { id: "i3", name: "Camarão Fresco", category: "Proteínas", quantity: 1.5, unit: "kg", min_quantity: 5, price: 89.9, expiry_date: addDays(today, 1).toISOString(), supplier_id: "s1", alert_days: 2 },
  { id: "i4", name: "Pasta de Curry Vermelho", category: "Temperos", quantity: 8, unit: "un", min_quantity: 4, price: 22.5, expiry_date: addDays(today, 60).toISOString(), supplier_id: "s3", alert_days: 14 },
  { id: "i5", name: "Broto de Feijão", category: "Vegetais", quantity: 0.8, unit: "kg", min_quantity: 2, price: 12.0, expiry_date: addDays(today, 1).toISOString(), supplier_id: "s2", alert_days: 2 },
  { id: "i6", name: "Frango Desossado", category: "Proteínas", quantity: 10, unit: "kg", min_quantity: 8, price: 24.9, expiry_date: addDays(today, 4).toISOString(), supplier_id: "s1", alert_days: 3 },
  { id: "i7", name: "Molho de Peixe", category: "Temperos", quantity: 6, unit: "L", min_quantity: 3, price: 18.5, expiry_date: addDays(today, 90).toISOString(), supplier_id: "s3", alert_days: 30 },
  { id: "i8", name: "Água de Coco", category: "Bebidas", quantity: 20, unit: "un", min_quantity: 10, price: 6.9, expiry_date: addDays(today, 30).toISOString(), supplier_id: "s4", alert_days: 7 },
  { id: "i9", name: "Pimenta Bird's Eye", category: "Temperos", quantity: 0.3, unit: "kg", min_quantity: 1, price: 45.0, expiry_date: addDays(today, 10).toISOString(), supplier_id: "s3", alert_days: 5 },
  { id: "i10", name: "Tofu Firme", category: "Proteínas", quantity: 4, unit: "kg", min_quantity: 3, price: 15.0, expiry_date: addDays(today, 5).toISOString(), supplier_id: "s2", alert_days: 3 },
  { id: "i11", name: "Lemongrass", category: "Vegetais", quantity: 1, unit: "kg", min_quantity: 2, price: 32.0, expiry_date: addDays(today, 3).toISOString(), supplier_id: "s2", alert_days: 3 },
  { id: "i12", name: "Cerveja Thai Singha", category: "Bebidas", quantity: 48, unit: "un", min_quantity: 24, price: 12.5, expiry_date: addDays(today, 180).toISOString(), supplier_id: "s4", alert_days: 30 },
];

export const movements: Movement[] = [
  { id: "m1", ingredient_id: "i1", type: "in", quantity: 6, date: subDays(today, 1).toISOString(), user_id: "u1" },
  { id: "m2", ingredient_id: "i3", type: "out", quantity: 3, date: subDays(today, 1).toISOString(), user_id: "u2" },
  { id: "m3", ingredient_id: "i6", type: "in", quantity: 15, date: subDays(today, 2).toISOString(), user_id: "u1" },
  { id: "m4", ingredient_id: "i2", type: "out", quantity: 1, date: subDays(today, 2).toISOString(), user_id: "u2" },
  { id: "m5", ingredient_id: "i5", type: "out", quantity: 1.5, date: subDays(today, 3).toISOString(), user_id: "u2" },
  { id: "m6", ingredient_id: "i8", type: "in", quantity: 30, date: subDays(today, 3).toISOString(), user_id: "u1" },
  { id: "m7", ingredient_id: "i4", type: "out", quantity: 2, date: subDays(today, 4).toISOString(), user_id: "u2" },
  { id: "m8", ingredient_id: "i9", type: "in", quantity: 0.5, date: subDays(today, 5).toISOString(), user_id: "u1" },
];

export const weeklyConsumption = [
  { day: "Seg", entrada: 45, saida: 32 },
  { day: "Ter", entrada: 28, saida: 41 },
  { day: "Qua", entrada: 55, saida: 38 },
  { day: "Qui", entrada: 30, saida: 45 },
  { day: "Sex", entrada: 62, saida: 55 },
  { day: "Sáb", entrada: 40, saida: 68 },
  { day: "Dom", entrada: 20, saida: 35 },
];

export function getIngredientStatus(ingredient: Ingredient): "ok" | "warning" | "critical" {
  if (ingredient.quantity <= ingredient.min_quantity * 0.5) return "critical";
  if (ingredient.quantity <= ingredient.min_quantity) return "warning";
  return "ok";
}

export function getExpiryStatus(expiryDate: string, alertDays: number = 3): "ok" | "warning" | "critical" {
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= Math.ceil(alertDays * 0.3)) return "critical";
  if (days <= alertDays) return "warning";
  return "ok";
}

export function getDaysUntilExpiry(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
