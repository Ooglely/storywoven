<script lang="ts">
    import creed from "./creed.webp";
    import second from "./second.png";
</script>

<div class="monospace flex flex-col gap-2">
    <div class="flex flex-row justify-between">
        <p class="p-auto">
            What is SHELGOAT CREED ? <br />
            1.The reason I live <br />
            2.The definition of happiness <br />
            3.The man that lets me survive <br />
            4.The reason I have a job <br />
            5.The true colors of joy
        </p>
        <img width="200" class="p-2" src={creed} alt="Sheldon Creed" />
    </div>
    <img class="p-2" src={second} alt="Sheldon Creed" />
    <iframe
        class="self-center"
        width="528"
        height="300"
        src="https://www.youtube.com/embed/QAOoJAZT9so?si=ANNUkWWsXTXaCt88"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
    ></iframe>
</div>
