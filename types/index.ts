export type RoomId =
  | 'fridge'
  | 'vegetable'
  | 'ice-maker'
  | 'freezer-upper'
  | 'freezer-lower';

export type Room = {
  id: RoomId;
  name: string;
};

export type Ingredient = {
  id: string;
  name: string;
  roomId: RoomId;
  expiresAt?: string; // ISO 8601 date string (YYYY-MM-DD)
};
