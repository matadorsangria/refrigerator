import React, { createContext, useContext, useState } from 'react';
import { Room, Ingredient, RoomId } from '../types';

const INITIAL_ROOMS: Room[] = [
  { id: 'fridge', name: '冷蔵室' },
  { id: 'vegetable', name: '野菜室' },
  { id: 'ice-maker', name: '製氷室' },
  { id: 'freezer-upper', name: '冷凍室1' },
  { id: 'freezer-lower', name: '冷凍室2' },
];

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: '1', name: '牛乳',           roomId: 'fridge',         expiresAt: '2026-06-22' },
  { id: '2', name: '卵',             roomId: 'fridge',         expiresAt: '2026-07-01' },
  { id: '3', name: 'レタス',         roomId: 'vegetable',      expiresAt: '2026-06-20' },
  { id: '4', name: 'にんじん',       roomId: 'vegetable',      expiresAt: '2026-07-10' },
  { id: '5', name: 'アイスクリーム', roomId: 'freezer-lower'                            },
  { id: '6', name: '冷凍餃子',       roomId: 'freezer-upper',  expiresAt: '2027-03-31' },
];

type AppContextType = {
  rooms: Room[];
  ingredients: Ingredient[];
  updateRoomName: (id: RoomId, name: string) => void;
  addIngredient: (name: string, roomId: RoomId, expiresAt?: string) => void;
  updateIngredient: (id: string, name: string, roomId: RoomId, expiresAt?: string) => void;
  removeIngredient: (id: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);

  const updateRoomName = (id: RoomId, name: string) =>
    setRooms(prev => prev.map(r => (r.id === id ? { ...r, name } : r)));

  const addIngredient = (name: string, roomId: RoomId, expiresAt?: string) =>
    setIngredients(prev => [...prev, { id: Date.now().toString(), name, roomId, expiresAt }]);

  const updateIngredient = (id: string, name: string, roomId: RoomId, expiresAt?: string) =>
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, name, roomId, expiresAt } : i));

  const removeIngredient = (id: string) =>
    setIngredients(prev => prev.filter(i => i.id !== id));

  return (
    <AppContext.Provider value={{ rooms, ingredients, updateRoomName, addIngredient, updateIngredient, removeIngredient }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
