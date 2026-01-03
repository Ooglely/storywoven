<script lang="ts">
    import { getContext, onDestroy, onMount } from "svelte";
    import { Tween } from "svelte/motion";
    import { linear } from "svelte/easing";
    import type { FullComment } from "$lib/db/types";
    import type { CommentCanvasContext } from "./types";

    let {
        comment,
        windowWidth,
        windowHeight,
    }: {
        comment: FullComment;
        windowWidth: number;
        windowHeight: number;
    } = $props();

    let interval: ReturnType<typeof setInterval>;

    const mobId: number = comment.mobID;
    let userX: Tween<number> = new Tween(
        Math.floor(Math.random() * windowWidth - comment.mob.width + 1),
        { easing: linear },
    );
    let opacity: Tween<number> = new Tween(0, { easing: linear });

    let action: "stand" | "move" = $state("stand");
    let animateFrame: number = 0;
    let direction: string = $state("left");

    let commentWidth: number = $state(0);
    let commentX: number = $derived.by(() => {
        let centeredX = userX.current + (comment.mob.width - commentWidth) / 2;
        return Math.max(
            6,
            Math.min(centeredX, windowWidth - (commentWidth + 6)),
        );
    });
    let tailX: number = $derived.by(() => {
        return userX.current + comment.mob.width / 2;
    });
    let commentY: number = comment.mob.height - comment.mob.offset + 3;
    let commentVisible: boolean = $state(false);

    let images: {
        stand: HTMLImageElement[];
        move: HTMLImageElement[];
    } = {
        stand: [],
        move: [],
    };

    const canvasContext: CommentCanvasContext = getContext("canvasData");
    const ctx: CanvasRenderingContext2D = canvasContext.context();

    async function loadImages() {
        const loaders: Promise<void>[] = [];
        for (const [action, frames] of Object.entries(comment.mob.frames)) {
            for (let image = 0; image < frames; image++) {
                let img = new Image();
                img.src = `/mobs/${mobId}/${action}_${image}.webp`;
                images[action as keyof typeof images].push(img);
                loaders.push(img.decode());
            }
        }
        await Promise.all(loaders);
    }

    function drawSprite() {
        const current_image: HTMLImageElement = images[action][animateFrame];

        if (!current_image) return;

        ctx.save();
        ctx.globalAlpha = opacity.current;

        if (direction === "right") {
            ctx.scale(-1, 1);
            ctx.drawImage(
                current_image,
                -(userX.current + comment.mob.width),
                windowHeight - current_image.height + comment.mob.offset,
            );
        } else {
            ctx.drawImage(
                current_image,
                userX.current,
                windowHeight - current_image.height + comment.mob.offset,
            );
        }

        ctx.restore();
    }

    function checkMousePosition(
        x: number | undefined,
        y: number | undefined,
        currentIndex: number | undefined,
    ) {
        if (x === undefined || y === undefined) {
            commentVisible = false;
            return false;
        }
        const current_image: HTMLImageElement = images[action][animateFrame];
        const userRect = {
            x: userX.current,
            y: windowHeight - current_image.height + comment.mob.offset,
            width: current_image.width,
            height: current_image.height,
        };

        let mobHit = false;
        if (
            userRect.x <= x &&
            x <= userRect.x + userRect.width &&
            userRect.y <= y &&
            y <= userRect.y + userRect.height
        ) {
            if (!currentIndex || comment.id >= currentIndex) {
                commentVisible = true;
            } else {
                commentVisible = false;
            }
            mobHit = true;
        } else {
            commentVisible = false;
        }

        return mobHit;
    }

    function render() {
        if (animateFrame >= comment.mob.frames[action]) {
            animateFrame = 0;
        }
        drawSprite();
    }

    async function move() {
        let targetX = Math.floor(
            Math.random() * (windowWidth - comment.mob.width + 1),
        );
        let speed = Math.floor(Math.random() * 50) + 50; // pixels per second
        let duration = (Math.abs(targetX - userX.current) / speed) * 1000;
        if (targetX < userX.current) {
            direction = "left";
        } else {
            direction = "right";
        }
        await userX.set(targetX, { duration });
    }

    async function eventRunner() {
        while (true) {
            let choice = Math.random();
            let timeout = Math.floor(Math.random() * 4000) + 1;
            if (choice < 0.2) {
                action = "move";
                await move();
            } else {
                action = "stand";
                await new Promise((resolve) => setTimeout(resolve, timeout));
            }
        }
    }

    function animationRunner() {
        if (animateFrame >= comment.mob.frames[action]) {
            animateFrame = 0;
        } else {
            animateFrame++;
        }
    }

    onMount(async () => {
        // Register synchronously to ensure consistent ordering across both Maps
        canvasContext.addUser(comment.id, render);
        canvasContext.addCommentCheck(comment.id, checkMousePosition);

        await loadImages();
        opacity.set(1, { duration: 1000 });

        animationRunner(); // Need to run once before interval to instantly update
        interval = setInterval(animationRunner, comment.mob.interval);

        eventRunner();
    });

    onDestroy(() => {
        canvasContext.removeUser(comment.id);
        if (interval) clearInterval(interval);
    });

    const timestampFormat = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
    });
</script>

{#if commentVisible}
    <div
        class="bubble-tail"
        style="left: {tailX}px; bottom: {commentY}px"
    ></div>

    <div
        class="chatballoon comment"
        style="left:{commentX}px; bottom: {commentY + 13}px"
        bind:clientWidth={commentWidth}
    >
        <div class="name-sec monospace pb-1">
            <p class="name">{comment.author.name}</p>
            <p
                class="timestamp italic"
                title={timestampFormat.format(comment.timestamp)}
            >
                {comment.delta}
            </p>
        </div>
        <p class="usercomment monospace">{comment.comment}</p>
    </div>
{/if}

<style>
    .comment {
        position: absolute;
        padding: 5px 10px;
        max-width: 300px;
        max-height: 500px;
        z-index: 15;
    }

    .bubble-tail {
        position: absolute;
        /* transform: rotate(45deg); */
        width: 13px;
        height: 13px;
        background-image: url("/chatballoon/arrow.png");
        /* border-top: none; */
        z-index: 20;
    }

    .name-sec {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
    }

    .name-sec > .name {
        font-weight: bold;
        padding-right: 25px;
        padding-bottom: 0px;
    }

    .usercomment {
        margin-top: 0px;
        overflow-wrap: break-word;
    }
</style>
