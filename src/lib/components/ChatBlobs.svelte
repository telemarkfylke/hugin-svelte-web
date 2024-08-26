<script>
    import SvelteMarkdown from 'svelte-markdown'
    import katex from 'katex';
    import showdown from 'showdown';
// Props
    export let role = 'user'
    export let content = 'content'
    const test = `(a + b)^2 = a^2 + +2ab + b^2`
	const render = (s) => katex.renderToString(s)
    let converter = new showdown.Converter()
    let test2 = converter.makeHtml("Hello **World**" + render(test))

    // Function to convert string from markdown to valid HTML with showdown.
    // It also substitutes the LaTeX code with the corresponding HTML using katex.
    function parseAiResponse(s) {
        // Replace all LaTeX expressions
        s = s.replace(/\\\[(.*?)\\\]/g, (_, match) => `$$${match}$$`);
        s = s.replace(/\\\((.*?)\\\)/g, (_, match) => `$${match}$`);
        s = s.replace(/\s*\\\[\s*(.*?)\s*\\\]/gs, (_, match) => `$${match}$`);
        // s = s.replace(/\s*\\\[\s*(.*?)\s*\\\]/s, (_, match) => `$${match}$`);
        // s = s.replace(/\s*\\\[\s*\n(.*?)\n\s*\\\]/s, (_, match) => `$$${match}$$`);
        // console.log(s)

        // Convert markdown to HTML
        let html = converter.makeHtml(s);

        // Replace <em> and </em> with _
        html = html.replace(/<em>/g, '_ ').replace(/<\/em>/g, '_ ')
        let htmlWithKatex = html.replace(/\$\$(.*?)\$\$/g, (_, match) => {
            return katex.renderToString(match, { throwOnError: false });
        }).replace(/\$(.*?)\$/g, (_, match) => {
            return katex.renderToString(match, { throwOnError: false });
        });
        return htmlWithKatex
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
