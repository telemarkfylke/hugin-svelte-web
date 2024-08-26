<script>
    // Props
    export let title
    export let open = false

</script>

<div class="infoBox">
    <button class="title" on:click={() => { open = !open } }><span class="material-symbols-outlined">{open ? 'keyboard_arrow_down' : 'chevron_right'}</span><strong>{title}</strong></button>
    {#if open}
        <div class="content">
            <slot/>
        </div>
    {/if}
</div>

<style>
    .infoBox {
        background-color: var(--vann-10);
        margin-bottom: 1rem;
    }
    .title {
        border: 0px;
        border-radius: 0px;
        padding: 5px;
        width: 100%;
        display: flex;
        align-items: center;
        background-color: var(--vann-20);
    }
    .title:hover {
        cursor: pointer;
        background-color: var(--vann-40);
    }
    .content {
        padding: 40px;
    }


    @media only screen and (max-width: 768px) {
        /* For mobile phones: */
        .title {
            width: 100%;
        }
    }  
</style>