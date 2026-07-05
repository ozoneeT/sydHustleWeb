// Shared catalogue of everyday hustles/tasks — used when a task poster picks
// what they need help with and when a hustler rates their own capability.

export const hustleTaskOptions = [
  { value: "mount_tv", label: "Mounting a TV or assembling furniture" },
  { value: "cooking", label: "Cooking or meal prep" },
  { value: "cleaning", label: "Cleaning or tidying a room/apartment" },
  { value: "packing", label: "Packing or unpacking help (moving in/out)" },
  { value: "laundry", label: "Washing and ironing clothes" },
  { value: "car_wash", label: "Washing a car" },
  { value: "errands", label: "Grocery shopping or running errands" },
  { value: "tutoring", label: "Tutoring or homework help" },
  { value: "typing", label: "Typing, data entry, or transcription" },
  { value: "graphic_design", label: "Graphic design or flyer design" },
  { value: "photography", label: "Photography or videography" },
  { value: "hair_styling", label: "Hair styling or braiding" },
  { value: "makeup", label: "Makeup application" },
  { value: "tech_support", label: "Phone or computer repair / tech support" },
  { value: "delivery", label: "Delivery of food, packages, or documents" },
  { value: "event_setup", label: "Event setup or decoration" },
  { value: "babysitting", label: "Babysitting or child-minding" },
  { value: "pet_sitting", label: "Pet sitting or dog walking" },
  { value: "minor_repairs", label: "Minor repairs or handyman tasks" },
  { value: "baking", label: "Baking or small food orders" },
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
