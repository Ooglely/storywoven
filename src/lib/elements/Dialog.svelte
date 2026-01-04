<!-- call this with mount and pass the function to destroy it -->
<script lang="ts">
    import type { Snippet } from "svelte";

    let { children, onclose }: { children: Snippet; onclose: () => void } =
        $props();

    // Dragging logic
    let grabbing: boolean = $state(false);
    let offsetX: number = $state(0);
    let offsetY: number = $state(0);
    let initialX: number = 0;
    let initialY: number = 0;

    async function handleMouseDown(event: MouseEvent) {
        if (event.button !== 0) return;
        grabbing = true;
        initialX = event.clientX;
        initialY = event.clientY;
    }

    async function handleMouseUp(event: MouseEvent) {
        if (event.button !== 0) return;
        grabbing = false;
    }

    async function handleMouseMove(event: MouseEvent) {
        if (!grabbing) return;
        offsetX += event.clientX - initialX;
        offsetY += event.clientY - initialY;
        initialX = event.clientX;
        initialY = event.clientY;
    }

    function onCloseButtonClick(e: MouseEvent) {
        const button = e.target as HTMLImageElement;
        button.src = "dialog/pressed.png";
        onclose();
    }
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />
<div
    class="container"
    onmousedown={handleMouseDown}
    role="dialog"
    tabindex="0"
    style="transform: translate(calc({offsetX}px - 50%), calc({offsetY}px - 50%))"
>
    <div class="dialog">
        <div class="content">
            {@render children()}
        </div>
    </div>
    <button class="close-button" onclick={onCloseButtonClick}>
        <img src="dialog/normal.png" width="91" height="16" alt="Close" />
    </button>
</div>

<style>
    .container {
        position: absolute;
        top: 50%;
        left: 50%;
        max-width: 600px;
        padding: 17px 18px 38px 18px;
        z-index: 30;
    }

    .content {
        background: white;
        padding: 1rem;
        width: auto;
        max-width: 600px;
        max-height: 600px;
        overflow-x: hidden;
        overflow-y: scroll;
    }

    .close-button {
        position: absolute;
        bottom: 8px;
        background: transparent;
        cursor: pointer;
        image-rendering: smooth;
    }
</style>
