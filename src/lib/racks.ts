export const RACK_LOCATIONS = [
  "Rack A1 - Shelf 1",
  "Rack A1 - Shelf 2",
  "Rack A1 - Shelf 3",
  "Rack A2 - Shelf 1",
  "Rack A2 - Shelf 2",
  "Rack B1 - Shelf 1",
  "Rack B2 - Shelf 3",
  "Rack B3 - Shelf 4",
  "Fridge 1 - Shelf 1",
  "Fridge 2 - Shelf 1",
  "Cold Store - Shelf 1",
  "Vault - Shelf 1",
  "Counter 1 - Shelf 2",
  "Counter 2 - Shelf 1",
] as const;

export type RackLocation = (typeof RACK_LOCATIONS)[number];
