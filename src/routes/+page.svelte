<script lang="ts">
    import { setContext } from "svelte";
    import BaseView from "./base/BaseView.svelte";
    import UserCanvas from "./canvas/UserCanvas.svelte";
    import BackCanvas from "./canvas/BackCanvas.svelte";
    import MapleCanvas from "./canvas/ms/MapleCanvas.svelte";
    import { Map000010000 } from "$lib/assets/parsed";
    import type { PageProps } from "./$types";
    import type { FullComment } from "../lib/db/types";

    let { data }: PageProps = $props();

    let windowWidth: number = $state(0);
    let windowHeight: number = $state(0);

    let mouseDown = $state(false);

    // Needs to be in an object to allow for updating through context
    let comments: {
        comments: FullComment[];
    } = $state({
        comments: [],
    });
    setContext("comments", comments);

    data.comments.then((resolved) => {
        comments.comments = resolved;
    });
</script>

<svelte:head>
    <title>storywoven ‧͙⁺˚*</title>
</svelte:head>

<svelte:window
    bind:innerWidth={windowWidth}
    bind:innerHeight={windowHeight}
    onmousedown={() => (mouseDown = true)}
    onmouseup={() => (mouseDown = false)}
/>

<div class:clicking={mouseDown}>
    <div class="view max-w-[1000px]">
        <BaseView />
    </div>
    <div class="sprites">
        <MapleCanvas data={Map000010000} width={windowWidth} height={790} />
        <BackCanvas width={windowWidth} height={windowHeight} />
        <UserCanvas
            comments={comments.comments}
            width={windowWidth}
            height={500}
        />
    </div>
    <div class="ground"></div>
</div>

<style>
    :global(.clicking),
    :global(.clicking *) {
        cursor: url("../../static/cursor/pointer_1.png"), pointer;
    }

    .view {
        position: absolute;
        top: 30px;
        bottom: 150px;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100vw - 120px);
        height: calc(100vh - 210px);
        box-sizing: border-box;
        z-index: 10;
    }

    @media (max-width: 500px) {
        .view {
            position: absolute;
            width: 100vw;
            height: calc(100vh - 150px);
            top: 0px;
        }
    }

    .ground {
        position: absolute;
        bottom: 0px;
        height: 19px;
        width: 100%;
        background-image: url("../../static/ground.png");
    }

    .sprites {
        position: absolute;
        bottom: 17px;
        height: 50px;
        width: 100%;
    }
</style>
