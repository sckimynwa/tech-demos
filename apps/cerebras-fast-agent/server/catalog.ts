export type Restaurant = {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  price: string;
  rating: number;
  vibe: string;
  highlights: string[];
  slots: string[];
  availabilityLatencyMs: number;
  menuLatencyMs: number;
};

export const SATURDAY_LABEL = "Saturday Oct 10";

export const RESTAURANTS: Restaurant[] = [
  {
    id: "il-casaro",
    name: "Il Casaro Pizzeria",
    neighborhood: "SoMa",
    cuisine: "Italian",
    price: "$$",
    rating: 4.4,
    vibe: "Neapolitan pies, loud, walk-in energy",
    highlights: ["Margherita DOC", "Burrata + roasted peppers", "Affogato"],
    slots: ["6:00 PM", "7:45 PM", "9:15 PM"],
    availabilityLatencyMs: 480,
    menuLatencyMs: 310,
  },
  {
    id: "zero-zero",
    name: "Zero Zero",
    neighborhood: "SoMa",
    cuisine: "Italian",
    price: "$$",
    rating: 4.3,
    vibe: "California-Italian, good for groups",
    highlights: ["Chicory salad", "Salsiccia pizza", "Olive oil cake"],
    slots: ["5:30 PM", "8:30 PM"],
    availabilityLatencyMs: 610,
    menuLatencyMs: 340,
  },
  {
    id: "cotogna",
    name: "Cotogna",
    neighborhood: "Jackson Square",
    cuisine: "Italian",
    price: "$$$",
    rating: 4.7,
    vibe: "Wood-fired, special-occasion, 12 min from SoMa",
    highlights: ["Raviolo al uovo", "Spit-roasted pork", "Butterscotch budino"],
    slots: ["7:15 PM", "9:00 PM"],
    availabilityLatencyMs: 540,
    menuLatencyMs: 360,
  },
  {
    id: "flour-water",
    name: "Flour + Water",
    neighborhood: "Mission",
    cuisine: "Italian",
    price: "$$$",
    rating: 4.6,
    vibe: "Pasta temple, tight reservation book",
    highlights: ["Agnolotti", "Cacio e pepe", "Olive oil gelato"],
    slots: ["8:00 PM"],
    availabilityLatencyMs: 720,
    menuLatencyMs: 390,
  },
];

export function saturdayDateIso(): string {
  return "2026-10-10";
}

export function findRestaurant(id: string): Restaurant | undefined {
  return RESTAURANTS.find((restaurant) => restaurant.id === id);
}

export function searchRestaurants(input: {
  cuisine?: string;
  neighborhood?: string;
}): Restaurant[] {
  const cuisine = input.cuisine?.toLowerCase();
  const neighborhood = input.neighborhood?.toLowerCase();

  return RESTAURANTS.filter((restaurant) => {
    const cuisineOk = !cuisine || restaurant.cuisine.toLowerCase().includes(cuisine);
    const neighborhoodOk =
      !neighborhood ||
      restaurant.neighborhood.toLowerCase().includes(neighborhood) ||
      neighborhood.includes("soma") ||
      neighborhood.includes("south of market");
    return cuisineOk && neighborhoodOk;
  });
}
