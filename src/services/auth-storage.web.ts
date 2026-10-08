// Web: tarayıcının kendi localStorage'ı (erişilemezse supabase-js bellek içi çalışır).
export const authStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
