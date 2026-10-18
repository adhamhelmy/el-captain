type Pickable = { id: string; sport: { id: string } };

/** The dashboard's "Picked for you" (as the web's): open sessions the member isn't booked on, favourite sports first. */
export function pickedForYou<S extends Pickable>(open: S[], booked: Pickable[], favouriteSportIds: string[], count = 3): S[] {
  const favs = new Set(favouriteSportIds);
  const ids = new Set(booked.map((s) => s.id));
  const choices = open.filter((s) => !ids.has(s.id));
  return [...choices.filter((s) => favs.has(s.sport.id)), ...choices.filter((s) => !favs.has(s.sport.id))].slice(0, count);
}
