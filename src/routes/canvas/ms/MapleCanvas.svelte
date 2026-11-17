<script lang="ts">
    import { onMount } from "svelte";
    import { StaticLayer, DynamicLayer, Layer } from "./layers";
    import type { FlattenedLayer } from "$lib/ms_types";

    let {
        data,
        width,
        height,
        onload,
    }: {
        data: FlattenedLayer[];
        width: number;
        height: number;
        onload?: () => void;
    } = $props();

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let layers: Layer[] = $derived.by(() => {
        return data.map((layerData) => {
            if (layerData.type === "static") {
                return new StaticLayer(layerData.data);
            } else if (layerData.type === "dynamic") {
                return new DynamicLayer(layerData.data);
            } else {
                throw new Error(`Unknown layer type: ${layerData.type}`);
            }
        });
    });

    let hasLoaded = false;

    // Runs on startup and again whenever the canvas size (or layer data) changes
    $effect(() => {
        const currentLayers = layers;
        const w = width;
        const h = height;
        if (!w || !h) return;

        let stale = false;
        Promise.all(currentLayers.map((layer) => layer.init(w, h))).then(
            () => {
                if (stale || hasLoaded) return;
                hasLoaded = true;
                onload?.();
            },
        );

        return () => {
            stale = true;
        };
    });

    onMount(() => {
        ctx = canvas.getContext("2d")!;
        let frame = requestAnimationFrame(render);
        function render(timestamp: number) {
            ctx.clearRect(0, 0, width, height);
            for (const layer of layers) {
                layer.draw(ctx, timestamp);
            }
            frame = requestAnimationFrame(render);
        }
        return () => cancelAnimationFrame(frame);
    });
</script>

<canvas id="canvas" bind:this={canvas} {width} {height}> </canvas>

<style>
    canvas {
        position: absolute;
        bottom: 0px;
    }
</style>
