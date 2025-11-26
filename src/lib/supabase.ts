// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper: Fetch all library items
export async function fetchLibraryItems() {
  const { data, error } = await supabase
    .from('library_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching library items:', error);
    throw error;
  }

  return data;
}

// Helper: Fetch single library item by ID
export async function fetchLibraryItem(id: string) {
  const { data, error } = await supabase
    .from('library_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching library item:', error);
    throw error;
  }

  return data;
}

// Helper: Get public URL for storage item
export function getStorageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper: List files in storage bucket
export async function listStorageFiles(bucket: string) {
  const { data, error } = await supabase.storage.from(bucket).list();

  if (error) {
    console.error('Error listing storage files:', error);
    throw error;
  }

  return data;
}

// Helper: Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('library_items')
      .select('id')
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
