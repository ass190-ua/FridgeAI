import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Claves
const supabaseUrl = 'https://pdrkswhscaprqtqtqurs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcmtzd2hzY2FwcnF0cXRxdXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODgyNTYsImV4cCI6MjA4MjA2NDI1Nn0.7--Sqo3rIhfyxT4dALJ72Le403sJjsPbJDsuVR8lGTI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})