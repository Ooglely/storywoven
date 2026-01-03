<script lang="ts">
    import big_tree_1 from "$lib/assets/big_tree_1.png";
    import bench from "$lib/assets/bench.png";

    import { onMount } from "svelte";

    let {
        width,
        height,
    }: {
        width: number;
        height: number;
    } = $props();

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    function drawCanvasBackground(width: number, height: number) {
        const big_tree_1_img = new Image();
        big_tree_1_img.src = big_tree_1;
        big_tree_1_img.onload = () => {
            ctx.drawImage(big_tree_1_img, -250, height - big_tree_1_img.height);
        };

        const bench_img = new Image();
        bench_img.src = bench;
        bench_img.onload = () => {
            ctx.drawImage(
                bench_img,
                width - bench_img.width - 20,
                height - bench_img.height,
            );
        };
    }

    $effect(() => {
        // need to reinit layers since the canvas size has changed
        drawCanvasBackground(width, height);
    });

    onMount(() => {
        ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        drawCanvasBackground(width, height);
    });
</script>

<canvas id="canvas" bind:this={canvas} {width} {height}> </canvas>

<style>
    canvas {
        position: absolute;
        bottom: 0px;
    }
</style>
