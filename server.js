
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080; // Cloud Run default port

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
// Coding Guideline: obtain apiKey exclusively from process.env.API_KEY
const API_KEY = process.env.API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !API_KEY) {
  console.warn("Missing environment variables. Check Cloud Run configuration.");
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');
// Coding Guideline: new GoogleGenAI({apiKey: process.env.API_KEY})
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- API ROUTES ---

app.post('/api/process-event', async (req, res) => {
  try {
    const { message, history, currentDate } = req.body;

    // 1. Fetch Future Events for Context
    const todayISO = new Date().toISOString();
    const { data: events, error } = await supabase
      .from('events')
      .select('title, start_date, end_date, location, category')
      .gte('end_date', todayISO);

    if (error) console.error("Supabase Error:", error);

    const eventsContext = events ? events.map(e => ({
      title: e.title,
      start: e.start_date,
      end: e.end_date,
      category: e.category
    })) : [];

    // 2. Build Gemini Prompt
    const createEventTool = {
      name: 'create_calendar_event',
      description: 'FINAL STEP ONLY. Create event draft.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          start: { type: Type.STRING, description: "ISO 8601" },
          end: { type: Type.STRING },
          description: { type: Type.STRING },
          location: { type: Type.STRING },
          calendarName: { type: Type.STRING },
          isBirthday: { type: Type.BOOLEAN },
          recurrence: { type: Type.STRING },
          reminderMinutes: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          conflict_detected: { type: Type.BOOLEAN },
          conflict_message: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: ['Escuela', 'Deporte', 'Trabajo', 'Salud', 'Social', 'Hogar', 'Otro']
          }
        },
        required: ['title', 'start', 'category', 'conflict_detected']
      }
    };

    const systemInstruction = `
      Eres Family Plan IA.
      **CONTEXTO:** ${JSON.stringify(eventsContext)}
      **REGLAS:**
      1. Detecta conflictos de horario (conflict_detected: true).
      2. Categoriza el evento.
      3. Fecha base: ${currentDate}.
    `;

    const geminiHistory = history
      .filter(m => (m.role === 'user' || m.role === 'model') && !m.eventDraft)
      .map(m => ({ role: m.role, parts: [{ text: m.text || '' }] }));
    
    // Update model to gemini-3-pro-preview for complex reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [...geminiHistory, { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction, tools: [{ functionDeclarations: [createEventTool] }] }
    });

    const toolCalls = response.functionCalls;
    const text = response.text;

    res.json({
      text,
      toolCalls: toolCalls ? toolCalls.map(tc => ({ name: tc.name, args: tc.args })) : null
    });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: "Error processing event." });
  }
});

// --- SERVE STATIC FRONTEND (Production) ---
// Serve static files from the 'dist' directory created by Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: return index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
