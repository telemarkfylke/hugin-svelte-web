<script>
    import SvelteMarkdown from 'svelte-markdown'
// Props
    export let role = 'user'
    export let content = 'content'
</script>

<div class="{role}">
    {#if content === ""}
        <div class="hidden">
            <p>{content}</p>
        </div>
    {:else}
        <div class="chat-blob-content">
            {#if content.startsWith("data:image")}
                <img src={content} alt="Bilde" />
            {:else if content.startsWith("data:application/pdf")}
                <p>{content}</p>
            {:else}
                {#if content === "..."}
                    <div class="loader"></div>
                {:else}
                    <SvelteMarkdown source={ content } />
                {/if}
            {/if}
        </div>
    {/if}
</div>

<style>    
    .user {
        display: flex;
        flex-direction: row-reverse;
        margin: 0.5rem;
        border-radius: 10px 10px 0 10px;
    }

    .assistant {
        display: flex;
        flex-direction: row;
        margin: 0.5rem;
    }

    .chat-blob-content {
        background-color: var(--himmel-10);
        border-radius: 1rem;
        padding: 1.5rem;
        margin: 0.5rem;
        max-width: 90%;
    }

    .user .chat-blob-content {
        background-color: var(--himmel-30);
    }

    img {
        max-width: 400px;
        height: auto;
    }

    .loader {
    width: 30px;
    aspect-ratio: 2;
    --_g: no-repeat radial-gradient(circle closest-side,#000 90%,#0000);
    background: 
        var(--_g) 0%   50%,
        var(--_g) 50%  50%,
        var(--_g) 100% 50%;
    background-size: calc(100%/3) 50%;
    animation: l3 1s infinite linear;
    }
    @keyframes l3 {
        20%{background-position:0%   0%, 50%  50%,100%  50%}
        40%{background-position:0% 100%, 50%   0%,100%  50%}
        60%{background-position:0%  50%, 50% 100%,100%   0%}
        80%{background-position:0%  50%, 50%  50%,100% 100%}
    }
</style>
