# 🧊 FridgeAI - Tu Chef Inteligente

![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-blue?style=for-the-badge&logo=google&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🧠 ¿Qué es FridgeAI?

**FridgeAI** es una aplicación móvil desarrollada con **Expo (React Native)** que utiliza **Inteligencia Artificial (Gemini)** para generar recetas personalizadas a partir de los ingredientes que tienes disponibles en tu nevera.

La aplicación se apoya en **Supabase** para la gestión de datos y ofrece una experiencia rápida, intuitiva y pensada para el día a día.

---

## ✨ Características Principales

- 🥕 Introducción manual de ingredientes disponibles  
- 🤖 Generación instantánea de recetas mediante IA (Gemini)  
- 📱 Aplicación móvil multiplataforma (Android / iOS)  
- ⚡ Arranque rápido con Expo  
- 🔐 Configuración segura mediante variables de entorno  

---

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener instalado lo siguiente:

- **Node.js (Versión LTS)**  
  👉 https://nodejs.org/

- **Git**  
  Necesario para clonar el repositorio.

- **Expo Go**  
  Aplicación móvil disponible en App Store y Google Play.

---

## 🚀 Instalación y Configuración

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/ass190-ua/FridgeAI
cd FridgeAI
```

---

### 2️⃣ Instalar dependencias

```bash
npm install
```

---

### 3️⃣ Configurar Variables de Entorno (IMPORTANTE 🔐)

Por motivos de seguridad, las claves privadas no se incluyen en el repositorio.

1. Crea un archivo `.env` en la raíz del proyecto:

```text
.env
```

2. Añade el siguiente contenido:

```env
# Solicita la clave por privado
EXPO_PUBLIC_GEMINI_API_KEY=PEGAR_AQUI_LA_CLAVE
```

📌 **Nota:**  
Solicita la clave real (`AIza...`) por privado y reemplaza el valor indicado.

---

## 📱 Ejecutar la Aplicación

Inicia el servidor de desarrollo con Expo:

### ▶️ Modo normal

```bash
npx expo start
```

### ▶️ Modo normal (limpiando caché)

Recomendado si has tenido errores previos o cambios que no se reflejan:

```bash
npx expo start --clear
```

La opción `--clear` limpia la caché de Expo y evita problemas comunes al arrancar.

---

### 🌐 Modo túnel (máquina virtual o problemas de red)

Si estás usando una **máquina virtual**, Docker, o tu móvil no está en la misma red que el servidor, utiliza el modo **túnel**:

```bash
npx expo start --tunnel
```

Este modo crea un túnel seguro para que Expo Go pueda conectarse sin depender de la red local.

📌 **Nota:**  
 Si es la primera vez que usas --tunnel, la terminal te pedirá permiso para instalar @expo/ngrok. Dile que SÍ (Yes).

### 🌐 Modo túnel (limpiando caché)

Igual que antes pero ahora evitando errores de caché:

```bash
npx expo start --tunnel --clear
```

---

### 📷 Abrir la app en el móvil

Tras ejecutar el comando, se mostrará un **código QR** en la terminal:

- **Android:** Escanéalo desde la app **Expo Go**
- **iOS:** Escanéalo con la **cámara** y abre el enlace en **Expo Go**

---

## 🛠️ Estructura del Proyecto

```text
/app         → Pantallas y navegación (Expo Router)
/components  → Componentes reutilizables de UI
/lib         → Conexión con Supabase y Gemini AI
/assets      → Imágenes, iconos y fuentes
```

---

## 📦 Generar APK (Opcional)

Para generar una APK de Android:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

---

## 🧪 Tecnologías Utilizadas

- **Expo / React Native**
- **Gemini AI (Google)**
- **Supabase**
- **JavaScript / TypeScript**
- **EAS Build**
