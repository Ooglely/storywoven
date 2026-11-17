<script lang="ts">
    import { onMount, setContext } from "svelte";
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

    // Keep the background black until the back canvas has loaded
    // The maple canvas can fade in on its own once it is ready
    let mapleLoaded = $state(false);
    let backLoaded = $state(false);
    let lightsLoaded = $state(false);

    onMount(() => {
        const lights = new Image();
        lights.src = "/lights.gif";
        lights.decode().finally(() => (lightsLoaded = true));
    });

    let backgroundLoaded = $derived(backLoaded && lightsLoaded);

    // If the maple canvas is ready before the background, it's revealed instantly
    // underneath the black cover so everything fades in together at the same rate.
    // Only fade it separately if it finishes after the background is already shown.
    let mapleFade = $state(false);
    function onMapleLoad() {
        mapleFade = backgroundLoaded;
        mapleLoaded = true;
    }

    $effect(() => {
        document.body.classList.toggle("loaded", backgroundLoaded);
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
        <div
            class="maple-wrap"
            class:loaded={mapleLoaded}
            class:fade={mapleFade}
        >
            <MapleCanvas
                data={Map000010000}
                width={windowWidth}
                height={790}
                onload={onMapleLoad}
            />
        </div>
        <BackCanvas
            width={windowWidth}
            height={windowHeight}
            onload={() => (backLoaded = true)}
        />
        <UserCanvas
            comments={comments.comments}
            width={windowWidth}
            height={500}
        />
    </div>
    <div class="ground"></div>
    <div class="load-cover" class:loaded={backgroundLoaded}></div>
</div>

<style>
    :global(.clicking),
    :global(.clicking *) {
        cursor: url("/cursor/pointer_1.png"), pointer;
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

    /* Black cover over the whole scene (below .view) that fades out once the
       background is ready, so every part of the scene fades in at the same rate */
    .load-cover {
        position: fixed;
        inset: 0;
        z-index: 5;
        background: black;
        pointer-events: none;
        transition: opacity 0.4s ease;
    }

    .load-cover.loaded {
        opacity: 0;
    }

    .maple-wrap {
        opacity: 0;
    }

    .maple-wrap.loaded {
        opacity: 1;
    }

    .maple-wrap.fade {
        transition: opacity 0.4s ease;
    }

    .ground {
        position: absolute;
        bottom: 0px;
        height: 39px;
        width: 100%;
        background-image: url("/ground.png");
        background-position: top center;
    }

    .sprites {
        position: absolute;
        bottom: 30px;
        height: 50px;
        width: 100%;
    }
</style>
