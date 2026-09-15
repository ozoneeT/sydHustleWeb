/**
 * X/Twitter gets the same card as everyone else.
 *
 * Re-exported rather than duplicated: the two conventions are separate
 * files in Next, but there is no reason for the artwork to differ, and two
 * copies is two things to remember to change.
 */
export { default, alt, size, contentType } from "./opengraph-image";
