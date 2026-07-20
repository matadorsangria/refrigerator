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
  purchasedAt?: string;
  storageDays?: number;
  expiresAt?: string;
};

export type FridgeShapeId = string; // 'standard' | future shapes

export type ShoppingItem = {
  id: string;
  name: string;
};
