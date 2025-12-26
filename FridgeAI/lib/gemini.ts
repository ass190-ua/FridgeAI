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
export const generarReceta = async (ingredientes: string) => {
  try {
    // Usamos el modelo más estándar. Si falla, el diagnóstico nos dirá cuál usar.
    // OJO: La API pide el nombre completo, ej: "models/gemini-1.5-flash"
    const MODEL_NAME = "gemini-flash-latest";
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    const prompt = `
      Eres un chef. Crea una receta con: ${ingredientes}.
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
    console.error("❌ Error generando receta:", error);
    return null;
  }
};