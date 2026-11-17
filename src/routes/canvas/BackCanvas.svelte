<script lang="ts">
    import big_tree_1 from "$lib/assets/big_tree_1.png";
    import bench from "$lib/assets/bench.png";

    import { onMount } from "svelte";

    let {
        width,
        height,
        onload,
    }: {
        width: number;
        height: number;
        onload?: () => void;
    } = $props();

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    async function drawCanvasBackground(width: number, height: number) {
        const big_tree_1_img = new Image();
        big_tree_1_img.src = big_tree_1;

        const bench_img = new Image();
        bench_img.src = bench;

        await Promise.all([
            big_tree_1_img.decode().then(() => {
                ctx.drawImage(
                    big_tree_1_img,
                    -250,
                    height - big_tree_1_img.height,
                );
            }),
            bench_img.decode().then(() => {
                ctx.drawImage(
                    bench_img,
                    width - bench_img.width - 20,
                    height - bench_img.height,
                );
            }),
        ]);
    }

    $effect(() => {
        // need to reinit layers since the canvas size has changed
        drawCanvasBackground(width, height);
    });

    onMount(() => {
        ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        drawCanvasBackground(width, height).finally(() => onload?.());
    });
</script>

<canvas id="canvas" bind:this={canvas} {width} {height}> </canvas>

<style>
    canvas {
        position: absolute;
        bottom: 0px;
    }
</style>
