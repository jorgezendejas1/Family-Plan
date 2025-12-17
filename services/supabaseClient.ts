import { createClient } from '@supabase/supabase-js';

// INSTRUCCIONES PARA SUPABASE (SQL EDITOR)
/*
  Ejecuta este SQL en tu Dashboard de Supabase para crear las tablas necesarias.
  
  -- 1. SI YA TIENES LA TABLA CREADA Y FALTA LA CATEGORÍA, EJECUTA ESTO:
  alter table public.events add column if not exists category text;

  -- 2. Tablas completas (Si empiezas de cero)
  create table public.calendars (
    id text not null primary key, 
    created_at timestamptz default now(),
    label text not null,
    color text not null,
    visible boolean default true,
    is_remote boolean default false
  );

  create table public.events (
    id text not null primary key, 
    created_at timestamptz default now(),
    title text not null,
    description text,
    start_date timestamptz not null,
    end_date timestamptz not null,
    color text,
    location text,
    calendar_id text,
    recurrence text default 'none',
    is_birthday boolean default false,
    is_task boolean default false,
    is_completed boolean default false,
    is_important boolean default false,
    category text, -- ESTA ES LA COLUMNA IMPORTANTE
    reminder_minutes jsonb,
    deleted_at timestamptz,
    recurrence_ends timestamptz
  );

  create table public.settings (
    id uuid not null default gen_random_uuid() primary key,
    theme text default 'system',
    timezone_config jsonb default '{"primary": "local", "showSecondary": false, "secondary": "UTC"}',
    has_seen_tour boolean default false,
    metadata jsonb default '{}'
  );

  create table public.chat_history (
    id text not null primary key,
    created_at timestamptz default now(),
    role text not null,
    text text,
    image text,
    video text,
    event_draft jsonb,
    selected_calendar_id text,
    subject text
  );
  
  alter table public.calendars enable row level security;
  alter table public.events enable row level security;
  alter table public.settings enable row level security;
  alter table public.chat_history enable row level security;
  
  create policy "Public access calendars" on public.calendars for all using (true);
  create policy "Public access events" on public.events for all using (true);
  create policy "Public access settings" on public.settings for all using (true);
  create policy "Public access chat" on public.chat_history for all using (true);
*/

// --- CONFIGURACIÓN ---
// 1. URL del Proyecto (Proporcionada)
const PROJECT_URL = "https://sfgljehbhnumzewaaefj.supabase.co";

// 2. Anon Public Key (NECESARIA)
// Pega aquí tu clave 'anon public' que encontrarás en Supabase > Settings > API
const MANUAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZ2xqZWhiaG51bXpld2FhZWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTkxNDQsImV4cCI6MjA3NzI3NTE0NH0.GJIc94PyXfhrjw84k27IAHdlcu2rwnodSpxSB9R8z-4"; 

// Función ultra-segura para leer variables de entorno sin crashear
const getEnvVar = (key: string) => {
  try {
    // Intenta leer de import.meta.env (Vite) de forma segura
    if (typeof import.meta === 'object' && import.meta !== null) {
      const meta = import.meta as any;
      if (meta.env && typeof meta.env === 'object' && meta.env[key] !== undefined) {
        return meta.env[key];
      }
    }
  } catch (e) {
    // Ignorar errores de acceso
  }

  try {
    // Intenta leer de process.env (Node/Webpack) de forma segura
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return process.env[key];
    }
  } catch (e) {
    // Ignorar errores de acceso
  }
  
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || PROJECT_URL;
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || MANUAL_KEY;

// Inicializa el cliente solo si tenemos URL y Key
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

if (!supabase) {
  console.warn("Supabase no está configurado. Usando almacenamiento local. Agrega la ANON KEY en services/supabaseClient.ts para activar la nube.");
}