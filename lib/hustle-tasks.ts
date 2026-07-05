// Shared catalogue of everyday hustles/tasks — used when a hustler rates
// their own capability (unskilled/day-to-day tasks only; skilled hustlers
// list their skill separately via skillOptions).

import { skillOptions } from "@/lib/survey-options";

// Deliberately mixes everyday, low-friction tasks with more personal or
// socially "embarrassing" ones. Both are needed — the goal is to see which
// hustlers are only comfortable with the normal tasks versus who's genuinely
// willing to take on the ones people usually feel awkward asking a mate for.
// Each task is meant to be a distinct job — kept deliberately non-overlapping
// (e.g. running a general errand is not the same job as delivering food).
export const hustleTaskOptions = [
  // Normal / everyday
  { value: "hostel_packing", label: "Hostel packing (helping someone move rooms)" },
  { value: "errand_running", label: "General errand running (drop-offs, pickups, buying something nearby)" },
  { value: "food_delivery", label: "Food pickup/delivery from a restaurant or mama-put" },
  { value: "luggage_moving", label: "Carrying luggage to/from a park, station, or airport" },
  { value: "store_keeping", label: "Store/shop keeping (minding a stall or shop)" },
  { value: "cleaning", label: "House or room cleaning" },
  { value: "mount_tv", label: "Mounting a TV or assembling furniture" },
  { value: "car_wash", label: "Car washing" },
  { value: "babysitting", label: "Baby sitting / minding a younger sibling" },
  { value: "clothes_ironing", label: "Clothes ironing" },
  { value: "dish_washing", label: "Dish washing (after cooking or a party)" },
  { value: "cooking_help", label: "Cooking or food prep help" },
  { value: "grocery_shopping", label: "Grocery or market shopping on someone's behalf" },
  { value: "water_fetching", label: "Fetching and storing water" },
  { value: "generator_fueling", label: "Generator fueling and starting" },
  // More personal / potentially "embarrassing"
  { value: "laundry", label: "Laundry by hand, including underwear" },
  { value: "queue_standing", label: "Standing in a queue as a proxy (e.g. registration, banking)" },
  { value: "toilet_cleaning", label: "Cleaning a toilet or bathroom" },
  { value: "trash_disposal", label: "Carrying out and disposing of trash" },
  {
    value: "personal_shopping",
    label: "Buying private/intimate items on someone's behalf (e.g. sanitary pads, underwear)",
  },
] as const;

export type HustleTaskKey = (typeof hustleTaskOptions)[number]["value"];

export function allHustlesRated(
  capability: Partial<Record<string, "can_do" | "cannot_do">>,
  // Respondents can add their own hustles beyond the fixed catalogue (see
  // HustleCapabilityGrid) — those must be rated too before continuing.
  extraHustles: readonly string[] = []
) {
  return [...hustleTaskOptions.map((h) => h.value), ...extraHustles].every(
    (key) => capability[key] === "can_do" || capability[key] === "cannot_do"
  );
}

// What task posters (providers) might need help with spans both skilled and
// unskilled work — unlike the capability grid above, which is deliberately
// unskilled-only. 10 picks from each list, 20 total.
const SKILLED_TASK_VALUES = [
  "project_writing_research",
  "private_tutoring",
  "cv_resume_writing",
  "graphic_design",
  "phone_repair",
  "photography",
  "video_editing",
  "tailoring",
  "cooking_baking",
  "fitness_training",
] as const;

const UNSKILLED_TASK_VALUES = [
  "hostel_packing",
  "errand_running",
  "food_delivery",
  "laundry",
  "clothes_ironing",
  "store_keeping",
  "cleaning",
  "mount_tv",
  "car_wash",
  "babysitting",
] as const;

function pick<T extends { value: string }>(
  options: ReadonlyArray<T>,
  values: readonly string[]
): T[] {
  return values.map((v) => {
    const found = options.find((o) => o.value === v);
    if (!found) {
      throw new Error(`taskHelpOptions: "${v}" is not a valid option value.`);
    }
    return found;
  });
}

export const taskHelpOptions = [
  ...pick(skillOptions, SKILLED_TASK_VALUES),
  ...pick(hustleTaskOptions, UNSKILLED_TASK_VALUES),
];
