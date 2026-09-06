/**
 * view.ts
 *
 * All rendering (side effects) lives here. Nothing in this file should
 * decide game logic — it should only take a State and draw it.
 */

import {
    Constants,
    State,
    Target,
    Viewport,
    ElementIds,
    DigitBank,
} from "./types";

/**
 * Brings an SVG element to the foreground.
 * @param elem SVG element to bring to the foreground
 */
export const bringToForeground = (elem: SVGElement): void => {
    elem.parentNode?.appendChild(elem);
};

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
export const show = (elem: SVGElement): void => {
    elem.setAttribute("visibility", "visible");
    bringToForeground(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
export const hide = (elem: SVGElement): void => {
    elem.setAttribute("visibility", "hidden");
};

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
export const createSvgElement = (
    namespace: string | null,
    name: string,
    props: Record<string, string> = {},
): SVGElement => {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
};

/** ---------- New rendering logic (TODO: implement) ---------- */

/**
 * Renders the DigitBank row. Each digit element should carry a
 * data-fb-digit-index attribute so observable.ts's click handling
 * (flipClick$) can identify which digit was clicked.
 *
 * NOTE: Might need to reimplement if complexity is too high.
 */

const DIGIT_BOX_SIZE = 48;
const DIGIT_BOX_GAP = 12;
const DIGIT_ROW_Y = Viewport.CANVAS_HEIGHT - DIGIT_BOX_SIZE - 16; // near the bottom of the canvas

const DIGIT_BANK_GROUP_ID = "fb-digit-bank-group";

const renderDigitBank = (svg: SVGSVGElement, s: State): void => {
    const existingGroup = svg.querySelector(`#${DIGIT_BANK_GROUP_ID}`);
    if (existingGroup) {
        svg.removeChild(existingGroup);
    }

    const group = createSvgElement(svg.namespaceURI, "g", {
        id: DIGIT_BANK_GROUP_ID,
    });

    // Centre the row of Constants.DIGIT_COUNT boxes horizontally on the canvas.
    const rowWidth =
        Constants.DIGIT_COUNT * DIGIT_BOX_SIZE +
        (Constants.DIGIT_COUNT - 1) * DIGIT_BOX_GAP;
    const rowStartX = (Viewport.CANVAS_WIDTH - rowWidth) / 2;

    s.digitBank.bits.forEach((bit, i) => {
        const x = rowStartX + i * (DIGIT_BOX_SIZE + DIGIT_BOX_GAP);
        const y = DIGIT_ROW_Y;

        const box = createSvgElement(svg.namespaceURI, "rect", {
            x: String(x),
            y: String(y),
            width: String(DIGIT_BOX_SIZE),
            height: String(DIGIT_BOX_SIZE),
            "data-fb-digit-index": String(i),
            class: "digit-box",
        });

        const bitText = createSvgElement(svg.namespaceURI, "text", {
            x: String(x + DIGIT_BOX_SIZE / 2),
            y: String(y + DIGIT_BOX_SIZE / 2),
            "text-anchor": "middle",
            "dominant-baseline": "central",
            "data-fb-digit-index": String(i),
            class: "digit-text",
        });
        bitText.textContent = String(bit);

        group.appendChild(box);
        group.appendChild(bitText);
    });

    svg.appendChild(group);
};

/**
 * Renders all targets in allCurrentTargetsInPlay. Each target element
 * should carry a data-fb-target-id attribute matching its id.
 *
 *
 */
const renderTargets = (svg: SVGSVGElement, s: State): void => {
    const existingGroup = svg.querySelector(`#${ElementIds.TARGETS_GROUP}`);
    if (existingGroup) {
        svg.removeChild(existingGroup);
    }
    const group = createSvgElement(svg.namespaceURI, "g", {
        id: ElementIds.TARGETS_GROUP,
    });

    s.allCurrentTargetsInPlay.forEach(target => {
        // x isn't part of the state model yet (only y moves), so centre
        // every target horizontally on the canvas for now — revisit if
        // targets ever need distinct lanes/columns.
        const x = (Viewport.CANVAS_WIDTH - Target.WIDTH) / 2;
        const y = target.y;

        const box = createSvgElement(svg.namespaceURI, "rect", {
            x: String(x),
            y: String(y),
            width: String(Target.WIDTH),
            height: String(Target.HEIGHT),
            "data-fb-target-id": String(target.id),
            class: "target-box",
        });

        const hexText = createSvgElement(svg.namespaceURI, "text", {
            x: String(x + Target.WIDTH / 2),
            y: String(y + Target.HEIGHT / 2),
            "text-anchor": "middle",
            "dominant-baseline": "central",
            "data-fb-target-id": String(target.id),
            class: "target-text",
        });
        hexText.textContent = target.hexValue.toString(16).toUpperCase();

        group.appendChild(box);
        group.appendChild(hexText);
    });

    svg.appendChild(group);
};

/**
 * TODO: implement additional render helpers as needed.
 * renderScore, renderHealthReserve, renderGameOverOverlay.
 */

const renderScore = (s: State): void => {
    const scoreText = document.querySelector("#scoreText");
    if (scoreText) {
        scoreText.textContent = String(s.score);
    }
};

const renderGameOver = (svg: SVGSVGElement, s: State): void => {
    const existingGroup = svg.querySelector(`#${ElementIds.GAME_OVER_GROUP}`);
    if (!s.gameEnd) {
        if (existingGroup) {
            svg.removeChild(existingGroup);
        }
        return;
    }

    if (existingGroup) {
        return; // already showing game-over — don't rebuild every tick and risk swallowing clicks
    }

    const group = createSvgElement(svg.namespaceURI, "g", {
        id: ElementIds.GAME_OVER_GROUP,
    });

    const background = createSvgElement(svg.namespaceURI, "rect", {
        x: "0",
        y: "0",
        width: String(Viewport.CANVAS_WIDTH),
        height: String(Viewport.CANVAS_HEIGHT),
        class: "game-over-background",
    });

    const titleText = createSvgElement(svg.namespaceURI, "text", {
        x: String(Viewport.CANVAS_WIDTH / 2),
        y: String(Viewport.CANVAS_HEIGHT / 2 - 16),
        "text-anchor": "middle",
        "dominant-baseline": "central",
        class: "game-over-title",
    });
    titleText.textContent = "Game Over";

    const scoreText = createSvgElement(svg.namespaceURI, "text", {
        x: String(Viewport.CANVAS_WIDTH / 2),
        y: String(Viewport.CANVAS_HEIGHT / 2 + 16),
        "text-anchor": "middle",
        "dominant-baseline": "central",
        class: "game-over-score",
    });
    scoreText.textContent = `Final Score: ${s.score}`;

    const restartText = createSvgElement(svg.namespaceURI, "text", {
        x: String(Viewport.CANVAS_WIDTH / 2),
        y: String(Viewport.CANVAS_HEIGHT / 2 + 48),
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "data-fb-restart-button": "true",
        class: "game-over-restart",
    });
    restartText.textContent = "Click to Restart";

    group.appendChild(background);
    group.appendChild(titleText);
    group.appendChild(scoreText);
    group.appendChild(restartText);
    svg.appendChild(group);
};

/**
 * Sets up the SVG canvas and returns the render function used to draw
 * each new State as it arrives from the state stream.
 *
 * @returns a function that renders a given State onto the canvas
 */
export const render = (): ((s: State) => void) => {
    const svg = document.querySelector("#svgCanvas") as SVGSVGElement;
    svg.setAttribute(
        "viewBox",
        `0 0 ${Viewport.CANVAS_WIDTH} ${Viewport.CANVAS_HEIGHT}`,
    );

    // Tracks the last-rendered value of each piece of state we care
    // about, so we only touch the DOM when something actually changed —
    // this matters once ticks fire much faster than the player can
    // perceive per-field changes (e.g. digitBank only changes on
    // FlipDigit, not on every Tick).
    let lastDigitBank: DigitBank | null = null;

    return (s: State) => {
        if (s.digitBank !== lastDigitBank) {
            renderDigitBank(svg, s);
            lastDigitBank = s.digitBank;
        }
        if (!s.gameEnd) {
            renderTargets(svg, s);
            renderScore(s);
        }
        renderGameOver(svg, s);
    };
};
