/** Géométrie de fond d'une ville, en [latitude, longitude]. */
export type CityGeo = {
  river: [number, number][][];
  parks: { name: string; ring: [number, number][] }[];
};
