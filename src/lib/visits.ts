// src/lib/visits.ts
import { supabase } from './supabase';
import type { Visit, CreateVisitInput, VisitNote } from '../types';

/**
 * Create a new visit record
 */
export async function createVisit(input: CreateVisitInput): Promise<Visit> {
  const notes: VisitNote[] = [];

  // Add initial note if provided
  if (input.initial_note) {
    notes.push({
      timestamp: new Date().toISOString(),
      source: 'checkin',
      content: input.initial_note,
    });
  }

  const { data, error } = await supabase
    .from('visits')
    .insert({
      visitor_name: input.visitor_name || null,
      status: 'checking_in',
      notes: notes,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create visit: ${error.message}`);
  return data as Visit;
}

/**
 * Get visit by ID
 */
export async function getVisit(visitId: string): Promise<Visit | null> {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('id', visitId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get visit: ${error.message}`);
  }

  return data as Visit;
}

/**
 * Update visit status
 */
export async function updateVisitStatus(
  visitId: string,
  status: Visit['status']
): Promise<Visit> {
  const { data, error } = await supabase
    .from('visits')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', visitId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update visit: ${error.message}`);
  return data as Visit;
}

/**
 * Add note to visit
 */
export async function addVisitNote(
  visitId: string,
  source: VisitNote['source'],
  content: string
): Promise<Visit> {
  // First get current notes
  const visit = await getVisit(visitId);
  if (!visit) throw new Error('Visit not found');

  const newNote: VisitNote = {
    timestamp: new Date().toISOString(),
    source,
    content,
  };

  const updatedNotes = [...visit.notes, newNote];

  const { data, error } = await supabase
    .from('visits')
    .update({
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', visitId)
    .select()
    .single();

  if (error) throw new Error(`Failed to add note: ${error.message}`);
  return data as Visit;
}

/**
 * Get visit notes
 */
export async function getVisitNotes(visitId: string): Promise<VisitNote[]> {
  const visit = await getVisit(visitId);
  if (!visit) throw new Error('Visit not found');
  return visit.notes;
}
