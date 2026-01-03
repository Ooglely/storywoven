<script lang="ts">
    import { onMount } from "svelte";
    import { StaticLayer, DynamicLayer } from "./layers";
    import { Layer } from "./layers";
    import type { FlattenedLayer } from "$lib/ms_types";

    let {
        data,
        width,
        height,
    }: {
        data: FlattenedLayer[];
        width: number;
        height: number;
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

    function render(timestamp: number) {
        ctx.clearRect(0, 0, width, height);
        layers.forEach((layer) => {
            if (layer instanceof Layer) {
                layer.draw(ctx, timestamp);
            }
        });
        requestAnimationFrame(render);
    }

    $effect(() => {
        // need to reinit layers since the canvas size has changed
        Promise.all(layers.map((layer) => layer.init(width, height)));
    });

    onMount(async () => {
        for (const layer of layers) {
            await layer.init(width, height);
        }

        ctx = canvas.getContext("2d")!;
        requestAnimationFrame(render);
    });
</script>

<canvas id="canvas" bind:this={canvas} {width} {height}> </canvas>

<style>
    canvas {
        position: absolute;
        bottom: 0px;
    }
</style>
