/**
 * view.ts
 *
 * All rendering (side effects) lives here.
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

/**
 * Renders the DigitBank row.
 *
 */

const DIGIT_BOX_SIZE = 48;
const DIGIT_BOX_GAP = 12;
const DIGIT_ROW_Y = Viewport.CANVAS_HEIGHT - DIGIT_BOX_SIZE - 16;

const DIGIT_BANK_GROUP_ID = "fb-digit-bank-group";

const renderDigitBank = (svg: SVGSVGElement, s: State): void => {
    const existingGroup = svg.querySelector(`#${DIGIT_BANK_GROUP_ID}`);
    if (existingGroup) {
        svg.removeChild(existingGroup);
    }

    const group = createSvgElement(svg.namespaceURI, "g", {
        id: DIGIT_BANK_GROUP_ID,
    });

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

type TargetElements = { box: SVGElement; text: SVGElement };

/**
 * Renders allCurrentTargetsInPlay by diffing against what was drawn last
 * frame, rather than destroying and recreating every element each call.
 */
const TARGET_PADDING_X = 12; // horizontal padding between text and box edge

const renderTargets = (
    svg: SVGSVGElement,
    s: State,
    elementsById: Map<number, TargetElements>,
): void => {
    let group = svg.querySelector(
        `#${ElementIds.TARGETS_GROUP}`,
    ) as SVGElement | null;
    if (!group) {
        group = createSvgElement(svg.namespaceURI, "g", {
            id: ElementIds.TARGETS_GROUP,
        });
        svg.appendChild(group);
    }

    const currentIds = new Set(s.allCurrentTargetsInPlay.map(t => t.id));

    elementsById.forEach((elements, id) => {
        if (!currentIds.has(id)) {
            group!.removeChild(elements.box);
            group!.removeChild(elements.text);
            elementsById.delete(id);
        }
    });

    const centerX = Viewport.CANVAS_WIDTH / 2;

    // Sizes the box around whatever text is currently in the DOM, using
    // its real rendered width rather than guessing a
    // character-width constant
    const fitBoxToText = (box: SVGElement, text: SVGElement, y: number) => {
        const bbox = (text as unknown as SVGTextElement).getBBox();
        const width = Math.max(Target.WIDTH, bbox.width + TARGET_PADDING_X * 2);
        const x = centerX - width / 2;

        box.setAttribute("x", String(x));
        box.setAttribute("width", String(width));
        box.setAttribute("y", String(y));
        text.setAttribute("x", String(centerX));
        text.setAttribute("y", String(y + Target.HEIGHT / 2));
    };

    s.allCurrentTargetsInPlay.forEach(target => {
        const y = target.y;
        const existing = elementsById.get(target.id);
        const displayText = target.targetValue
            .toString(s.displayBase)
            .toUpperCase();

        if (existing) {
            existing.text.textContent = displayText;
            fitBoxToText(existing.box, existing.text, y); // re-measure every frame — width may need to change if displayBase changed since last render
            return;
        }

        const box = createSvgElement(svg.namespaceURI, "rect", {
            x: "0",
            y: String(y),
            width: String(Target.WIDTH),
            height: String(Target.HEIGHT),
            "data-fb-target-id": String(target.id),
            class: "target-box",
        });

        const text = createSvgElement(svg.namespaceURI, "text", {
            x: String(centerX),
            y: String(y + Target.HEIGHT / 2),
            "text-anchor": "middle",
            "dominant-baseline": "central",
            "data-fb-target-id": String(target.id),
            class: "target-text",
        });
        text.textContent = displayText;

        group!.appendChild(box);
        group!.appendChild(text);

        fitBoxToText(box, text, y);

        elementsById.set(target.id, { box, text });
    });
};

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
        return;
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

const renderBaseValueText = (s: State): void => {
    const baseValueText = document.querySelector("#baseValueText");
    if (baseValueText) {
        baseValueText.textContent = String(s.displayBase);
    }
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

    let lastDigitBank: DigitBank | null = null;
    const targetElementsById = new Map<number, TargetElements>();

    return (s: State) => {
        if (s.digitBank !== lastDigitBank) {
            renderDigitBank(svg, s);
            lastDigitBank = s.digitBank;
        }

        if (!s.gameEnd) {
            renderTargets(svg, s, targetElementsById);
            renderScore(s);
        } else if (targetElementsById.size > 0) {
            const group = svg.querySelector(`#${ElementIds.TARGETS_GROUP}`);
            if (group) svg.removeChild(group);
            targetElementsById.clear();
        }

        renderBaseValueText(s);
        renderGameOver(svg, s);
    };
};
