import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://nqfgffehwkjqvknebfef.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZmdmZmVod2tqcXZrbmViZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTM3NDgsImV4cCI6MjA5ODA2OTc0OH0.x5Srj7TxzMJUtwb3kVspSQtRVSii65A7EpKuj4KfjUU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
