export type RoomId = number; // 1-based position (top to bottom)

export type Room = {
  id: string;       // UUID (DB PK)
  position: RoomId; // 上から順番の番号
  name: string;
  active: boolean;
};

export type Ingredient = {
  id: string;
  name: string;
  roomId: RoomId;
  quantity?: number;
  unit?: string;
  purchasedAt?: string;
  storageDays?: number;
  expiresAt?: string;
};

export type FridgeShapeId = string; // 'standard' | future shapes

export type ShoppingItem = {
  id: string;
  name: string;
};

export type IngredientLog = {
  id: string;
  ingredientId: string | null;
  ingredientName: string;
  roomId: number | null;
  action: 'add' | 'delete' | 'update';
  quantity?: number;
  unit?: string;
  userId: string;
  createdAt: string;
};
