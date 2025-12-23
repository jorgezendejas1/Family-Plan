
import { createClient } from '@supabase/supabase-js';

// INSTRUCCIONES PARA SUPABASE (SQL EDITOR)
/*
  Ejecuta este SQL actualizado para habilitar el multi-tenancy:
  
  -- 1. Tablas con user_id
  create table public.calendars (
    id text not null primary key, 
    user_id text not null, -- Columna de aislación
    created_at timestamptz default now(),
    label text not null,
    color text not null,
    visible boolean default true,
    is_remote boolean default false
  );

  create table public.events (
    id text not null primary key, 
    user_id text not null, -- Columna de aislación
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
    category text,
    reminder_minutes jsonb,
    deleted_at timestamptz,
    recurrence_ends timestamptz,
    created_by_bot boolean default false
  );

  create table public.settings (
    user_id text not null primary key, -- El user_id es la PK aquí
    theme text default 'system',
    timezone_config jsonb default '{"primary": "local", "showSecondary": false, "secondary": "UTC"}',
    has_seen_tour boolean default false,
    metadata jsonb default '{}'
  );

  create table public.chat_history (
    id text not null primary key,
    user_id text not null, -- Columna de aislación
    created_at timestamptz default now(),
    role text not null,
    text text,
    image text,
    video text,
    event_draft jsonb,
    selected_calendar_id text,
    subject text
  );
  
  -- 2. Seguridad de Fila (RLS) - Vital para SaaS
  alter table public.calendars enable row level security;
  alter table public.events enable row level security;
  alter table public.settings enable row level security;
  alter table public.chat_history enable row level security;
  
  -- Políticas: Cada usuario solo puede ver/editar lo suyo
  create policy "Users can see their own calendars" on public.calendars for all using (true); -- Simplificado para demo, en prod usar auth.uid()
  create policy "Users can see their own events" on public.events for all using (true);
  create policy "Users can see their own settings" on public.settings for all using (true);
  create policy "Users can see their own chat" on public.chat_history for all using (true);
*/

const PROJECT_URL = "https://sfgljehbhnumzewaaefj.supabase.co";
const MANUAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZ2xqZWhiaG51bXpld2FhZWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTkxNDQsImV4cCI6MjA3NzI3NTE0NH0.GJIc94PyXfhrjw84k27IAHdlcu2rwnodSpxSB9R8z-4"; 

const getEnvVar = (key: string) => {
  try {
    if (typeof import.meta === 'object' && import.meta !== null) {
      const meta = import.meta as any;
      if (meta.env && typeof meta.env === 'object' && meta.env[key] !== undefined) {
        return meta.env[key];
      }
    }
  } catch (e) {}
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || PROJECT_URL;
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || MANUAL_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
