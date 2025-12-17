# Family Plan (React + Gemini AI)

Una aplicación de calendario moderna y responsiva construida con **React**, **Tailwind CSS** y potenciada por **Google Gemini AI**. Esta aplicación ofrece gestión de eventos local, persistencia de datos, múltiples vistas y un asistente inteligente capaz de crear eventos mediante texto, voz e imágenes.

## 🚀 Características Principales

*   **Vistas Múltiples:** Agenda, Día, Semana, Mes.
*   **Asistente IA (Gemini 3 Pro):**
    *   Creación de eventos mediante lenguaje natural ("Cena mañana a las 8").
    *   Reconocimiento de voz para dictado.
    *   Análisis de imágenes (volantes, capturas) para extraer eventos.
*   **Gestión Completa:** Eventos recurrentes, tareas, cumpleaños y notificaciones push.
*   **Diseño Responsivo:** Interfaz Mobile-First optimizada con Sidebar colapsable.
*   **Persistencia:** Todos los datos se guardan en el `localStorage` del navegador o Supabase (si está configurado).
*   **Papelera de Reciclaje:** Recuperación de eventos borrados accidentalmente.
*   **Importar/Exportar:** Soporte completo para archivos `.ics`.

## 🛠️ Tecnologías

*   **Frontend:** React 19, TypeScript, Vite.
*   **Estilos:** Tailwind CSS.
*   **Lógica de Fechas:** date-fns.
*   **Iconos:** Lucide React.
*   **Inteligencia Artificial:** Google GenAI SDK (`@google/genai`).

## 📋 Requisitos Previos

*   **Node.js:** Versión 18.0.0 o superior.
*   **Google AI Studio API Key:** Necesaria para las funciones de Chatbot e IA.

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/family-plan.git
cd family-plan
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Este proyecto requiere una API Key de Google Gemini para funcionar correctamente.

1.  Crea un archivo `.env` en la raíz del proyecto (basado en el ejemplo, si existe).
2.  Obtén tu clave en [Google AI Studio](https://aistudio.google.com/).
3.  Agrega la siguiente línea al archivo `.env`:

```env
# En Vite, usualmente se usa VITE_API_KEY, pero este proyecto 
# está configurado para reemplazar process.env.API_KEY durante el build.
API_KEY=tu_clave_api_aqui
```

> **Nota:** El código espera acceder a la clave mediante `process.env.API_KEY`. Asegúrate de que tu configuración de Vite (`vite.config.ts`) tenga el plugin `define` configurado para exponer esta variable, o usa `VITE_API_KEY` y actualiza las llamadas en `ChatBot.tsx` y `App.tsx`.

### 4. Ejecutar en Desarrollo

Inicia el servidor local:

```bash
npm run dev
```

La aplicación estará disponible típicamente en `http://localhost:5173`.

## 📦 Scripts Disponibles

*   `npm run dev`: Inicia el servidor de desarrollo con recarga en caliente (HMR).
*   `npm run build`: Compila el código TypeScript y genera los archivos estáticos optimizados para producción en la carpeta `dist`.
*   `npm run preview`: Sirve localmente la versión de producción construida para probar el rendimiento.
*   `npm run lint`: Ejecuta ESLint para encontrar problemas en el código.

## 📱 Guía de Uso Rápido

1.  **Crear Eventos:** Usa el botón "+" flotante (móvil) o el botón "Crear" en la barra lateral.
2.  **Usar la IA:** Haz clic en el botón ✨ (esquina inferior izquierda) para abrir el chat. Prueba subir una foto de una invitación o di: *"Programa una reunión de equipo el viernes a las 10am"*.
3.  **Vistas:** Cambia entre Mes/Semana/Día/Agenda usando el selector superior.
4.  **Datos:** Tus eventos persisten al recargar. Puedes exportar una copia de seguridad en `.ics` desde **Configuración > Importar/Exportar**.

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir qué te gustaría cambiar.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.