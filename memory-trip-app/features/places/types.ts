export type PlaceDTO = {
  id: string;
  tripId: string;
  name: string;
  address: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PlaceWithTrip = PlaceDTO & { tripTitle: string };
