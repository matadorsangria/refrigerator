import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState } from 'react-native';
import { Room, Ingredient, IngredientLog, RoomId, FridgeShapeId, ShoppingItem } from '../types';
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
  addIngredient: (name: string, roomId: RoomId, expiresAt?: string, purchasedAt?: string, storageDays?: number, quantity?: number, unit?: string, category?: string) => Promise<void>;
  updateIngredient: (id: string, name: string, roomId: RoomId, expiresAt?: string, purchasedAt?: string, storageDays?: number, quantity?: number, unit?: string, category?: string) => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;
  shoppingItems: ShoppingItem[];
  addShoppingItem: (name: string) => Promise<void>;
  removeShoppingItem: (id: string) => Promise<void>;
  // Changelog
  logs: IngredientLog[];
  markLogsRead: (roomId?: number) => Promise<void>;
  unreadByIngredientId: Record<string, 'add' | 'update'>;
  unreadRoomIds: Set<number>;
};

type DbRoom = { id: string; position: number; name: string; active: boolean; household_id: string };
type DbIngredient = { id: string; name: string; room_id: number; category: string; quantity: number | null; unit: string; expires_at: string | null; purchased_at: string | null; storage_days: number | null; created_at: string; household_id: string };
type DbShoppingItem = { id: string; name: string; household_id: string; created_at: string };
type DbIngredientLog = { id: string; household_id: string; ingredient_id: string | null; ingredient_name: string; room_id: number | null; action: 'add' | 'delete' | 'update'; quantity: number | null; unit: string | null; user_id: string; created_at: string };
type MemberRole = 'creator' | 'member';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRoom(r: DbRoom): Room {
  return { id: r.id, position: r.position, name: r.name, active: r.active };
}

function toIngredient(i: DbIngredient): Ingredient {
  return { id: i.id, name: i.name, roomId: i.room_id, category: i.category, quantity: i.quantity ?? undefined, unit: i.unit, purchasedAt: i.purchased_at ?? undefined, storageDays: i.storage_days ?? undefined, expiresAt: i.expires_at ?? undefined };
}

function toLog(l: DbIngredientLog): IngredientLog {
  return { id: l.id, ingredientId: l.ingredient_id, ingredientName: l.ingredient_name, roomId: l.room_id, action: l.action, quantity: l.quantity ?? undefined, unit: l.unit ?? undefined, userId: l.user_id, createdAt: l.created_at };
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
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [logs, setLogs] = useState<IngredientLog[]>([]);
  const [readLogIds, setReadLogIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const userIdRef = useRef<string | null>(null);

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

  const fetchShoppingItems = useCallback(async (hid: string) => {
    const { data, error } = await supabase.from('shopping_items').select('*').eq('household_id', hid).order('created_at');
    if (error) { console.error('[Supabase] fetchShoppingItems:', error.message); return; }
    setShoppingItems((data as DbShoppingItem[]).map(i => ({ id: i.id, name: i.name })));
  }, []);

  const fetchMemberCount = useCallback(async (hid: string) => {
    const { count, error } = await supabase.from('household_members').select('*', { count: 'exact', head: true }).eq('household_id', hid);
    if (error) { console.error('[Supabase] fetchMemberCount:', error.message); return; }
    setMemberCount(count ?? 0);
  }, []);

  const fetchLogs = useCallback(async (hid: string) => {
    const { data, error } = await supabase.from('ingredient_logs').select('*').eq('household_id', hid).order('created_at', { ascending: false }).limit(200);
    if (error) { console.error('[Supabase] fetchLogs:', error.message); return; }
    setLogs((data as DbIngredientLog[]).map(toLog));
  }, []);

  const fetchReadLogIds = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from('ingredient_log_reads').select('log_id').eq('user_id', uid);
    if (error) { console.error('[Supabase] fetchReadLogIds:', error.message); return; }
    setReadLogIds(new Set((data ?? []).map((r: { log_id: string }) => r.log_id)));
  }, []);

  // ── realtime subscription ──────────────────────────────────────────────────

  const subscribeRealtime = useCallback((hid: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`household-${hid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `household_id=eq.${hid}` }, () => fetchRooms(hid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients', filter: `household_id=eq.${hid}` }, () => fetchIngredients(hid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'household_members', filter: `household_id=eq.${hid}` }, () => fetchMemberCount(hid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items', filter: `household_id=eq.${hid}` }, () => fetchShoppingItems(hid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredient_logs', filter: `household_id=eq.${hid}` }, () => fetchLogs(hid))
      .subscribe((status) => console.log('[Supabase] Realtime:', status));

    channelRef.current = channel;
  }, [fetchRooms, fetchIngredients, fetchMemberCount, fetchShoppingItems, fetchLogs]);

  // ── init ──────────────────────────────────────────────────────────────────

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
      userIdRef.current = uid;

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
        await Promise.all([fetchRooms(hid), fetchIngredients(hid), fetchMemberCount(hid), fetchShoppingItems(hid), fetchLogs(hid), fetchReadLogIds(uid)]);
        if (!cancelled) subscribeRealtime(hid);
      }

      if (!cancelled) setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, [fetchRooms, fetchIngredients, fetchMemberCount, subscribeRealtime, fetchLogs, fetchReadLogIds]);

  // ── foreground 復帰時にデータ再取得 ──────────────────────────────────────

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active' && householdId) {
        fetchRooms(householdId);
        fetchIngredients(householdId);
        fetchMemberCount(householdId);
        fetchShoppingItems(householdId);
        fetchLogs(householdId);
        if (userIdRef.current) fetchReadLogIds(userIdRef.current);
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [householdId, fetchRooms, fetchIngredients, fetchMemberCount, fetchShoppingItems, fetchLogs, fetchReadLogIds]);

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
    await Promise.all([fetchRooms(hid), fetchIngredients(hid), fetchShoppingItems(hid), fetchLogs(hid)]);
    subscribeRealtime(hid);
  }, [fetchRooms, fetchIngredients, fetchShoppingItems, fetchLogs, subscribeRealtime]);

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
    const uid = userIdRef.current;
    await Promise.all([
      fetchRooms(hid), fetchIngredients(hid), fetchMemberCount(hid), fetchShoppingItems(hid), fetchLogs(hid),
      ...(uid ? [fetchReadLogIds(uid)] : []),
    ]);
    subscribeRealtime(hid);
  }, [fetchRooms, fetchIngredients, fetchMemberCount, fetchShoppingItems, fetchLogs, fetchReadLogIds, subscribeRealtime]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const updateRoomName = useCallback(async (position: RoomId, name: string) => {
    if (!householdId) return;
    setRooms(prev => prev.map(r => r.position === position ? { ...r, name } : r));
    const { error } = await supabase.from('rooms').update({ name }).eq('position', position).eq('household_id', householdId);
    if (error) { console.error('[Supabase] updateRoomName:', error.message); fetchRooms(householdId); }
  }, [householdId, fetchRooms]);

  const addIngredient = useCallback(async (name: string, roomId: RoomId, expiresAt?: string, purchasedAt?: string, storageDays?: number, quantity?: number, unit: string = '個', category: string = 'その他') => {
    if (!householdId || !userId) return;
    const id = Date.now().toString();
    setIngredients(prev => [...prev, { id, name, roomId, category, quantity, unit, purchasedAt, storageDays, expiresAt }]);
    const { error } = await supabase.from('ingredients').insert({ id, name, room_id: roomId, category, quantity: quantity ?? null, unit, expires_at: expiresAt ?? null, purchased_at: purchasedAt ?? null, storage_days: storageDays ?? null, household_id: householdId });
    if (error) { console.error('[Supabase] addIngredient:', error.message); fetchIngredients(householdId); return; }
    await supabase.from('ingredient_logs').insert({ household_id: householdId, ingredient_id: id, ingredient_name: name, room_id: roomId, action: 'add', quantity: quantity ?? null, unit, user_id: userId });
  }, [householdId, userId, fetchIngredients]);

  const updateIngredient = useCallback(async (id: string, name: string, roomId: RoomId, expiresAt?: string, purchasedAt?: string, storageDays?: number, quantity?: number, unit: string = '個', category: string = 'その他') => {
    if (!householdId || !userId) return;
    const existing = ingredients.find(i => i.id === id);
    const quantityChanged = existing?.quantity !== quantity;
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, name, roomId, category, quantity, unit, purchasedAt, storageDays, expiresAt } : i));
    const { error } = await supabase.from('ingredients').update({ name, room_id: roomId, category, quantity: quantity ?? null, unit, expires_at: expiresAt ?? null, purchased_at: purchasedAt ?? null, storage_days: storageDays ?? null }).eq('id', id).eq('household_id', householdId);
    if (error) { console.error('[Supabase] updateIngredient:', error.message); fetchIngredients(householdId); return; }
    if (quantityChanged) {
      await supabase.from('ingredient_logs').insert({ household_id: householdId, ingredient_id: id, ingredient_name: name, room_id: roomId, action: 'update', quantity: quantity ?? null, unit, user_id: userId });
    }
  }, [householdId, userId, ingredients, fetchIngredients]);

  const removeIngredient = useCallback(async (id: string) => {
    if (!householdId || !userId) return;
    const target = ingredients.find(i => i.id === id);
    setIngredients(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from('ingredients').delete().eq('id', id).eq('household_id', householdId);
    if (error) { console.error('[Supabase] removeIngredient:', error.message); fetchIngredients(householdId); return; }
    if (target) {
      await supabase.from('ingredient_logs').insert({ household_id: householdId, ingredient_id: id, ingredient_name: target.name, room_id: target.roomId, action: 'delete', user_id: userId });
    }
  }, [householdId, userId, ingredients, fetchIngredients]);

  const addShoppingItem = useCallback(async (name: string) => {
    if (!householdId) return;
    const id = Date.now().toString();
    setShoppingItems(prev => [...prev, { id, name }]);
    const { error } = await supabase.from('shopping_items').insert({ id, name, household_id: householdId });
    if (error) { console.error('[Supabase] addShoppingItem:', error.message); fetchShoppingItems(householdId); }
  }, [householdId, fetchShoppingItems]);

  const removeShoppingItem = useCallback(async (id: string) => {
    if (!householdId) return;
    setShoppingItems(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from('shopping_items').delete().eq('id', id).eq('household_id', householdId);
    if (error) { console.error('[Supabase] removeShoppingItem:', error.message); fetchShoppingItems(householdId); }
  }, [householdId, fetchShoppingItems]);

  // ── changelog / badges ────────────────────────────────────────────────────

  const markLogsRead = useCallback(async (roomId?: number) => {
    if (!userId) return;
    const toRead = logs.filter(l =>
      l.userId !== userId &&
      !readLogIds.has(l.id) &&
      (roomId == null || l.roomId === roomId)
    );
    if (toRead.length === 0) return;
    const newIds = new Set([...readLogIds, ...toRead.map(l => l.id)]);
    setReadLogIds(newIds);
    await supabase.from('ingredient_log_reads').insert(toRead.map(l => ({ user_id: userId, log_id: l.id })));
  }, [userId, logs, readLogIds]);

  const unreadByIngredientId = useMemo((): Record<string, 'add' | 'update'> => {
    const result: Record<string, 'add' | 'update'> = {};
    for (const log of logs) {
      if (log.userId === userId) continue;
      if (readLogIds.has(log.id)) continue;
      if (!log.ingredientId) continue;
      if (log.action === 'add') {
        result[log.ingredientId] = 'add';
      } else if (log.action === 'update' && result[log.ingredientId] !== 'add') {
        result[log.ingredientId] = 'update';
      }
    }
    return result;
  }, [logs, userId, readLogIds]);

  const unreadRoomIds = useMemo((): Set<number> => {
    const ids = new Set<number>();
    for (const log of logs) {
      if (log.userId === userId) continue;
      if (readLogIds.has(log.id)) continue;
      if (log.roomId != null) ids.add(log.roomId);
    }
    return ids;
  }, [logs, userId, readLogIds]);

  return (
    <AppContext.Provider value={{
      userId, householdId, inviteCode, memberCount, memberRole, householdShape,
      createHousehold, joinHousehold,
      rooms, ingredients, loading,
      updateRoomName, addIngredient, updateIngredient, removeIngredient,
      shoppingItems, addShoppingItem, removeShoppingItem,
      logs, markLogsRead, unreadByIngredientId, unreadRoomIds,
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
