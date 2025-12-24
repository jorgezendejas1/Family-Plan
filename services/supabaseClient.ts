
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURACIÓN DE SUPABASE - PROYECTO: FamilyPlan-SaaS
 * Project ID: byrlgugnfvkaafdozyru
 */

const PROJECT_URL = "https://byrlgugnfvkaafdozyru.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmxndWduZnZrYWFmZG96eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MzUxODYsImV4cCI6MjA4MjExMTE4Nn0.m8Y979f6U1N5jZ605XOdzHoiphDrL_Em8wo3VmtbF94"; 

const supabaseUrl = typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL 
  ? process.env.VITE_SUPABASE_URL 
  : PROJECT_URL;

const supabaseKey = typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY 
  ? process.env.VITE_SUPABASE_ANON_KEY 
  : ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
