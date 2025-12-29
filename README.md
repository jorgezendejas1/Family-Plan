
# 📱 Family Plan | Premium Family Command Center

**Family Plan** es la solución definitiva de organización para el hogar moderno. No es solo un calendario; es un ecosistema de productividad familiar que fusiona **Privacidad de Grado Militar (E2EE)**, **Inteligencia Artificial de Precisión** y un sistema de **Sincronización Multi-Cuenta** único en el mercado.

---

## 💎 Innovaciones Radicales

### 1. 💬 Chat Familiar FIFO 200 (Exclusivo)
Hemos reinventado la comunicación familiar para eliminar el ruido y fomentar la acción.
- **Lógica FIFO (First-In, First-Out):** El sistema mantiene estrictamente los últimos 200 mensajes en la base de datos de Supabase. Cuando llega el mensaje 201, el más antiguo se elimina permanentemente. Esto garantiza que el chat sea para coordinar el "ahora" y que la información importante se traslade al calendario.
- **Menciones Inteligentes (@):** Sistema de resaltado visual dinámico. Al mencionar a un miembro (ej. `@Mama`), el mensaje se etiqueta con su color de identidad familiar, facilitando la lectura rápida.
- **UI Optimista:** Los mensajes se renderizan instantáneamente en la interfaz antes de confirmarse en el servidor, eliminando cualquier sensación de lag.

### 2. 🌐 Multi-Sincronización Google Calendar
A diferencia de otras apps que solo permiten una cuenta, Family Plan permite una red de sincronización.
- **Sincronización por Miembro:** Cada "Miembro de la Familia" (Mama, Papa, Hijo, etc.) puede vincular su propia cuenta personal de Google de forma independiente.
- **Bidireccional Real:** Los eventos creados en Google aparecen en la vista familiar, y los eventos creados en Family Plan se inyectan automáticamente en el Google Calendar del miembro asignado.
- **Identificación Visual:** Los eventos remotos se marcan con el icono 🌐, manteniendo la claridad sobre el origen del dato.

### 3. 🛡️ Privacidad Radical (E2EE AES-256)
Privacidad absoluta mediante la **Web Crypto API**.
- **Cifrado en Cliente:** El `title`, `description` y `location` de cada evento se cifran con una llave derivada de la contraseña del usuario antes de salir del navegador.
- **Cero Conocimiento:** Ni el administrador de la base de datos ni los desarrolladores pueden leer tus planes. Solo los miembros autorizados de la cuenta familiar poseen la clave de descifrado.

### 4. 🤖 IA de Precisión (Gemini 3 Pro)
Un motor de agendamiento optimizado para la eficiencia.
- **Filtro de Intención:** La IA ha sido instruida para ignorar charlas triviales y centrarse exclusivamente en la extracción de eventos.
- **Borradores Interactivos:** En lugar de crear el evento directamente, la IA presenta una tarjeta de confirmación ("Borrador") para que el usuario valide los datos antes de agendar.
- **Comprensión Temporal:** Entiende lenguaje natural complejo como "Cena con los abuelos el tercer viernes de cada mes a las 8pm".

---

## 🚀 Funcionalidades Pro

- **Vistas Multimodales:** Mes (con previsualización por hover), Semana (con regla de tiempo), Día y Agenda cronológica de búsqueda rápida.
- **Gestión de Tareas:** Panel lateral independiente con sistema de importancia (Star), filtrado de completadas y selector de calendario de origen.
- **Gestión de Miembros:** Personalización total de nombres y paletas de colores premium (HEX personalizado).
- **Papelera Familiar:** Historial de borrados que permite recuperar eventos eliminados accidentalmente por cualquier miembro.
- **Exportación ICS:** Generación de archivos de calendario universal compatibles con Apple, Outlook y dispositivos Android.

---

## 💰 Modelo de Negocio (SaaS)

| Característica | Plan Gratis | Plan Basic | Plan PRO |
| :--- | :--- | :--- | :--- |
| **Tokens IA** | 10 / semana | 50 / semana | 125 / semana |
| **Miembros** | 1 | Hasta 20 | Ilimitados |
| **Cuentas Google** | 1 | Ilimitadas | Ilimitadas |
| **Publicidad** | Activa | Sin anuncios | Sin anuncios |
| **Soporte** | Comunitario | Prioritario | 24/7 VIP |

---

## 🏗️ Stack Tecnológico de Vanguardia

- **Frontend:** React 19 + TypeScript (Hooks avanzados y Context API).
- **Estilos:** Tailwind CSS con animaciones personalizadas de *Spring Physics*.
- **Backend/DB:** Supabase (PostgreSQL) con suscripciones en tiempo real para el Chat.
- **Inteligencia Artificial:** SDK `@google/genai` utilizando el modelo `gemini-3-pro-preview`.
- **Seguridad:** AES-GCM 256-bit mediante Web Crypto API nativa.
- **Cloud:** Preparado para despliegue escalable en Cloud Run / Vercel.

---

## 🛠️ Configuración de Desarrollo

1.  **Clonar repositorio:** `git clone https://github.com/tu-usuario/family-plan.git`
2.  **Instalar dependencias:** `npm install`
3.  **Configurar variables `.env`:**
    ```env
    API_KEY=tu_gemini_api_key
    VITE_SUPABASE_URL=tu_url_supabase
    VITE_SUPABASE_ANON_KEY=tu_anon_key_supabase
    VITE_GOOGLE_CLIENT_ID=tu_google_oauth_id
    ```
4.  **Iniciar entorno:** `npm run dev`

---

**Family Plan** - *Tu familia en perfecta sintonía.*
