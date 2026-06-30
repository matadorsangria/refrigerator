export type RoomId = number; // 1-based position (top to bottom)

export type Room = {
  id: string;       // UUID (DB PK)
  position: RoomId; // 上から順番の番号
  name: string;
};

export type Ingredient = {
  id: string;
  name: string;
  roomId: RoomId;
  expiresAt?: string;
};

export type FridgeShapeId = string; // 'standard' | future shapes

export type ShoppingItem = {
  id: string;
  name: string;
};
