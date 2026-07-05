import "server-only";

import { randomInt } from "crypto";

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}
