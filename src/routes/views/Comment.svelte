<script lang="ts">
    import type { PageProps, SubmitFunction } from "../$types";
    import type { FullComment, PreviewMob } from "$lib/db/types";
    import type { MobPreview } from "$lib/maplestory_api";
    import { applyAction, enhance } from "$app/forms";
    import { getContext } from "svelte";
    import ImageOrder from "$lib/elements/ImageOrder.svelte";
    import type { ImagePreview } from "$lib/elements/ImageOrder.svelte";
    import PreviewCanvas from "../canvas/PreviewCanvas.svelte";
    import { openDialog } from "$lib/dialog";

    let { form }: PageProps = $props();

    let commentContext: {
        comments: FullComment[];
    } = getContext("comments");

    let canvasWidth = $state<number>(0);
    let interval = $state<number>(300);
    let offset = $state<number>(0);
    let author = $state<string>("");
    let existingAuthor = $derived.by(() => {
        return commentContext.comments.some(
            (comment) => comment.author.name === author,
        );
    });
    let comment = $state<string>("");

    let selectedMapleId = $state<number | undefined>(undefined);
    let loadedFromDatabase = $state<boolean>(false);

    let mobPreviewData = $state<MobPreview | null>(null);
    let isLoadingMob = $state<boolean>(false);
    let mobError = $state<string | null>(null);

    let isLoadingComment = $state<boolean>(false);

    const commentHandler: SubmitFunction = ({ formData }) => {
        isLoadingComment = true;
        formData.set("interval", interval.toString());
        formData.set("offset", offset.toString());

        // If a MS mob was selected, add it to form data
        if (selectedMapleId !== undefined) {
            formData.set("id", selectedMapleId.toString());
        }

        formData.delete("stand"); // Remove any existing stand files
        formData.delete("move"); // Remove any existing move files

        // Convert base64 images to File objects and add to form data
        // This only needs to be done if the images aren't on the server yet
        // (so basically if it is a MS mob that has been used before, no need to convert)
        if (standFiles.length > 0 && standFiles[0].url.startsWith("data:")) {
            standFiles.forEach((file) => {
                const blob = dataURLtoBlob(file.url);
                const fileObj = new File([blob], file.name, {
                    type: blob.type,
                });
                formData.append("stand", fileObj);
            });
        }

        if (moveFiles.length > 0 && moveFiles[0].url.startsWith("data:")) {
            moveFiles.forEach((file) => {
                const blob = dataURLtoBlob(file.url);
                const fileObj = new File([blob], file.name, {
                    type: blob.type,
                });
                formData.append("move", fileObj);
            });
        }

        return async ({ result }) => {
            switch (result.type) {
                case "success":
                    if (result.data?.comment) {
                        const comment = result.data.comment as FullComment;
                        comment.delta = "now!";
                        const index = commentContext.comments.findIndex(
                            (comment) => comment.author.name === author,
                        );
                        if (index !== -1) {
                            // author already exists, update the comment
                            commentContext.comments[index] = comment;
                        } else {
                            commentContext.comments.push(comment);
                        }
                        form = result.data;
                    }
                    break;
                case "failure":
                    if (result.data) {
                        form = result.data;
                    }
                    break;
                case "error":
                    form = {
                        success: false,
                        error: result.error,
                    };
                    break;
                default:
                    break;
            }
            isLoadingComment = false;
            await applyAction(result);
        };
    };

    // Helper function to convert data URL to Blob
    function dataURLtoBlob(dataURL: string): Blob {
        const arr = dataURL.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    let standFiles = $state<ImagePreview[]>([]);
    let moveFiles = $state<ImagePreview[]>([]);

    let previewMob = $derived.by<PreviewMob>(() => {
        return {
            frames: {
                stand: standFiles.map((file) => file.url),
                move: moveFiles.map((file) => file.url),
            },
            interval: interval,
            offset: offset,
            author: author,
            comment: comment,
        };
    });

    function addImages(event: Event, images: ImagePreview[]) {
        const target = event.target as HTMLInputElement;
        if (!target.files) return;

        Array.from(target.files).forEach((file) => {
            images.push({
                name: file.name,
                url: URL.createObjectURL(file),
            } as ImagePreview);
        });

        images = [...images]; // need this to trigger reactivity
    }

    async function handleMobIdSubmit(event: Event) {
        event.preventDefault();

        const form = (event.target as HTMLButtonElement).closest("form");
        const input = form?.querySelector(
            'input[name="id"]',
        ) as HTMLInputElement;
        const mobId = input?.value;

        if (!mobId) {
            mobError = "Please enter a mob ID";
            return;
        }

        isLoadingMob = true;
        mobError = null;
        mobPreviewData = null;

        // first check if the mob is already in the db
        try {
            const response = await fetch(`/api/mob/maple?id=${mobId}`);
            const data = await response.json();
            if (response.ok) {
                mobPreviewData = data;
                selectedMapleId = parseInt(mobId);
                // add mob frames
                standFiles = Array.from(
                    { length: data.frames.stand },
                    (_, frame) => ({
                        name: `stand_${frame}.webp`,
                        url: `mobs/${data.id}/stand_${frame}.webp`,
                    }),
                );
                moveFiles = Array.from(
                    { length: data.frames.move },
                    (_, frame) => ({
                        name: `move_${frame}.webp`,
                        url: `mobs/${data.id}/move_${frame}.webp`,
                    }),
                );
                loadedFromDatabase = true;
                isLoadingMob = false;
                return;
            }
        } catch (error) {
            console.error("Error fetching mob:", error);
        }

        // download mob preview data since its not in the db
        try {
            const response = await fetch(`/api/mob/preview?id=${mobId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load mob");
            }

            mobPreviewData = data;
            selectedMapleId = parseInt(mobId);
            loadedFromDatabase = false;

            // Convert base64 images to ImagePreview format and update the preview
            standFiles = data.frames.stand.map(
                (url: string, index: number) => ({
                    name: `stand_${index}.png`,
                    url: url,
                }),
            );
            moveFiles = data.frames.move.map((url: string, index: number) => ({
                name: `move_${index}.png`,
                url: url,
            }));
        } catch (error) {
            mobError =
                error instanceof Error ? error.message : "Failed to load mob";
            console.error("Error loading mob:", error);
        } finally {
            loadedFromDatabase = false;
            isLoadingMob = false;
        }
    }

    function openDialogWrapper(e: MouseEvent) {
        // need this to cancel the form submission
        e.preventDefault();
        openDialog("FindMobID");
    }
</script>

<h1 class="maple">comment!</h1>
<hr />
<form
    enctype="multipart/form-data"
    method="POST"
    action="?/add_comment"
    use:enhance={commentHandler}
>
    <div class="inputbox py-2">
        <h2 class="maple">input</h2>
        <div class="mx-1 my-2 flex flex-row gap-4">
            <input
                class="monospace"
                type="text"
                name="name"
                placeholder="name"
                bind:value={author}
            />
            <input
                class="grow monospace"
                type="text"
                name="comment"
                placeholder="comment"
                bind:value={comment}
            />
        </div>
        {#if existingAuthor}
            <p class="monospace text-yellow-200 text-sm">
                Please note that there is already a commenter with the same
                name. If this is you then feel free to edit your comment by
                creating a new comment. If this is not, please be mindful of
                overwriting others' comments, and change your name to something
                else.
            </p>
        {/if}
    </div>
    <hr />
    <h2 class="maple pt-2">sprite</h2>
    <p class="monospace py-2">
        for your comments sprite, you can either manually upload the frames of a
        sprite that you want to use, or you can import a MapleStory mob to use
        as your sprite. you can drag frames to reorder them as you wish! if you
        don't do either one will be chosen for you!
    </p>
    <div class="monospace pt-2">
        <div>
            <p class="text-white pb-1">
                stand frames: {standFiles.length > 0
                    ? standFiles.map((file) => file.name).join(", ")
                    : "None"}
            </p>
            <label
                for="stand-upload"
                class="px-2 rounded {selectedMapleId !== undefined
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-white text-black cursor-pointer'}">Upload</label
            >
            <input
                id="stand-upload"
                type="file"
                name="stand"
                accept=".png, .jpg, .jpeg, .webp"
                multiple
                disabled={selectedMapleId !== undefined}
                onchange={(event) => addImages(event, standFiles)}
            />
            <ImageOrder
                bind:files={standFiles}
                disabled={selectedMapleId !== undefined}
            />
        </div>
        <div>
            <p class="text-white pb-1">
                moving frames: {moveFiles.length > 0
                    ? moveFiles.map((file) => file.name).join(", ")
                    : "None"}
            </p>
            <label
                for="move-upload"
                class="px-2 rounded {selectedMapleId !== undefined
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-white text-black cursor-pointer'}">Upload</label
            >

            <input
                id="move-upload"
                type="file"
                name="move"
                accept=".png, .jpg, .jpeg, .webp"
                multiple
                disabled={selectedMapleId !== undefined}
                onchange={(event) => addImages(event, moveFiles)}
            />
            <ImageOrder
                bind:files={moveFiles}
                disabled={selectedMapleId !== undefined}
            />
        </div>
    </div>
    <div class="flex justify-center items-center monospace">
        <p>-- or --</p>
    </div>
    <div class="monospace py-2">
        <label for="id">enter a MapleStory mob ID:</label>
        <input class="monospace" type="text" name="id" placeholder="id" />
        <button
            class="bg-white text-black my-2 px-2 rounded cursor-pointer"
            onclick={handleMobIdSubmit}
            disabled={isLoadingMob}
            >{isLoadingMob ? "Loading..." : "Submit"}</button
        >
        <button
            class="bg-white text-black my-2 px-2 rounded cursor-pointer"
            onclick={openDialogWrapper}>How do I find an ID?</button
        >
        {#if mobError}
            <p class="text-red-500 mt-2">{mobError}</p>
        {/if}
        {#if mobPreviewData}
            <p class="text-green-500 mt-2">
                {mobPreviewData.name
                    ? `Successfully loaded: ${mobPreviewData.name}`
                    : "Successfully loaded"}
                {#if loadedFromDatabase}
                    <span class="text-gray-500"
                        >(loaded from cache, so interval/offset locked)</span
                    >
                {/if}
            </p>
        {/if}
    </div>

    <div
        class="monospace py-2 gap-2 flex flex-row justify-around items-center w-full"
    >
        <div class="flex flex-row flex-wrap gap-2 justify-center items-center">
            <input
                type="range"
                id="interval"
                min="100"
                max="400"
                step="1"
                disabled={loadedFromDatabase}
                bind:value={interval}
            />
            <label class="text-nowrap" for="interval"
                >Interval: {interval}ms</label
            >
        </div>
        <div class="flex flex-row flex-wrap gap-2 justify-center items-center">
            <input
                type="range"
                id="offset"
                min="-25"
                max="25"
                step="1"
                disabled={loadedFromDatabase}
                bind:value={offset}
            />
            <label class="text-nowrap" for="offset">Offset: {offset}px</label>
        </div>
    </div>

    <div
        bind:clientWidth={canvasWidth}
        class="pb-4 h-[351px] overflow-y-hidden"
    >
        <PreviewCanvas mob={previewMob} width={canvasWidth} height={300} />
    </div>

    <div class="flex flex-row gap-2 results monospace mb-4">
        <button
            class="monospace shrink-0 bg-white text-black px-2 rounded cursor-pointer h-6"
            formaction="?/add_comment"
            >{isLoadingComment ? "Loading..." : "Submit Comment"}</button
        >
        <div>
            {#if form?.success}
                <p class="text-green-500">
                    Comment added successfully! You should be able to see it
                    below now.
                </p>
            {:else if form?.error}
                <p class="text-red-500">Error: {form.error}</p>
            {/if}
        </div>
    </div>
</form>

<style>
    input[type="text"] {
        padding: 5px;
        color: white;
        background: black;
        border: 1px solid white;
        border-radius: 5px;
        min-width: 100px;
    }

    input[type="file"] {
        display: none;
    }
</style>
