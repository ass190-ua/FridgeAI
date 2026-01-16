import { User } from "@supabase/supabase-js";
import { UserPreferences } from "./userPreferences";

// API KEY de Google
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Función de diagnóstico para ver qué modelos ve tu clave
export const listarModelosDisponibles = async () => {
  try {
    console.log("🔍 Buscando modelos disponibles...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ Error de Google:", data.error.message);
      return [];
    }

    // Filtramos solo los que sirven para generar contenido (generateContent)
    const modelosUtiles = data.models
      .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m: any) => m.name);

    console.log("✅ Modelos disponibles para ti:", modelosUtiles);
    return modelosUtiles;
  } catch (error) {
    console.error("❌ Error de red listando modelos:", error);
    return [];
  }
};

// Función principal para generar receta (usando FETCH directo para evitar errores de librería)
export const generarReceta = async (ingredientes: string, language: 'es' | 'en', prefs?: UserPreferences) => {
  try {
    // Usamos el modelo más estándar. Si falla, el diagnóstico nos dirá cuál usar.
    // OJO: La API pide el nombre completo, ej: "models/gemini-1.5-flash"
    const MODEL_NAME = "gemini-flash-latest";
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    const recipeLanguage = language === 'en' ? 'ENGLISH' : 'SPANISH';
    const diet = prefs?.diet && prefs.diet !== 'none' ? prefs.diet : null;
    const allergies = prefs?.allergies?.length ? prefs.allergies.join(', ') : null;
    const customAllergies = prefs?.customAllergies?.length ? prefs.customAllergies.join(', ') : null;

    const restrictionsBlock =
        diet || allergies || customAllergies
          ? `
      Restricciones obligatorias:
      ${diet ? `- Dieta: ${diet}` : ''}
      ${allergies ? `- Alérgenos prohibidos: ${allergies}` : ''}
      ${customAllergies ? `- Otros ingredientes prohibidos: ${customAllergies}` : ''}
      `.trim()
          : '';

    const prompt = `
      Eres un chef profesional.

      Dispones de estos ingredientes (son opciones disponibles, NO es obligatorio usar todos):
      ${ingredientes}

      ${restrictionsBlock}

      Reglas:
      - Respeta estrictamente la dieta y evita totalmente los alérgenos/ingredientes prohibidos.
      - Si algún ingrediente del usuario choca con las restricciones, simplemente no lo uses.
      - Prioriza recetas realistas y combinaciones comunes.
      - No incluyas ingredientes prohibidos ni trazas típicas (por ejemplo, si alergia a frutos secos, no uses pesto con nueces).
      - Responde SOLO con JSON, sin Markdown ni texto extra.

      La receta (valores del JSON) debe estar en ${recipeLanguage}.

      Responde SOLO con este JSON:
      {
        "nombre": "titulo",
        "descripcion": "texto",
        "tiempo": "tiempo",
        "dificultad": "nivel",
        "calorias": "kcal",
        "ingredientes_necesarios": ["a","b"],
        "pasos": ["1","2"]
      }
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.candidates[0].content.parts[0].text;
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error(" Error generando receta:", error);
    return null;
  }
};