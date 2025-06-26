<script>
    import { markdownToHtml } from '../helpers/markdown-to-html.js'

    /**
     * @typedef {Object} Props
     * @property {string} [role] - Props
     * @property {string} [content]
     */

    /** @type {Props} */
    let { role = 'user', content = 'content', assistant = '' } = $props();
</script>
<svelte:head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
</svelte:head>

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
                    {@html markdownToHtml(content)}
                    {#if role !== 'user'}
                        <div class="assistantInfo">
                            {assistant}
                        </div>
                    {/if}

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

    .assistantInfo {
        position: absolute;
        top: -18px;
        left: 10px;
        border: 1px solid var(--himmel-80);
        font-size: 0.8rem;
        color: var(--himmel-100);
        text-align: left;
        background-color: var(--himmel-10);
        padding: 2px 5px;
        border-radius: 5px;
    }

    .chat-blob-content {
        position: relative;
        background-color: var(--himmel-10);
        border-radius: 1rem;
        border: 1px solid var(--himmel-80);
        padding: 0.2rem 1rem;
        margin: 0.2rem;
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
