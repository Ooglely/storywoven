<script lang="ts">
    import type { PreviewMob } from "$lib/db/types";
    import PreviewUser from "./PreviewUser.svelte";
    import type { CanvasContext } from "./types";

    import { onMount, setContext } from "svelte";

    let {
        mob,
        width,
        height,
    }: {
        mob: PreviewMob;
        width: number;
        height: number;
    } = $props();

    let mouseX: number | undefined;
    let mouseY: number | undefined;
    let filesReady = $derived<boolean>(
        mob.frames.stand.length > 0 && mob.frames.move.length > 0,
    );

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let userRenderers: Map<number, () => void> = new Map();
    let canvasData: CanvasContext = {
        addUser: (id: number, renderer: () => void) => {
            userRenderers.set(id, renderer);
        },
        removeUser: (id: number) => {
            userRenderers.delete(id);
        },
        context: () => ctx,
        canvas: () => canvas,
        mousePosition: () => ({ x: mouseX, y: mouseY }),
    };

    setContext("previewCanvas", canvasData);

    function renderCanvas() {
        if (!canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "lightblue";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        userRenderers.forEach((renderer) => renderer());
        requestAnimationFrame(renderCanvas);
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

    onMount(() => {
        ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        renderCanvas();
    });
</script>

<div class="border-2 border-gray-600 rounded-lg mt-4 relative">
    <div
        class="z-1 monospace relative w-fit -top-3 left-4 bg-gray-600 text-white px-1 -mb-7 rounded-lg"
    >
        preview
    </div>
    <canvas
        id="canvas"
        class="rounded-t-md"
        bind:this={canvas}
        width={width - 2}
        {height}
        onmousemove={handleMouseMove}
        onmouseleave={handleMouseLeave}
    >
    </canvas>
    {#if filesReady}
        <PreviewUser {mob} windowWidth={width} windowHeight={height} />
    {/if}
    <div class="ground"></div>
    {#if !filesReady}
        <div
            class="flex absolute top-0 justify-center items-center h-full w-full"
        >
            <p class="monospace bg-gray-600 p-1 rounded">
                Need both stand and move frames
            </p>
        </div>
    {/if}
</div>

<style>
    #canvas {
        position: relative;
        bottom: -4px;
        left: 0;
    }

    .ground {
        position: relative;
        bottom: 0px;
        height: 19px;
        width: 100%;
        background-image: url("../../../static/ground.png");
        border-radius: 0px 0px 7px 7px;
    }
</style>
