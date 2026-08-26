import { Bit } from "./types";
/**
 * Small, generic, reusable helper functions.
 */

/**
 * Returns a new array with the element at `index` replaced by the result
 * of applying `f` to the existing element. Does not mutate `arr`.
 */
export const updateAt = <T>(
    arr: ReadonlyArray<T>,
    index: number,
    f: (value: T) => T,
): ReadonlyArray<T> => {
    if (index < 0 || index >= arr.length) {
        return arr;
    }

    return arr.map((value, i) => (i === index ? f(value) : value));
};

/**
 * Clamps `value` into the inclusive range [min, max].
 */
export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

export const bitsToNumber = (bits: ReadonlyArray<Bit>): number =>
    bits.reduce<number>((acc, bit) => acc * 2 + bit, 0);

