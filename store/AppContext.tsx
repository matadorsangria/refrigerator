import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Room, Ingredient, RoomId } from '../types';
import { supabase } from '../lib/supabase';

type AppContextType = {
  rooms: Room[];
  ingredients: Ingredient[];
  loading: boolean;
  updateRoomName: (id: RoomId, name: string) => Promise<void>;
  addIngredient: (name: string, roomId: RoomId, expiresAt?: string) => Promise<void>;
  updateIngredient: (id: string, name: string, roomId: RoomId, expiresAt?: string) => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

type DbRoom = { id: string; name: string; position: number };
type DbIngredient = { id: string; name: string; room_id: string; expires_at: string | null; created_at: string };

function toRoom(r: DbRoom): Room {
  return { id: r.id as RoomId, name: r.name };
}

function toIngredient(i: DbIngredient): Ingredient {
  return { id: i.id, name: i.name, roomId: i.room_id as RoomId, expiresAt: i.expires_at ?? undefined };
}

async function fetchRooms(): Promise<Room[]> {
  const { data, error } = await supabase.from('rooms').select('*').order('position');
  if (error) { console.error('[Supabase] fetchRooms error:', JSON.stringify(error)); return []; }
  return (data as DbRoom[]).map(toRoom);
}

async function fetchIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from('ingredients').select('*').order('created_at');
  if (error) { console.error('[Supabase] fetchIngredients error:', JSON.stringify(error)); return []; }
  return (data as DbIngredient[]).map(toIngredient);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchRooms(), fetchIngredients()]).then(([r, i]) => {
      if (cancelled) return;
      setRooms(r);
      setIngredients(i);
      setLoading(false);
    });

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms().then(r => { if (!cancelled) setRooms(r); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
        fetchIngredients().then(i => { if (!cancelled) setIngredients(i); });
      })
      .subscribe((status) => {
        console.log('[Supabase] Realtime status:', status);
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const updateRoomName = useCallback(async (id: RoomId, name: string) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, name } : r));
    const { error } = await supabase.from('rooms').update({ name }).eq('id', id);
    if (error) {
      console.error('[Supabase] updateRoomName error:', JSON.stringify(error));
      fetchRooms().then(setRooms);
    }
  }, []);

  const addIngredient = useCallback(async (name: string, roomId: RoomId, expiresAt?: string) => {
    const id = Date.now().toString();
    setIngredients(prev => [...prev, { id, name, roomId, expiresAt }]);
    const { error } = await supabase.from('ingredients').insert({
      id, name, room_id: roomId, expires_at: expiresAt ?? null,
    });
    if (error) {
      console.error('[Supabase] addIngredient error:', JSON.stringify(error));
      fetchIngredients().then(setIngredients);
    }
  }, []);

  const updateIngredient = useCallback(async (id: string, name: string, roomId: RoomId, expiresAt?: string) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, name, roomId, expiresAt } : i));
    const { error } = await supabase.from('ingredients').update({
      name, room_id: roomId, expires_at: expiresAt ?? null,
    }).eq('id', id);
    if (error) {
      console.error('[Supabase] updateIngredient error:', JSON.stringify(error));
      fetchIngredients().then(setIngredients);
    }
  }, []);

  const removeIngredient = useCallback(async (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) {
      console.error('[Supabase] removeIngredient error:', JSON.stringify(error));
      fetchIngredients().then(setIngredients);
    }
  }, []);

  return (
    <AppContext.Provider value={{ rooms, ingredients, loading, updateRoomName, addIngredient, updateIngredient, removeIngredient }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
