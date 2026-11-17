<script lang="ts">
    import SongHistory from "$lib/elements/SongHistory.svelte";
    import { getContext } from "svelte";
    import { page } from "$app/state";
    import type { FullComment } from "$lib/db/types";

    let visits: number = $derived(page.data.visits ?? 0);
    let digits = $derived(
        String(visits).padStart(5, "0").split(""),
    );

    let commentContext: {
        comments: FullComment[];
    } = getContext("comments");

    const timestampFormat = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
    });
</script>

<div class="view-container min-h-full flex flex-col gap-8 justify-between">
    <div class="hi">
        <h1 class="maple">hello!</h1>
        <hr class="pb-4" />
        <p class="maple">
            this is alen's (or oog/waterfarer's) website!
            <br /><br />
            you can learn more about me and some of my projects on the about/links
            tabs.
            <br /><br />
            you can also hover over the sprites at the bottom to see others comments,
            or go to the comment tab to leave your own. (think of it as a fun little
            guestbook!)
            <br /><br />
            this site is meant to be visited on a desktop, but it should still work
            on mobile. I promise you it looks better on a desktop though :)
        </p>
    </div>

    <div class="maple flex flew-row items-center justify-center gap-2">
        <p class="text-center grow-0">this website has been visited</p>
        <div
            title="{visits} visits"
            class="visit-count"
            role="img"
            aria-label="{visits} visits"
        >
            {#each digits as digit}
                <img src="/counter/{digit}.gif" alt="" width="32" height="55" />
            {/each}
        </div>
        <p>times!</p>
    </div>

    <div class="flex flex-col flex-wrap gap-8 items-center justify-center">
        <div class="logos maple flex flex-col justify-between items-center">
            <div class="staydown max-w-xl">
                <img src="sd_white_1.webp" alt="sd" />
                <p>
                    this website is part of the <a href="https://staydown.money"
                        >staydown.money</a
                    > webring
                </p>
                <ul>
                    <li>
                        <a
                            href="https://staydown.money/wr?prev=https://storywoven.net/"
                            >← prev</a
                        >
                    </li>
                    <li>
                        <a
                            href="https://staydown.money/wr?random=https://storywoven.net/"
                            >random</a
                        >
                    </li>
                    <li>
                        <a
                            href="https://staydown.money/wr?next=https://storywoven.net/"
                            >next →</a
                        >
                    </li>
                </ul>
            </div>
        </div>

        <div class="music my-4 max-w-full">
            <SongHistory />
        </div>
    </div>

    <div class="flex flex-row justify-center items-center gap-1 flex-wrap mb-8">
        <a href="https://storywoven.net/" target="_blank">
            <img src="buttons/storywoven.png" alt="storywoven" />
        </a>
        <a href="https://storywoven.net/" target="_blank">
            <img src="buttons/storywoven_raw.png" alt="storywoven" />
        </a>
        <div class="w-0 h-[33px] mx-0.5 border-1 border-gray-400"></div>
        <a href="https://staydown.money/" target="_blank">
            <img src="buttons/staydown.png" alt="staydown" />
        </a>
        <a href="https://neocities.org/" target="_blank">
            <img src="buttons/neocities.jpeg" alt="neocities" />
        </a>
        <a href="https://svelte.dev/" target="_blank">
            <img src="buttons/svelte.gif" alt="svelte" />
        </a>
        <div class="maple w-full">
            <p class="text-center">
                if you have a 88x31 or website pls link it in your comment, I
                would love to check it out and add it here
            </p>
        </div>
    </div>
</div>
<hr class="py-2" />

<div>
    <h2 class="maple">guestbook (all comments)</h2>
    <div class="mt-2 mb-4 border-2 monospace">
        {#if commentContext.comments.length != 0}
            {#each commentContext.comments as comment}
                <div class="py-2 border-stone-500 border">
                    <div class="px-4 pb-1 flex justify-between monospace">
                        <p class="font-bold pr-5">{comment.author.name}</p>
                        <p class="timestamp italic">
                            {timestampFormat.format(comment.timestamp)}
                        </p>
                    </div>
                    <p class="px-4 monospace">{comment.comment}</p>
                </div>
            {/each}
        {:else}
            <p>No comments yet!</p>
        {/if}
    </div>
</div>

<style>
    .visit-count {
        display: flex;
        flex-shrink: 0;
    }

    .visit-count img {
        display: block;
        image-rendering: smooth;
    }

    .logos .staydown {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 0px 10px 0px 0px;
        text-decoration: dashed;
    }

    .logos .staydown img {
        width: 100%;
        height: auto;
    }

    .logos .staydown ul {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 10px;
        padding: 0;
        margin: 10px 0;
    }

    .logos .staydown li {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .logos .staydown a:link {
        color: lightgray;
        text-decoration: none;
    }

    .logos .staydown a:visited {
        color: lightgray;
        text-decoration: none;
    }

    .logos .staydown a:hover {
        color: white;
        text-decoration: underline;
    }
</style>
