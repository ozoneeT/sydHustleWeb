// Shared catalogue of everyday hustles/tasks — used when a task poster picks
// what they need help with and when a hustler rates their own capability.

export const hustleTaskOptions = [
  { value: "hostel_packing", label: "Hostel packing (help moving from one hostel to another)" },
  { value: "dispatch_errands", label: "Dispatch errand running" },
  { value: "food_delivery", label: "Food delivery (on foot)" },
  { value: "yam_pounding", label: "Yam pounding" },
  { value: "dish_washing", label: "Dish washing" },
  { value: "laundry", label: "Laundry (hand washing)" },
  { value: "clothes_ironing", label: "Clothes ironing" },
  { value: "cobweb_removal", label: "Cobweb removal" },
  { value: "bush_clearing", label: "Bush clearing" },
  { value: "queue_standing", label: "Queue standing (proxy)" },
  { value: "store_keeping", label: "Store keeping" },
  { value: "generator_fueling", label: "Generator fueling and starting" },
  { value: "flyer_distribution", label: "Flyer distribution" },
  { value: "cleaning", label: "House cleaning" },
  { value: "mount_tv", label: "Mounting a TV or assembling furniture" },
  { value: "car_wash", label: "Car washing" },
  { value: "babysitting", label: "Baby sitting" },
] as const;

export type HustleTaskKey = (typeof hustleTaskOptions)[number]["value"];

export function allHustlesRated(
  capability: Partial<Record<HustleTaskKey, "can_do" | "cannot_do">>
) {
  return hustleTaskOptions.every(
    (hustle) =>
      capability[hustle.value] === "can_do" ||
      capability[hustle.value] === "cannot_do"
  );
}
