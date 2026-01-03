<script lang="ts">
    import type { Attachment } from "svelte/attachments";

    let menuOpen = $state(false);

    // Import all the views
    import About from "../views/About.svelte";
    import Comment from "../views/Comment.svelte";
    import Hello from "../views/Hello.svelte";
    import Links from "../views/Links.svelte";

    function viewFade(key: string): Attachment {
        return (element: Element) => {
            const el = element as HTMLElement;
            el.style.transition = "opacity 0.3s ease";

            if (key === activeKey) {
                el.style.opacity = "1";
                el.style.zIndex = "10";
            } else {
                el.style.opacity = "0";
                el.style.zIndex = "0";
            }
        };
    }

    let activeKey: keyof typeof viewComponents = $state("hello");

    let viewComponents = {
        hello: Hello,
        comment: Comment,
        about: About,
        links: Links,
    };
    function loadView(key: keyof typeof viewComponents) {
        activeKey = key;
    }
</script>

<div class="base image">
    <div class="navbar shrink-0">
        <div class="logo">
            <button onclick={() => loadView("hello")}  >
                <img src="/logo_test.png" alt="Logo"/>
            </button>

        </div>
        <div class="menu">
            {#each Object.keys(viewComponents) as name}
                <button class="relative navbar-buttons"
                    onclick={() =>
                        loadView(name as keyof typeof viewComponents)}
                    >
                        <img class="absolute -left-1.5 top-2 -z-10" src="nav/{name}.png" alt="{name}"/>
                        <p>{name}</p>
                </button>
            {/each}
            <button aria-label="menu" class="navbar-menu" onclick={() => menuOpen = !menuOpen}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-10">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>
        </div>
    </div>

    {#if menuOpen}
        <div class="menu absolute bg-navbar z-40 top-16 w-full flex flex-col items-end px-4">
            {#each Object.keys(viewComponents) as name}
                <button class="relative w-full text-end" onclick={() => {
                    loadView(name as keyof typeof viewComponents);
                    menuOpen = false;
                }}>
                    <img width="32" height="32" class="absolute -right-3 -z-10" src="nav/{name}.png" alt="{name}"/>
                    <p>{name}</p>
                </button>
            {/each}
        </div>
    {/if}

    <div class="content mx-8">
        {#each Object.entries(viewComponents) as [key, Component]}
            <div
                class="container opacity-0"
                {@attach viewFade(key)}
            >
                <Component />
            </div>
        {/each}
    </div>
</div>

<style>
    .base {
        display: flex;
        flex-direction: column;
        background-color: rgb(20, 21, 19);
        color: white;
        height: 100%;
        width: 100%;
        border-radius: 10px;
        image-rendering: auto;
    }

    .navbar-menu {
        display: none;
    }

    @media (max-width: 500px) {
        .base {
            border-radius: 0px 0px 10px 10px;
        }
    }

    @media (max-width: 800px) {
        .navbar-menu {
            display: flex;
        }

        .navbar-buttons {
            display: none;
        }
    }



    .base .navbar {
        height: 64px;
        overflow: hidden;
        display: flex;
        position: sticky;
        background-color: rgb(30, 32, 29);
        border-radius: 10px 10px 0px 0px;
    }

    .base .navbar .logo {
        height: 100%;
        width: 300px;
    }

    .base .navbar .menu {
        display: flex;
        flex-grow: 1;
        flex-direction: row;
        height: 100%;
        justify-content: end;
        align-items: center;
    }

    .base .menu button,
    .base .navbar .menu button {
        font-family: "Maplestory", sans-serif;
        font-weight: 900;
        font-size: 1.5rem;
        height: 100%;
        color: white;
        text-decoration: none;
        padding: 0 1.25rem;
        align-items: center;
        user-select: none;
    }

    .base .menu button p,
    .base .navbar .menu button p {
        transition: text-shadow 0.6s ease;
    }

    .base .menu button:hover p,
    .base .navbar .menu button:hover p {
        text-shadow: 0px 0px 16px rgb(255, 232, 130);
    }

    .base .content {
        flex-grow: 1;
        position: relative;
        max-height: 100%;
    }

    .base .content .container {
        position: absolute;
        height: 100%;
        width: calc(100% + 32px);
        max-width: calc(100% + 32px);
        padding-right: 32px;
        padding-top: 16px;
        overflow-x: hidden;
        overflow-y: scroll;
        box-sizing: border-box;
        scrollbar-color: white black;
        scrollbar-arrow-color: white;
    }

    .base .content .container > :global(*) {
        max-width: 100%;
        overflow-x: hidden;
    }
</style>
