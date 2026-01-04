<script lang="ts">
    import { openDialog } from "$lib/dialog";
</script>

<h1 class="maple">about!</h1>
<hr />
<h2 class="maple py-2">about me...</h2>
<p class="maple pb-2">
    Hello, I'm Alen. Some may also know me by my online aliases, oog and
    waterfarer. I'm 21 y/o. I'm currently a senior studying Computer
    Engineering, with a little bit of EE sprinkled in.
</p>
<p class="maple pb-2">
    I've had an interest in development and robotics for a while. I self-taught
    myself how to code when I was younger through YouTube tutorials. Nowadays,
    I'm a part of a drone design team on my campus, where we've made multiple
    autonomous drones for both competitions and research purposes. I'm hoping to
    turn this into a career of some kind, whether it's embedded work, full-stack
    stuff (lol) or digging more into the EE side of things.
</p>
<p class="maple pb-2">
    I loooove music, and love to collect physical media (vinyls, cds, casettes,
    etc.) You can find some of my favorite albums below. Once I graduate and
    have more time I want to pick up my guitar again.
</p>
<div class="flex flex-row flex-wrap justify-around gap-2 pb-2">
    <div class="maple max-w-xs`">
        These are some of my favorite "things" EVER:
        <ul>
            <li>
                • <button onclick={() => openDialog("Source")}
                    >Counter-Strike: Source</button
                >
            </li>
            <li>• Cherries</li>
            <li>
                • <button onclick={() => openDialog("SheldonCreed")}
                    >Sheldon Creed</button
                >
            </li>
            <li>
                • <button onclick={() => openDialog("HaynesKing")}
                    >Haynes King</button
                >
            </li>
            <li>• Princess Mononoke [1997]</li>
            <li>
                • <button onclick={() => openDialog("Indy")}>IndyCar</button>
            </li>
        </ul>
    </div>
    <div class="maple">
        My favorite albums:
        <ul class="text-wrap max-w-xs">
            <li>
                • <button onclick={() => openDialog("StarsFellOnTrench")}
                    >quinn - stars fell on trench</button
                >
            </li>
            <li>• Fuck - Conduct</li>
            <li>• Bedbug - i'll count to heaven in years without seasons</li>
            <li>
                • <a href="https://soundcloud.com/tr1nket" target="_blank"
                    >the entire trinket discography</a
                >
            </li>
            <li>• Jane Remover - Frailty</li>
        </ul>
    </div>
    <div class="maple">
        Some goals of mine right now:
        <ul>
            <li>• learn Fusion 360 before I lose my free access</li>
            <li>• finish pugBot finally</li>
            <li>• graduate</li>
            <li>• start getting through the to-do list in my notebook :sob:</li>
            <li>• run a 10k</li>
        </ul>
    </div>
</div>
<hr />
<h2 class="maple py-2">about the site...</h2>
<p class="maple pb-2">
    I started this site with the idea of making some kind of portfolio
    website... but then I realized how boring that was. So I did whatever this
    is instead! It pulls a lot of inspiration from my friends websites, and
    random sites I've run into on <a
        href="https://neocities.org/"
        target="_blank">neocities</a
    >.
</p>
<p class="maple pb-2">
    This site was built with Svelte and SvelteKit. I love Svelte! If for some
    reason you want to look at the source, you can find it
    <a href="https://github.com/Ooglely/storywoven" target="_blank">here</a>.
</p>
<p class="maple pb-4">
    A lot of the assets, like <button
        onclick={() => openDialog("MaplestoryMap")}>the background</button
    >, the ground, and the cursors, are ripped from the MapleStory game files.
    The game holds a special place in my heart, even though I didn't even play
    it that much!
</p>

<style>
    a,
    button {
        transition:
            text-shadow 0.6s ease,
            color 0.6s ease;
        text-decoration: underline;
    }

    a:hover,
    button:hover {
        color: var(--color-yellow-100);
        text-shadow: 0px 0px 8px var(--color-yellow-100);
    }
</style>
