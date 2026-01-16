import { supabase } from '@/lib/supabase';

export type Diet =
  | 'none'
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'gluten_free'
  | 'lactose_free';

export type Allergen =
  | 'gluten'
  | 'dairy'
  | 'eggs'
  | 'peanuts'
  | 'tree_nuts'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame';

export type UserPreferences = {
  diet: Diet;
  allergies: Allergen[];
  customAllergies: string[];
};

export const DEFAULT_PREFS: UserPreferences = {
  diet: 'none',
  allergies: [],
  customAllergies: [],
};

export async function getUserPreferences(): Promise<UserPreferences> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const user = userRes.user;
  if (!user) return DEFAULT_PREFS;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('diet, allergies, custom_allergies')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_PREFS;

  return {
    diet: (data.diet as Diet) || 'none',
    allergies: (data.allergies as Allergen[]) || [],
    customAllergies: (data.custom_allergies as string[]) || [],
  };
}

export async function upsertUserPreferences(prefs: UserPreferences): Promise<void> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const user = userRes.user;
  if (!user) return;

  const { error } = await supabase.from('user_preferences').upsert(
    {
      user_id: user.id,
      diet: prefs.diet,
      allergies: prefs.allergies,
      custom_allergies: prefs.customAllergies,
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}
