<script lang="ts">
    let {
        files = $bindable(),
        disabled = false,
    }: { files: ImagePreview[]; disabled: boolean } = $props();

    export interface ImagePreview {
        name: string;
        url: string;
    }

    let dragElement = $state<HTMLDivElement | undefined>();
    let shadowElement = $state<HTMLDivElement>();
    let menuElement = $state<HTMLDivElement>();

    let menuElementHeight = $state<number>(0);

    function getElementIndex(element: Element): number | null {
        const children = Array.from(element.parentElement?.children || []);
        const index = children.indexOf(element);
        if (index === -1) return null;
        return index;
    }

    // Event handlers for drag and drop ordering

    function handleDragStart(event: DragEvent) {
        if (event.target) {
            const target = event.target as HTMLImageElement;
            target.style.opacity = "0.5";
            dragElement = target.parentElement as HTMLDivElement;
        }
    }

    function handleDragEnd(event: DragEvent) {
        if (event.target) {
            const target = event.target as HTMLImageElement;
            target.style.opacity = "1";
            dragElement = undefined;
            shadowElement!.classList.add("hidden");
        }
    }

    function handleDragPlacement(event: DragEvent) {
        // Enter and over
        event.preventDefault();
        if (event.target && event.target !== dragElement && menuElement) {
            const target = event.target as HTMLImageElement;
            const elementX = event.x - target.getBoundingClientRect().left;
            const halfX = target.width / 2;
            shadowElement!.classList.remove("hidden");
            let menuX = menuElement.getBoundingClientRect().left;
            if (elementX < halfX) {
                // Before this element
                shadowElement!.style.left = `${target.getBoundingClientRect().left - menuX + 8}px`;
            } else {
                // After this element
                shadowElement!.style.left = `${target.getBoundingClientRect().left - menuX + target.width + 28}px`;
            }
        }
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        if (event.target) {
            const target = event.target as HTMLImageElement;
            target.style.border = "2px solid transparent";
        }
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        if (event.target && dragElement) {
            const target = event.target as HTMLImageElement;

            let targetIndex = getElementIndex(
                target.parentElement as HTMLDivElement,
            );
            let dragIndex = getElementIndex(dragElement);
            if (targetIndex === null || dragIndex === null) return;

            const elementX = event.x - target.getBoundingClientRect().left;
            const halfX = target.width / 2;

            if (dragIndex < targetIndex) {
                targetIndex -= 1;
            }
            if (elementX > halfX && files!.length - 1 !== targetIndex) {
                targetIndex += 1;
            }
            if (dragIndex === targetIndex) return; // No change

            // Actually reorder the files
            files.splice(targetIndex, 0, files.splice(dragIndex, 1)[0]);
            files = [...files]; // need this to trigger reactivity
        }
    }

    function removeImage(event: MouseEvent) {
        event.preventDefault();

        const index = getElementIndex(event.target as HTMLElement);
        if (index === null) return;

        files.splice(index, 1);
        files = [...files]; // need this to trigger reactivity
    }
</script>

<div
    class="flex flex-row overflow-x-scroll h-full py-2 scrollbar"
    bind:this={menuElement}
    bind:clientHeight={menuElementHeight}
>
    {#each files as file}
        <div class="relative shrink-0 flex flex-col">
            <img
                class="px-2 border-2 border-transparent object-contain mt-auto {disabled
                    ? 'cursor-not-allowed'
                    : 'grab'}"
                src={file.url}
                alt={file.name}
                title={file.name}
                draggable={!disabled}
                ondragstart={handleDragStart}
                ondragend={handleDragEnd}
                ondragenter={handleDragPlacement}
                ondragover={handleDragPlacement}
                ondragleave={handleDragLeave}
                ondrop={handleDrop}
            />
            <button
                class="absolute right-0 top-0 cursor-pointer"
                onclick={removeImage}
                aria-label="Remove Image"
                {disabled}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    {/each}
    {#if !files || files.length === 0}
        <div class="flex grow justify-center items-center">
            <p>No frames selected</p>
        </div>
    {:else}
        <div
            class="absolute w-1 bg-yellow-300 rounded-md hidden"
            style="height: {menuElementHeight - 16}px;"
            bind:this={shadowElement}
        ></div>
    {/if}
</div>

<style>
    .scrollbar {
        scrollbar-width: thin;
        scrollbar-gutter: stable;
    }

    .grab {
        cursor: url("../../../static/cursor/grab_0.png"), grab;
    }

    .grab:active {
        cursor: url("../../../static/cursor/grab_1.png"), grabbing !important;
    }
</style>
