// Bornes larges des saisies : elles n'arrêtent que les fautes de frappe.
// ⚠️ SYNC : backend CreateDailyCaloriesRequest / MealsDto (@Max) — le serveur refuse au-delà.
export const MAX_MEAL_KCAL = 5_000;
export const MAX_BURNED_KCAL = 10_000;
export const MAX_STEPS = 100_000;
