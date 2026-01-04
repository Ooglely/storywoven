<script lang="ts">
    import type { FullComment } from "$lib/db/types";
    import type { CommentCanvasContext } from "./types";
    import User from "./User.svelte";

    import { onMount, setContext } from "svelte";

    let {
        comments,
        width,
        height,
    }: {
        comments: FullComment[];
        width: number;
        height: number;
    } = $props();

    let newestComments = $derived.by(() => {
        const authors = new Set<number>();
        return comments
            .slice()
            .filter((comment) => {
                if (authors.has(comment.author.id)) {
                    return false;
                }
                authors.add(comment.author.id);
                return true;
            })
            .reverse();
    });

    let shownComment: number;
    let clickedComment: number | undefined;
    let mouseX: number | undefined;
    let mouseY: number | undefined;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let userRenderers: Map<number, () => void> = new Map();
    let commentCheckers: Map<
        number,
        (
            x: number | undefined,
            y: number | undefined,
            currentIndex: number,
        ) => boolean
    > = new Map();
    let reversedCommentCheckers: [
        number,
        (
            x: number | undefined,
            y: number | undefined,
            currentIndex: number,
        ) => boolean,
    ][] = [];

    let canvasData: CommentCanvasContext = {
        addUser: (id: number, renderer: () => void) => {
            userRenderers.set(id, renderer);
        },
        removeUser: (id: number) => {
            userRenderers.delete(id);
        },
        context: () => ctx,
        canvas: () => canvas,
        mousePosition: () => ({ x: mouseX, y: mouseY }),
        addCommentCheck: (
            id: number,
            callback: (
                x: number | undefined,
                y: number | undefined,
                currentIndex: number,
            ) => boolean,
        ) => {
            commentCheckers.set(id, callback);
            reversedCommentCheckers = Array.from(
                commentCheckers.entries(),
            ).reverse();
        },
    };

    setContext("canvasData", canvasData);

    function renderCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        userRenderers.forEach((renderer) => renderer());
        requestAnimationFrame(renderCanvas);
        if (
            clickedComment === undefined &&
            mouseX !== undefined &&
            mouseY !== undefined
        ) {
            // Since there isn't a selected comment, and the comments are moving
            // need to check if any of them collide with the cursor every draw
            updateMousePosition();
        }
    }

    function updateMousePosition() {
        if (clickedComment === undefined) {
            // There is no "locked" comment, run every comment callback
            // until one is found
            let mobHit = false;
            reversedCommentCheckers.forEach(([id, checker]) => {
                if (checker(mouseX, mouseY, shownComment)) {
                    // We need to run through all comments so they can reset if higher one found
                    if (!mobHit) {
                        shownComment = id;
                        mobHit = true;
                    }
                }
            });
            if (!mobHit) {
                shownComment = -1; // Reset index
            }
        }
    }

    function handleMouseMove(event: MouseEvent) {
        const boundingRect = canvas.getBoundingClientRect();
        mouseX = event.clientX - boundingRect.left;
        mouseY = event.clientY - boundingRect.top;
    }

    function handleMouseLeave() {
        mouseX = undefined;
        mouseY = undefined;
    }

    function handleMouseClick(event: MouseEvent) {
        // Check if a new click collides with any comments
        // if not, then deselect and go back to hover checking
        const boundingRect = canvas.getBoundingClientRect();
        let clickX = event.clientX - boundingRect.left;
        let clickY = event.clientY - boundingRect.top;

        // Run through commentHandlers until a collision is found
        let mobHit = false;
        reversedCommentCheckers.forEach(([id, checker]) => {
            if (checker(clickX, clickY, shownComment)) {
                // We need to run through all comments so they can reset if higher one found
                if (!mobHit) {
                    shownComment = id;
                    clickedComment = id;
                    mobHit = true;
                }
            }
        });
        if (!mobHit) {
            clickedComment = undefined;
        }
        shownComment = -1; // Reset index
    }

    onMount(() => {
        // canvas = document.getElementById("canvas") as HTMLCanvasElement;
        ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        renderCanvas();
    });
</script>

<canvas
    id="canvas"
    bind:this={canvas}
    {width}
    {height}
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
    onmousedown={handleMouseClick}
>
</canvas>

{#each newestComments as comment}
    <User {comment} windowWidth={width} windowHeight={height} />
{/each}

<style>
    canvas {
        position: absolute;
        bottom: 0px;
    }
</style>
