<script lang="ts">
    import { getContext, onDestroy, onMount } from "svelte";
    import { Tween } from "svelte/motion";
    import { linear } from "svelte/easing";
    import type { CanvasContext } from "./types";
    import type { PreviewMob } from "$lib/db/types";

    let {
        mob,
        windowWidth,
        windowHeight,
    }: {
        mob: PreviewMob;
        windowWidth: number;
        windowHeight: number;
    } = $props();

    let interval: ReturnType<typeof setInterval>;

    let mobWidth = $state(0);
    let mobHeight = $state(0);

    let userX: Tween<number> = new Tween(
        Math.floor(Math.random() * windowWidth + 1),
        { easing: linear },
    );

    let action: "stand" | "move" = $state("stand");
    let animateFrame: number = 0;
    let direction: string = $state("left");

    let commentWidth: number = $state(300);
    let commentX: number = $derived.by(() => {
        let centeredX = userX.current + (mobWidth - commentWidth) / 2;
        return Math.max(
            6,
            Math.min(centeredX, windowWidth - (commentWidth + 6)),
        );
    });
    let commentY: number = $derived(mobHeight - mob.offset + 31);
    let commentVisible: boolean = $state(false);

    let images: {
        stand: HTMLImageElement[];
        move: HTMLImageElement[];
    } = {
        stand: [],
        move: [],
    };

    const canvasContext: CanvasContext = getContext("previewCanvas");
    const ctx: CanvasRenderingContext2D = canvasContext.context();

    async function loadImage(img: HTMLImageElement) {
        // This function is needed to update the mobWidth/Height
        // every time a new frame is added
        await img.decode();
        if (img.width > mobWidth) mobWidth = img.width;
        if (img.height > mobHeight) mobHeight = img.height;
    }

    async function loadImages() {
        images.move = [];
        images.stand = [];
        mobWidth = 0;
        mobHeight = 0;
        const loaders: Promise<void>[] = [];
        for (const [action, frames] of Object.entries(mob.frames)) {
            for (let image = 0; image < frames.length; image++) {
                let img = new Image();
                img.src = frames[image];
                images[action as keyof typeof images].push(img);
                loaders.push(loadImage(img));
            }
        }
        await Promise.all(loaders);
    }

    function drawSprite() {
        const current_image: HTMLImageElement = images[action][animateFrame];

        if (!current_image || !ctx) return;
        ctx.save();

        if (direction === "right") {
            ctx.scale(-1, 1);
            ctx.drawImage(
                current_image,
                -(userX.current + mobWidth),
                windowHeight - current_image.height + mob.offset,
            );
        } else {
            ctx.drawImage(
                current_image,
                userX.current,
                windowHeight - current_image.height + mob.offset,
            );
        }
        ctx.restore();
    }

    function checkMousePosition() {
        const { x, y } = canvasContext.mousePosition();
        if (x === undefined || y === undefined) {
            commentVisible = false;
            return;
        }
        const current_image: HTMLImageElement = images[action][animateFrame];
        if (!current_image) return;
        const userRect = {
            x: userX.current,
            y: windowHeight - current_image.height + mob.offset,
            width: current_image.width,
            height: current_image.height,
        };

        if (
            userRect.x <= x &&
            x <= userRect.x + userRect.width &&
            userRect.y <= y &&
            y <= userRect.y + userRect.height
        ) {
            commentVisible = true;
        } else {
            commentVisible = false;
        }
    }

    function render() {
        if (animateFrame >= mob.frames[action].length) {
            animateFrame = 0;
        }
        checkMousePosition();
        drawSprite();
    }

    async function move() {
        let targetX = Math.floor(Math.random() * (windowWidth - mobWidth + 1));
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
        if (animateFrame >= mob.frames[action].length) {
            animateFrame = 0;
        } else {
            animateFrame++;
        }
    }

    onMount(async () => {
        await loadImages();

        // Wait for context to be ready

        canvasContext.addUser(0, render);

        animationRunner(); // Need to run once before interval to instantly update
        interval = setInterval(animationRunner, mob.interval);

        eventRunner();
    });

    $effect(() => {
        if (mob) {
            // Load images for the current mob
            // whenever it is updated
            loadImages();
            if (interval) {
                clearInterval(interval);
                interval = setInterval(animationRunner, mob.interval);
            }
        }
    });

    onDestroy(() => {
        canvasContext.removeUser(0);
        if (interval) clearInterval(interval);
    });
</script>

{#if commentVisible}
    <div
        class="chatballoon comment monospace"
        style="left:{commentX}px; bottom: {commentY}px"
        bind:clientWidth={commentWidth}
    >
        <div class="name-sec">
            <p class="name">{mob.author ? mob.author : "User"}</p>
            <p class="timestamp">now</p>
        </div>
        <p class="usercomment">
            {mob.comment ? mob.comment : "hello this is my comment ^_^"}
        </p>
    </div>
{/if}

<style>
    .comment {
        position: absolute;
        padding: 5px 10px;
        color: black;
        max-width: 300px;
        max-height: 250px;
        z-index: 15;
        overflow: hidden;
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
