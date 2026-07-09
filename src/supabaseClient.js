import { createClient } from '@supabase/supabase-js';

// Reemplaza esto con tus credenciales reales de Supabase
const supabaseUrl = 'https://amrnyqggbzyywyuzvnqz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcm55cWdnYnp5eXd5dXp2bnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDk4MjYsImV4cCI6MjA5OTE4NTgyNn0.fhermNf__-v1R1CvG4RQT1qSJ4ZdvcsmOMArH9hN0Dk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);