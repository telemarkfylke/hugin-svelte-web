<script>
    import katex from 'katex';
    import showdown from 'showdown';
      import { tekstTilTale } from "../../lib/services/openAiTools"
// Props
    export let role = 'user'
    export let content = 'content'
    let converter = new showdown.Converter()

    function parseAiResponse(content) {
        // Extract LaTeX expressions to prevent markdown interference
        let latexExpressions = [];
        content = content.replace(/(\$\$[\s\S]+?\$\$|\$[^\$]+\$|\\\[([\s\S]+?)\\\]|\\\((.+?)\\\))/g, (match) => {
            latexExpressions.push(match);
            return `___LATEX${latexExpressions.length - 1}___`;
        });

        // Convert markdown to HTML
        let html = converter.makeHtml(content);

        // Replace placeholders with rendered LaTeX
        latexExpressions.forEach((expr, index) => {
            let displayMode = expr.startsWith('$$') || expr.startsWith('\\[');
            // Remove delimiters
            expr = expr.replace(/^\$\$|^\$|^\\\(|^\\\[|\$\$$|\$$|\\\)|\\\]$/g, '');
            let rendered = katex.renderToString(expr, { throwOnError: false, displayMode });
            html = html.replace(`___LATEX${index}___`, rendered);
        });

        return html;
    }

    // Add the textToSpeech function
    async function textToSpeech(text) {
        // Call another function with text as a parameter
        // anotherFunction(text);
        try {
            let r = await tekstTilTale(text);
            let lyd = new Audio("data:audio/wav;base64," + r);
            lyd.play();

        } catch (error) {
            console.error("Error in textToSpeech:", error);
        }
    }

</script>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
</head>

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
                    {@html parseAiResponse(content)}
                    {#if role === "assistant"}
                        <button class="speaker-icon" on:click={() => textToSpeech(content)}>
                            <!-- Loudspeaker icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path d="M3 9v6h4l5 5V4L7 9H3z"/>
                            </svg>
                        </button>
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

    .chat-blob-content {
        background-color: var(--himmel-10);
        border-radius: 1rem;
        border: 1px solid var(--himmel-80);
        padding: 0.5rem 1rem;
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

    .speaker-icon {
        background: none;
        border: none;
        cursor: pointer;
        margin-left: 0.5rem;
    }
</style>
