/**
 *
 * Core domain types shared across the game. No logic lives here —
 * only type/constant declarations.
 */

// men with hats

export const Viewport = {
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
} as const;

export const Target = {
    WIDTH: 32,
    HEIGHT: 16,
} as const;

export const Constants = {
    DIGIT_COUNT: 8,
    TICK_RATE_MS: 500, // TODO: tune once movement/speed-up is implemented
} as const;

export const ElementIds = {
    DIGIT_BANK_GROUP: "digit-bank-group",
    TARGETS_GROUP: "targets-group",
    SCORE_GROUP: "fb-score-group",
    GAME_OVER_GROUP: "fb-game-over-group",
} as const;

/** ---------- Core domain types ---------- */

/**
 * A single binary digit.
 */
export type Bit = 0 | 1;

export type DigitBank = Readonly<{
    bits: ReadonlyArray<Bit>; //
}>;

export type FallingTargetView = Readonly<{
    id: number;
    hexValue: number;
    y: number;
}>;

export type State = Readonly<{
    digitBank: DigitBank;
    allCurrentTargetsInPlay: ReadonlyArray<FallingTargetView>;
    healthReserve: number;
    score: number;
    gameEnd: boolean;
    nextTargetId: number;
    elapsedMs: number;
}>;

export type FlipDigit = Readonly<{
    kind: "FlipDigit";
    index: number;
}>;

export type Tick = Readonly<{
    kind: "Tick";
    elapsedMs: number;
}>;

export type SpawnTarget = Readonly<{
    kind: "SpawnTarget";
    hexValue: number;
}>;

export type Restart = Readonly<{
    kind: "Restart";
}>;

export type Action = FlipDigit | Tick | SpawnTarget | Restart;
