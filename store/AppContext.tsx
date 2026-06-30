import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { Room, Ingredient, RoomId, FridgeShapeId } from '../types';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppContextType = {
  // Auth
  userId: string | null;
  // Household
  householdId: string | null;
  inviteCode: string | null;
  memberCount: number;
  memberRole: 'creator' | 'member' | null;
  householdShape: FridgeShapeId | null;
  createHousehold: () => Promise<void>;
  joinHousehold: (code: string) => Promise<void>;
  // Data
  rooms: Room[];
  ingredients: Ingredient[];
  loading: boolean;
  // CRUD
  updateRoomName: (position: RoomId, name: string) => Promise<void>;
  addIngredient: (name: string, roomId: RoomId, expiresAt?: string) => Promise<void>;
  updateIngredient: (id: string, name: string, roomId: RoomId, expiresAt?: string) => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;
};

type DbRoom = { id: string; position: number; name: string; household_id: string };
type DbIngredient = { id: string; name: string; room_id: number; expires_at: string | null; created_at: string; household_id: string };
type MemberRole = 'creator' | 'member';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRoom(r: DbRoom): Room {
  return { id: r.id, position: r.position, name: r.name };
}

function toIngredient(i: DbIngredient): Ingredient {
  return { id: i.id, name: i.name, roomId: i.room_id, expiresAt: i.expires_at ?? undefined };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [memberRole, setMemberRole] = useState<MemberRole | null>(null);
  const [householdShape, setHouseholdShape] = useState<FridgeShapeId | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // ── fetch helpers ──────────────────────────────────────────────────────────

  const fetchRooms = useCallback(async (hid: string) => {
    const { data, error } = await supabase.from('rooms').select('*').eq('household_id', hid).order('position');
    if (error) { console.error('[Supabase] fetchRooms:', error.message); return; }
    setRooms((data as DbRoom[]).map(toRoom));
  }, []);

  const fetchIngredients = useCallback(async (hid: string) => {
    const { data, error } = await supabase.from('ingredients').select('*').eq('household_id', hid).order('created_at');
    if (error) { console.error('[Supabase] fetchIngredients:', error.message); return; }
    setIngredients((data as DbIngredient[]).map(toIngredient));
  }, []);

  const fetchMemberCount = useCallback(async (hid: string) => {
    const { count, error } = await supabase.from('household_members').select('*', { count: 'exact', head: true }).eq('household_id', hid);
    if (error) { console.error('[Supabase] fetchMemberCount:', error.message); return; }
    setMemberCount(count ?? 0);
  }, []);

  // ── realtime subscription ──────────────────────────────────────────────────

  const subscribeRealtime = useCallback((hid: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`household-${hid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `household_id=eq.${hid}` }, () => fetchRooms(hid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients', filter: `household_id=eq.${hid}` }, () => fetchIngredients(hid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'household_members', filter: `household_id=eq.${hid}` }, () => fetchMemberCount(hid))
      .subscribe((status) => console.log('[Supabase] Realtime:', status));

    channelRef.current = channel;
  }, [fetchRooms, fetchIngredients, fetchMemberCount]);

  // ── init: sign in anonymously → load household ────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) { console.error('[Supabase] signInAnonymously:', error.message); setLoading(false); return; }
        session = data.session;
      }
      if (cancelled || !session) return;

      const uid = session.user.id;
      setUserId(uid);

      const { data: memberRows, error: memberErr } = await supabase
        .from('household_members')
        .select('household_id, role, households(invite_code, fridge_shape_id)')
        .eq('user_id', uid)
        .limit(1)
        .single();

      if (cancelled) return;

      if (!memberErr && memberRows) {
        const hid = memberRows.household_id as string;
        const h = memberRows.households as unknown as { invite_code: string; fridge_shape_id: string } | null;
        setHouseholdId(hid);
        setInviteCode(h?.invite_code ?? null);
        setHouseholdShape(h?.fridge_shape_id ?? 'standard');
        setMemberRole((memberRows.role as MemberRole) ?? 'member');
        await Promise.all([fetchRooms(hid), fetchIngredients(hid), fetchMemberCount(hid)]);
        if (!cancelled) subscribeRealtime(hid);
      }

      if (!cancelled) setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, [fetchRooms, fetchIngredients, fetchMemberCount, subscribeRealtime]);

  // ── foreground 復帰時にデータ再取得 ──────────────────────────────────────

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active' && householdId) {
        fetchRooms(householdId);
        fetchIngredients(householdId);
        fetchMemberCount(householdId);
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [householdId, fetchRooms, fetchIngredients, fetchMemberCount]);

  // ── household operations ───────────────────────────────────────────────────

  const createHousehold = useCallback(async () => {
    const { data: result, error } = await supabase.rpc('create_household');
    if (error || !result) { console.error('[Supabase] createHousehold:', error?.message); return; }
    const { id: hid, invite_code: code, shape_id } = result as { id: string; invite_code: string; shape_id: string };
    setHouseholdId(hid);
    setInviteCode(code);
    setHouseholdShape(shape_id ?? 'standard');
    setMemberCount(1);
    setMemberRole('creator');
    await Promise.all([fetchRooms(hid), fetchIngredients(hid)]);
    subscribeRealtime(hid);
  }, [fetchRooms, fetchIngredients, subscribeRealtime]);

  const joinHousehold = useCallback(async (code: string) => {
    const { data, error } = await supabase.rpc('join_household_by_code', { p_invite_code: code.toUpperCase() });
    if (error) throw new Error(error.message === 'invalid_invite_code' ? '招待コードが正しくありません' : error.message);

    const hid = data as string;
    const { data: h } = await supabase.from('households').select('invite_code, fridge_shape_id').eq('id', hid).single();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRooms([]);
    setIngredients([]);
    setHouseholdId(hid);
    const hData = h as { invite_code: string; fridge_shape_id: string } | null;
    setInviteCode(hData?.invite_code ?? code.toUpperCase());
    setHouseholdShape(hData?.fridge_shape_id ?? 'standard');
    setMemberRole('member');
    await Promise.all([fetchRooms(hid), fetchIngredients(hid), fetchMemberCount(hid)]);
    subscribeRealtime(hid);
  }, [fetchRooms, fetchIngredients, fetchMemberCount, subscribeRealtime]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const updateRoomName = useCallback(async (position: RoomId, name: string) => {
    if (!householdId) return;
    setRooms(prev => prev.map(r => r.position === position ? { ...r, name } : r));
    const { error } = await supabase.from('rooms').update({ name }).eq('position', position).eq('household_id', householdId);
    if (error) { console.error('[Supabase] updateRoomName:', error.message); fetchRooms(householdId); }
  }, [householdId, fetchRooms]);

  const addIngredient = useCallback(async (name: string, roomId: RoomId, expiresAt?: string) => {
    if (!householdId) return;
    const id = Date.now().toString();
    setIngredients(prev => [...prev, { id, name, roomId, expiresAt }]);
    const { error } = await supabase.from('ingredients').insert({ id, name, room_id: roomId, expires_at: expiresAt ?? null, household_id: householdId });
    if (error) { console.error('[Supabase] addIngredient:', error.message); fetchIngredients(householdId); }
  }, [householdId, fetchIngredients]);

  const updateIngredient = useCallback(async (id: string, name: string, roomId: RoomId, expiresAt?: string) => {
    if (!householdId) return;
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, name, roomId, expiresAt } : i));
    const { error } = await supabase.from('ingredients').update({ name, room_id: roomId, expires_at: expiresAt ?? null }).eq('id', id).eq('household_id', householdId);
    if (error) { console.error('[Supabase] updateIngredient:', error.message); fetchIngredients(householdId); }
  }, [householdId, fetchIngredients]);

  const removeIngredient = useCallback(async (id: string) => {
    if (!householdId) return;
    setIngredients(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from('ingredients').delete().eq('id', id).eq('household_id', householdId);
    if (error) { console.error('[Supabase] removeIngredient:', error.message); fetchIngredients(householdId); }
  }, [householdId, fetchIngredients]);

  return (
    <AppContext.Provider value={{
      userId, householdId, inviteCode, memberCount, memberRole, householdShape,
      createHousehold, joinHousehold,
      rooms, ingredients, loading,
      updateRoomName, addIngredient, updateIngredient, removeIngredient,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
