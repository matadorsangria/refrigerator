export type RoomId =
  | 'fridge'
  | 'vegetable'
  | 'ice-maker'
  | 'freezer-upper'
  | 'freezer-lower';

export type Room = {
  id: string;    // UUID (DB PK)
  type: RoomId;  // 部屋の種類 ('fridge' | 'vegetable' | ...)
  name: string;
};

export type Ingredient = {
  id: string;
  name: string;
  roomId: RoomId;
  expiresAt?: string; // ISO 8601 date string (YYYY-MM-DD)
};
