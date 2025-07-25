<script>
  import { openAiAssistant } from "$lib/services/openAiTools";
  import { models } from "$lib/data/models"; // Modellkonfigurasjon
  import ChatBlobs from "$lib/components/ChatBlobs.svelte"; // Komponent for å vise chatmeldinger
  import { onMount, tick } from "svelte";
  import { getHuginToken } from "$lib/useApi";
  import IconSpinner from "$lib/components/IconSpinner.svelte";
  import autosize from "svelte-autosize";
  import Modal from "$lib/components/Modal.svelte";
  import ModelChooser from "$lib/components/ModelChooser.svelte"; // Komponent for modellvelger
  import { checkRoles } from '$lib/helpers/checkRoles';
  import { markdownToHtml } from '$lib/helpers/markdown-to-html.js'
  import { generateUniqueId } from '$lib/helpers/unique-id.js'

  const modelTile = "orgbotter";

  // Init state - Modell-parametere og payload
  const userParams = $state({
    message: "",
    messageHistory: [],
    assistant_id: models.filter(model => model.metadata.tile === modelTile)[0].params.assistant_id,
    new_thread: true,
    thread_id: '',
    tile: modelTile
  })

  // Variabler for håndtering av data og innhold i frontend
  let modelId = $state(models.filter(m => m.metadata.tile === modelTile)[0].id);
  let modelinfoModell = $state(null) // $state(modelinfo[userParams.valgtModell].navn)
  let modelinfoBeskrivelse = $state("") // $state(modelinfo[userParams.valgtModell].beskrivelse)
  let modelTampering = $state(false) // Viser modellinformasjon
  let token = $state(null)
  let chatWindow = $state()
  let isWaiting = $state(false) // Venter på svar fra modell
  let isError = $state(false)
  let showModal = $state(false)
  let errorMessage = $state("")
  let inputMessage = $state("")
  let viewportWidth = $state(window.innerWidth)

  const { VITE_APP_NAME: appName, VITE_MOCK_API: mockApi } = import.meta.env

  // Kjører ved oppstart for å sette opp initial state
  valgtModell({
      target: {
        value: models.filter(model => model.metadata.tile === modelTile)[0].params.assistant_id
      }
    })

  // Starter med en velkomstmelding
  userParams.messageHistory.push({
    role: "assistant",
    content: `Velkommen til ${appName}! Hva kan jeg hjelpe deg med i dag?`,
    model: `${appName}`,
    uniqueId: generateUniqueId()
  })

  onMount(async () => {
    if (mockApi && mockApi === "true") {
      // Pretend to wait for api call
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    token = await getHuginToken(true)
  })

  // Fester scroll til bunnen av chatvinduet
  const scrollToBottom = async (node) => {
    if (!node) return;
    tick().then(() => {
      node.scroll({ top: node.scrollHeight, behavior: "smooth" })
    })
  }

  // Dette fikser scroll for brukerinput og AI output og "AI tenker"-chatboble
  //TODO: Uten if...else scroller chatbobler bare delvis og jeg skjønner ikke hvorfor....
  //TODO: Bilder scroller bare delvis, så ligger egen scrollToBottom i HandleFileSelect

  $effect(() => scrollToBottom(chatWindow));

  $effect(() => {
    if (isWaiting) {
      scrollToBottom(chatWindow);
    } else {
      scrollToBottom(chatWindow);
    }
  })

  $effect(() => {
  const updateWidth = () => {
      viewportWidth = window.innerWidth;
    };

    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  });


  // Logikk og funksjoner for håndtering av brukerinput og valg av modell

  // Håndterer valg av modell og oppdaterere modellinformasjon på siden
  function valgtModell(event) {
    const model = models.find(model => model.params.assistant_id === event.target.value)
    if (!model) {
      throw new Error("Modellen finnes ikke i konfigurasjonen.");
    }

    userParams.new_thread = true
    userParams.assistant_id = event.target.value
    modelId = model.id
    modelinfoModell = model.metadata.navn
    modelinfoBeskrivelse = model.metadata.description
    userParams.synligKontekst = model.metadata.synligKontekst
  }

  // Kaller på valgt modell med tilhørende parametre basert på brukerens valg 
  const brukervalg = async () => {
    isWaiting = true
    // Get the textarea and set the height -- Hvorfor er dette her?
    const textarea = document.querySelector("textarea")
    textarea.style.height = "60px"
    modelinfoModell = models.find(model => model.params.assistant_id === userParams.assistant_id).metadata.navn
    userParams.message = inputMessage
    inputMessage = ""
    userParams.messageHistory.push({
      role: "user",
      content: userParams.message,
      model: modelinfoModell,
      uniqueId: generateUniqueId()
    })

    try {
      const response = await openAiAssistant(userParams);
      userParams.messageHistory.push({ role: "assistant", content: response[0].messages[0].content[0].text.value, model: modelinfoModell, uniqueId: generateUniqueId() }); 
      userParams.new_thread = false
      userParams.thread_id = response[0].thread_id
    } catch (error) {
      isError = true;
      errorMessage = error;
      userParams.messageHistory.push({
        role: "assistant",
        content: "Noe gikk galt. Prøv igjen.",
        model: modelinfoModell,
        uniqueId: generateUniqueId()
      });
    } finally {
      isWaiting = false;
    }
  }


  // Håndterer tastetrykk i textarea
  const onKeyDown = async (e, callback) => {
    if (e.keyCode === 13 && !e.shiftKey) { // 13 is Enter key
      e.preventDefault()
      callback()
    }
  }

</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</svelte:head>

<main>
  {#if !token}
    <div class="loading">
      <IconSpinner width="32px" />
    </div>
    {:else if !checkRoles(token, [`${appName.toLowerCase()}.admin`, `${appName.toLowerCase()}.${modelTile}`])}
    <p>Oi, du har ikke tilgang. Prøver du deg på noe lurt? 🤓</p>
  {:else}

    <!-- For-each som itererer over modell-configfila og populerer select menyen -->
    <div class="modelTampering">
      <h2>Modellvelger</h2>
      <div class="boxyHeader">
        <ModelChooser handleModelChange={valgtModell} models={models} tile={modelTile} selectedModelId={modelId} useAssistantId={true} />
        <button id="modelinfoButton" class="link" onclick={() => { modelTampering = !modelTampering; showModal = true }}>
          <span class="button-text">Innstillinger</span>
        </button>
      </div>
    </div>

    <div class="output" bind:this={chatWindow}>
      {#if userParams.messageHistory.length === 1}
        <ChatBlobs
          role="assistant"
          content={userParams.messageHistory[0].content}
          assistant={`${appName}`}  />
      {:else if isWaiting}
        {#each userParams.messageHistory as chatMessage (chatMessage.uniqueId)}
          <ChatBlobs role={chatMessage.role} content={chatMessage.content} {...(chatMessage.role === "assistant" ? { assistant: chatMessage.model } : {})} />
        {/each}
        <ChatBlobs role="assistant" content="..." />
      {:else}
        {#each userParams.messageHistory as chatMessage (chatMessage.uniqueId)}
          {#if typeof chatMessage.content === "string"}
            <ChatBlobs 
              role={chatMessage.role} 
              content={chatMessage.content} 
              {...(chatMessage.role === "assistant" ? { assistant: chatMessage.model } : {})}
              />
          {/if}
        {/each}
      {/if}
    </div>
    
    <div class="brukerInputWrapper">
      <textarea 
        id="brukerInput" 
        use:autosize 
        name="askHugin" 
        autocomplete="off" 
        placeholder="Skriv inn ledetekst (Shift + Enter for flere linjer)" 
        bind:value={inputMessage}
        onkeydown={(e) => onKeyDown(e, brukervalg)}></textarea>

      {#if token.roles.some( (r) => [`${appName.toLowerCase()}.admin`].includes(r))}
        {#if isError}
          <Modal bind:showModal>
            {#snippet header()}
              <h2>Error</h2>
            {/snippet}
            <h3>Noe gikk galt ⛔</h3>
            <div class="centerstuff">
              <p>
                {JSON.stringify(
                  errorMessage.response?.data ||
                    errorMessage.stack ||
                    errorMessage.message
                )}
              </p>
            </div>
          </Modal>
        {/if}
      {/if}
      <label for="sendButton"><span class="material-symbols-outlined inputButton">send</span>
        <input id="sendButton" type="button" onclick={brukervalg} value={`Spør ${appName}`} style="display: none;"/>
      </label>
    </div>
  {/if}
  {#if appName === 'Hugin'}
    {#if (viewportWidth < 768)}
    <p id="disclaimer">Husk at språkmodeller lager tekst som kan inneholde feil. <a href="https://telemarkfylke.no/no/veileder-for-kunstig-intelligens/">Les mer om bruk av {appName} her.</a></p>
    {:else}
      <p id="disclaimer">
        Husk at språkmodeller lager tekst som kan inneholde feil. Vurder alltid om bruken av språkteknologi passer med formålet ditt.<br> 
        Ikke send inn data som kan være sensitive eller inneholder informasjon som ikke kan deles offentlig. <a href="https://telemarkfylke.no/no/veileder-for-kunstig-intelligens/">Les mer om bruk av {appName} her.</a>
      </p>
    {/if}
  {/if}
  {#if appName === 'Munin'}
  {#if (viewportWidth < 768)}
  <p id="disclaimer">Husk at språkmodeller lager tekst som kan inneholde feil. <a href="https://www.vestfoldfylke.no/no/meny/tjenester/opplaring/digitale-laringsressurser-til-videregaende-opplaring/veileder-for-kunstig-intelligens/">Les mer om bruk av {appName} her.</a></p>
  {:else}
    <p id="disclaimer">
      Husk at språkmodeller lager tekst som kan inneholde feil. Vurder alltid om bruken av språkteknologi passer med formålet ditt.<br> 
      Ikke send inn data som kan være sensitive eller inneholder informasjon som ikke kan deles offentlig. <a href="https://www.vestfoldfylke.no/no/meny/tjenester/opplaring/digitale-laringsressurser-til-videregaende-opplaring/veileder-for-kunstig-intelligens/">Les mer om bruk av {appName} her.</a>
    </p>
  {/if}
{/if}
  <Modal bind:showModal buttonText="Lagre">
    {#snippet header()}
        <h2 >{modelinfoModell}</h2>
      {/snippet}
    {#snippet mainContent()}
        <!-- eslint-disable svelte/no-at-html-tags -->
        <p>{@html markdownToHtml(modelinfoBeskrivelse)}</p>
      {/snippet}
    {#if userParams.synligKontekst}
    <textarea 
      use:autosize
      id="inputKontekst" 
      placeholder="Her kan du legge inn kontekst til språkmodellen." 
      bind:value={userParams.kontekst} 
      rows="4" 
      cols="auto">
    </textarea>
    <label for="temperatur">Temperatur: </label>
      <input type="range" id="temperatur" name="temperatur" min="0" max="2" step="0.1" bind:value={userParams.temperatur}/>
    {userParams.temperatur}
    {/if}
  </Modal>
</main>

<style>

main {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  height: calc(85vh);
  margin: 10px;
}

#modelinfoButton {
  border: 1px solid #ccc;
  padding: 3px 10px 3px 10px;
  background-color: #f5f5f5;
  border-radius: 1rem;
  text-decoration: none;
}

textarea {
    display: block;
    width: 100%;
    overflow-y: scroll;
    resize: none;
    min-height: 40px;
    max-height: 200px;
    line-height: 20px;
  }
  
  .brukerInputWrapper {
    display: flex;
    width: 100%;
    border: 1px solid #ccc;
    padding-left: 10px;
    background-color: #fffafa;
    position: relative;
    align-items: end;
  }

  #brukerInput {
    border: none;
    outline: none;
    background: none;
    flex-grow: 1;
    padding-top: 15px;
    padding-bottom: 5px;
  }

  #brukerInput::placeholder {
    padding-top: 5px;
  }

  #brukerInput:focus::placeholder {
  color: transparent;
  }

  .boxyHeader {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 5px 10px 10px 8px;
  }

  .material-symbols-outlined {
    font-size: 1.5rem;
  }

  label .material-symbols-outlined {
    cursor: pointer;
    background-color: var(--gress-10);
    font-size: 1.8rem;
    border-radius: 5px;
    padding: 5px;
    margin: 5px;
  }

  label .material-symbols-outlined:hover {
    background-color: var(--gress-50);
  }

  .output {
    padding-top: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 10px;
    height: 100vw;
    max-height: 1440px;
    width: 100%;
    overflow-y: scroll;
  }

  .modelTampering {
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 5px;
    margin-bottom: 10px;
    width: 100%;
  }

  @keyframes flash {
    0% {
      background-color: transparent;
    } 
    50% {
      background-color: #f1f59f;
    }
    100% {
      background-color: transparent;
    }
  }

  textarea#inputKontekst {
    padding: 10px;
    margin-top: 30px;
    margin-bottom: 10px;
    font-size: 16px;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .inputButton {
    margin-bottom: 10px !important;
  }

  #disclaimer {
    font-size: 14px;
    color: rgb(92, 92, 92);
    padding-top: 10px;
  }

  @media only screen and (max-width: 768px) {
    main {
      height: 100%; /*calc(80vh - 100px);*/
      margin: 2px;
      margin-bottom: 0; /* reduce bottom whitespace */
    }
    
    #disclaimer {
      font-size: 12px;
    }

    .modelTampering > h2 {
      font-size: 1rem;
    }

    .button-text {
      display: none;
    }

    #modelinfoButton {
      padding: 5px 9px 0 9px;
    }
    #modelinfoButton::before {
      content: "\e8b8"; /* Unicode for cog wheel icon */
      font-family: 'Material Icons', serif;
      font-size: 1.5rem;
    }
  }
</style>
