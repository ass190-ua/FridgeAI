const es = {
  common: {
    cancel: 'Cancelar',
    delete: 'Eliminar',
    close: 'Cerrar',
    save: 'Guardar',
    back: 'Volver',
  },

  tabs: {
    cook: 'Cocina',
    favorites: 'Favoritos',
    profile: 'Perfil',
  },

  home: {
    hello: 'Hola, Chef',
    fridgeQuestion: '¿Qué hay en tu nevera?',
    clearAll: 'Borrar todo',
    placeholder: 'Ej: 2 huevos, limón, arroz...',
    thinking: 'El chef está pensando...',
    ingredients: 'Ingredientes',
    steps: 'Pasos',
    newRecipe: 'Generar nueva receta',
    saved: 'Receta guardada en favoritos',
    saveError: 'No se pudo guardar',
    geminiError: 'Error conectando con el chef',
    generate: 'Generar',
    generateNew: 'Generar nueva receta',
    noIngredients: 'Escribe ingredientes primero',
  },

  favorites: {
    title: 'Mis Favoritos',
    emptyTitle: 'Tu recetario está vacío',
    emptySubtitle: 'Tus mejores creaciones aparecerán aquí.',
    savedOn: 'Guardado el',
    deleted: 'Receta eliminada',
    deleteError: 'No se pudo eliminar. Revisa tu conexión.',
    delete: 'Borrar',
    ingredientsTitle: 'Ingredientes',
    instructionsTitle: 'Instrucciones',
  },

  profile: {
    preferences: 'Preferencias',
    account: 'Cuenta',
    darkMode: 'Modo Oscuro',
    language: 'Idioma',
    logout: 'Cerrar Sesión',
    deletePhotoTitle: '¿Eliminar foto?',
    deletePhotoText: 'Volverás a ver tus iniciales en el perfil.',
    photoUpdated: 'Foto actualizada',
    photoUploadError: 'Error al subir foto',
    photoDeleted: 'Foto eliminada correctamente',
    photoDeleteError: 'No se pudo eliminar',
    spanish: 'Español',
    english: 'Inglés',

    favorites: 'Favoritos',
    level: 'Nivel',
    rank: 'Rango',

    rankNovice: 'Novato',
    rankApprentice: 'Aprendiz',
    rankCook: 'Cocinillas',
    rankChef: 'Chef',
    rankMaster: 'Maestro',

    logoutError: 'Error al salir',
    foodPrefsTitle: 'Preferencias alimentarias',
    diet: 'Dieta',
    allergies: 'Alergias',
    customAllergies: 'Alergias personalizadas',
    customAllergyPlaceholder: 'Añade una alergia (ej: kiwi)',
    none: 'Ninguna',
    prefsSaved: 'Preferencias guardadas',
    prefsSaveError: 'No se pudieron guardar las preferencias',
  },

  diet: {
    none: 'Sin preferencia',
    omnivore: 'Omnívora',
    vegetarian: 'Vegetariana',
    vegan: 'Vegana',
    pescatarian: 'Pescetariana',
    keto: 'Keto',
    gluten_free: 'Sin gluten',
    lactose_free: 'Sin lactosa',
  },

  allergen: {
    gluten: 'Gluten',
    dairy: 'Lácteos',
    eggs: 'Huevos',
    peanuts: 'Cacahuetes',
    tree_nuts: 'Frutos secos',
    soy: 'Soja',
    fish: 'Pescado',
    shellfish: 'Marisco',
    sesame: 'Sésamo',
  },

  login: {
    subtitle: 'Tu cocina inteligente',
    emailPlaceholder: 'Correo electrónico',
    passwordPlaceholder: 'Contraseña',
    confirmPasswordPlaceholder: 'Repite la contraseña',
    createAccount: 'Crear cuenta gratis',
    loginButton: 'Entrar en mi cocina',
    forgotPassword: '¿Olvidaste tu contraseña?',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    newHere: '¿Eres nuevo aquí?',
    signIn: 'Inicia Sesión',
    signUpNow: 'Regístrate ahora',

    errFillAll: 'Por favor completa todos los campos',
    errPasswordsNoMatch: 'Las contraseñas no coinciden',
    errPasswordShort: 'La contraseña es muy corta (mín. 6)',
    okAccountCreated: 'Cuenta creada. Revisa tu email.',
    errWriteEmailFirst: 'Escribe tu correo arriba primero',
    okCodeSent: 'Código enviado. Revisa tu correo.',
  },

  verifyCode: {
    title: 'Introduce el Código',
    subtitlePrefix: 'Copia el número que enviamos a',
    codePlaceholder: 'Código',
    verifyButton: 'Verificar Código',
    cancel: 'Cancelar',

    errCodeIncomplete: 'El código parece incompleto',
    errInvalidOrExpired: 'Código incorrecto o expirado',
    okVerified: 'Verificado',
  },

  changePassword: {
    title: 'Nueva Contraseña',
    subtitle: 'Acceso verificado. Crea tu nueva clave.',
    passwordPlaceholder: 'Nueva contraseña',
    saveAndEnter: 'Guardar y Entrar',

    errMinLength: 'La contraseña debe tener mín. 6 caracteres',
    okUpdated: 'Contraseña actualizada',
  },

  modal: {
    title: 'Esto es un modal',
    goHome: 'Ir a la pantalla principal',
  },
};

export default es;
