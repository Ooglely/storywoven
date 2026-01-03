<script lang="ts">
    import type { LastFMResponse } from "../../routes/api/lastfm/+server";

    let song_data: Promise<LastFMResponse> = (async () => {
        const response = await fetch("/api/lastfm");
        if (!response.ok) {
            throw new Error(`Error fetching song data: ${response.statusText}`);
        }
        return (await response.json()) as LastFMResponse;
    })();
</script>

{#await song_data}
    <div class="monospace">
        <p>loading song data...</p>
    </div>
{:then data}
    <div
        class="monospace relative max-w-xl w-max min-w-12 whitespace-nowrap box-content"
    >
        <div class="absolute -top-3 left-4 bg-bg px-1">
            {#if data.delta == "right now!"}
                <p>i am currently listening to...</p>
            {:else}
                <p>i last listened to...</p>
            {/if}
        </div>
        <div
            class="monospace flex flex-row p-3 min-w-80 border border-gray-600 rounded-lg"
        >
            {#if data.image}
                <img
                    class="w-20 h-20 object-cover"
                    src={data.image}
                    alt="Album Art"
                />
            {:else}
                <div
                    class="w-20 h-20 bg-bg flex items-center justify-center border"
                >
                    <p class="text-gray-400 text-lg">?</p>
                </div>
            {/if}
            <div class="flex flex-1 flex-col justify-center pl-3 min-w-0">
                <p
                    class="font-black text-yellow-100 text-shadow-yellow-300/50 text-shadow-xs truncate"
                >
                    {data.name}
                </p>
                <div class="flex flex-row items-center truncate">
                    <p class="text-gray-300">by&nbsp;</p>
                    <p>{data.artist}</p>
                </div>
                {#if data.album}
                    <div class="flex flex-row items-center truncate">
                        <p class="text-gray-300">on&nbsp;</p>
                        <p>{data.album}</p>
                    </div>
                {/if}
            </div>
        </div>
        <div class="absolute -bottom-3 right-4 bg-bg px-2">
            <p>{data.delta}</p>
        </div>
    </div>
{:catch error}
    <p class="monospace">Error loading song data: {error.message}</p>
{/await}
