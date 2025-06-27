<script>
	import { run, self, createBubbler, stopPropagation } from 'svelte/legacy';

	const bubble = createBubbler();
	/**
	 * @typedef {Object} Props
	 * @property {any} showModal - boolean
	 * @property {string} [buttonText] - string
	 * @property {import('svelte').Snippet} [header]
	 * @property {import('svelte').Snippet} [children]
	 * @property {import('svelte').Snippet} [mainContent]
	 * @property {import('svelte').Snippet} [saveButton]
	 */

	/** @type {Props} */
	let {
		showModal = $bindable(),
		buttonText = "Lukk",
		header,
		children,
		mainContent,
		saveButton
	} = $props();
	let dialog = $state(); // HTMLDialogElement

	run(() => {
		if (dialog && showModal) dialog.showModal();
	});
	
	const closeModal = () => {
		// Endable scrolling when modal is closed
		document.body.style.height = "auto";
		document.body.style.overflow = "auto";
		dialog.close();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<dialog
	bind:this={dialog}
	onclose={() => (showModal = false)}
	onclick={self(() => closeModal())}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={stopPropagation(bubble('click'))}>
		{@render header?.()}
		<hr />
		{@render children?.()}
		<div class="mainContent">
			{#if mainContent}{@render mainContent()}
			{/if}
		</div>
		<!-- svelte-ignore a11y_autofocus -->
        <div class="buttons">
            {@render saveButton?.()}
		    <button autofocus onclick={() => closeModal()}>{buttonText}</button>
        </div>
	</div>
</dialog>

<style>
	dialog {
		max-width: 45em;
		border-radius: 0.2em;
		height: fit-content;
        max-height: 41em;
		border: none;
		padding: 0;
		overflow: hidden;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.mainContent {
		display: flex;
		justify-content: center;
		margin: auto;
		padding: 10px;
		overflow: auto;
		-ms-overflow-style: none;  /* Internet Explorer 10+ */
    	scrollbar-width: none;  /* Firefox */
		max-height:24em;
		margin-bottom: 2em;
	}

	.mainContent::-webkit-scrollbar {
		display: none; /* Safari and Chrome */
	}

    .buttons {
        display: flex;
        margin-top: auto;
		margin-bottom: 10px;
        gap: 1rem;
        flex-wrap: wrap;
        flex-direction: row;
        justify-content: center;
    }
</style>
