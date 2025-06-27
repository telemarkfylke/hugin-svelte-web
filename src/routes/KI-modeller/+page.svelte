<script>
  import { responseOpenAi } from "$lib/services/openAiTools";
  import { multimodalMistral } from "$lib/services/mistralTools";
  import { noraChat } from "$lib/services/huggingFaceTools";
  import { models } from "$lib/data/models"; // Modellkonfigurasjon
  import ChatBlobs from "$lib/components/ChatBlobs.svelte"; // Komponent for å vise chatmeldinger
  import { onMount, tick } from "svelte";
  import { getHuginToken } from "$lib/useApi";
  import IconSpinner from "$lib/components/IconSpinner.svelte";
  import autosize from "svelte-autosize";
  import Modal from "$lib/components/Modal.svelte";
  import { handleFileSelect } from "$lib/helpers/fileHandler.js"; // Import the file handler
  import { markdownToHtml } from '$lib/helpers/markdown-to-html.js'

  // Variabler for håndtering av data og innhold i frontend
  let imageFiles = $state(null);
  let dokFileInput = $state(null);
  /*let fileSelect = $state(false);*/
  let modelinfoModell = $state("");
  let modelinfoBeskrivelse = $state("");
  let modelTampering = $state(false); // Viser modellinformasjon
  let token = $state(null);
  let chatWindow = $state();
  let isWaiting = $state(false); // Venter på svar fra modell
  let isError = $state(false);
  let showModal = $state(false);
  let errorMessage = $state("");
  let inputMessage = $state("");
  let viewportWidth = $state(window.innerWidth);
  let filArray = $state([]);

  const { VITE_APP_NAME: appName, VITE_MOCK_API: mockApi } = import.meta.env

  // Initiell state - Modell-parametere og payload som sendes til proxy-api
  let message = $state("");
  let response_id = $state(null);
  let imageB64 = $state([]);
  let dokFiles = $state([]);
  let model = $state("gpt-4.1");
  let messageHistory = $state([]);
  let kontekst = $state("");
  let valgtModell = $state("0");
  let temperatur = $state(0.7); // Default temperatur
  let synligKontekst = $state(true);


  // Starter med en velkomstmelding
  messageHistory = [{
    role: "assistant",
    content: `Velkommen til ${appName}! Hva kan jeg hjelpe deg med i dag?`,
    model: `${appName}`
  }];

  // Oppdaterer modellinformasjon basert på valgt modell med $effect
  $effect(() => {
    const selectedModel = models.find(m => m.id === valgtModell);
    if (selectedModel) {
      model = selectedModel.params.model;
      modelinfoModell = selectedModel.metadata.navn;
      modelinfoBeskrivelse = selectedModel.metadata.description;
      synligKontekst = selectedModel.metadata.synligKontekst;
    }
  });

  // Henter token og setter opp event listeners
  onMount(async () => {
    if (mockApi && mockApi === "true") {
      // Pretend to wait for api call
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    token = await getHuginToken(true);
    
    const updateWidth = () => {
      viewportWidth = window.innerWidth;
    };
    
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  });

  // Fester scroll til bunnen av chatvinduet
  const scrollToBottom = async (node) => {
    if (!node) return;
    await tick();
    node.scroll({ top: node.scrollHeight, behavior: "smooth" });
  };

  // Dette fikser scroll for brukerinput og AI output og "AI tenker"-chatboble
  $effect(() => {
    if (chatWindow) {
      scrollToBottom(chatWindow);
    }
  });

  $effect(() => {
    if (messageHistory.length > 0 || isWaiting) {
      scrollToBottom(chatWindow);
    }
  });

  // Logikk og funksjoner for håndtering av brukerinput og valg av modell

  // Håndterer valg av modell
  function handleModelChange(event) {
    valgtModell = event.target.value;
  }

  // Hjelpefunksjon som samler alle parametere og bundler til et objekt
  function getRequestParams() {
    return {
      message,
      response_id,
      imageB64,
      dokFiles,
      model,
      messageHistory,
      kontekst,
      valgtModell,
      temperatur,
      synligKontekst,
      filArray
    };
  }

  // Kaller på valgt modell med tilhørende parametre basert på brukerens valg 
  const brukervalg = async () => {
    if (!inputMessage.trim()) return; // Fix for å unngå tom input
    
    isWaiting = true;
    // Get the textarea and set the height
    const textarea = document.querySelector("textarea");
    textarea.style.height = "60px";
    
    message = inputMessage;
    inputMessage = "";
    
    messageHistory = [...messageHistory, { role: "user", content: message, model: modelinfoModell }];

    try {
      let response;
      const params = getRequestParams();
      if (valgtModell === "0") {
        response = await responseOpenAi(params);
        response_id = response.data.id; // Til bruk i api-kallet for å oppdatere historikken i samtalen
        messageHistory = [...messageHistory, { role: "assistant", content: response.data.output_text, model: modelinfoModell }];
      } else if (valgtModell === "1") {
        response = await noraChat(params);
        messageHistory = [...messageHistory, { role: "assistant", content: response, model: modelinfoModell }];
      } else if (valgtModell === "13") {
        response = await multimodalMistral(params);
        messageHistory = [...messageHistory, { role: "assistant", content: response.choices[0].message.content, model: modelinfoModell }];
      } else {
        throw new Error("Ugyldig modellvalg");
      }
    } catch (error) {
      isError = true;
      errorMessage = error;
      messageHistory = [...messageHistory, {
        role: "assistant",
        content: "Noe gikk galt. Prøv igjen.",
        model: modelinfoModell
      }];
    } finally {
      isWaiting = false;
    }
  }

  // Bruker handleFileSelect fra filHandler.js for å håndtere filopplasting
  const onFileSelect = async (event) => {
    const result = await handleFileSelect(event, {
      messageHistory,
      imageFiles,
      dokFileInput,
      imageB64,
      dokFiles,
      filArray
    });
    
    // Update state variables with the returned values
    messageHistory = result.messageHistory;
    imageB64 = result.imageB64;
    dokFiles = result.dokFiles;
    filArray = result.filArray;
    /*fileSelect = result.fileSelect;*/
  }

  // Håndterer tastetrykk i textarea
  const onKeyPress = (e, callback) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      callback();
    }
  }

  // Toggles for UI elements
  const toggleModelInfo = () => {
    modelTampering = !modelTampering;
    showModal = true;
  };
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</svelte:head>

<main>
  {#if !token}
    <div class="loading">
      <IconSpinner width="32px" />
    </div>
  {:else if !token.roles.some( (r) => [`${appName.toLowerCase()}.basic`, `${appName.toLowerCase()}.admin`].includes(r) )}
    <p>Oi, du har ikke tilgang. Prøver du deg på noe lurt? 🤓</p>
  {:else}

    <!-- Modellvelger som itererer over modell-confogfila -->
    <div class="modelTampering">
      <h2>Modellvelger</h2>
      <div class="boxyHeader">
        <select class="modellSelect" onchange={handleModelChange}>
          {#each models as model (model.id)}
            {#if model.metadata.tile === "chat"}
              <option value={model.id}>{model.metadata.navn}</option>
            {/if}
          {/each}
        </select>
        <button id="modelinfoButton" class="link" onclick={toggleModelInfo}>
          <span class="button-text">Innstillinger</span>
        </button>
      </div>
    </div>

    <div class="output" bind:this={chatWindow}>
      {#if messageHistory.length === 1}
        <ChatBlobs
          role="assistant"
          content={messageHistory[0].content}
          assistant={`${appName}`}  />
      {:else if isWaiting}
        {#each messageHistory as chatMessage (chatMessage.content)}
          <ChatBlobs role={chatMessage.role} content={chatMessage.content} {...(chatMessage.role === "assistant" ? { assistant: chatMessage.model } : {})} />
        {/each}
        <ChatBlobs role="assistant" content="..." />
      {:else}
        {#each messageHistory as chatMessage (chatMessage.content)}
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
        onkeypress={(e) => onKeyPress(e, brukervalg)}></textarea>

      {#if token.roles.some( (r) => [`${appName.toLowerCase()}.admin`].includes(r))}
        {#if valgtModell === "0" }
        <label for="fileButton"><span class="material-symbols-outlined inputButton">picture_as_pdf</span>
          <input id="fileButton" type="file" bind:files={dokFileInput} onchange={onFileSelect} accept=".pdf" multiple style="display:none;" />
        </label>
        <label for="imageButton"><span class="material-symbols-outlined inputButton">add_photo_alternate</span>
          <input id="imageButton" type="file" bind:files={imageFiles} onchange={onFileSelect} accept="image/*" multiple style="display: none;"/></label>
        {/if}
        {#if valgtModell === "13" }
          <label for="imageButton"><span class="material-symbols-outlined inputButton">add_photo_alternate</span>
            <input id="imageButton" type="file" bind:files={imageFiles} onchange={onFileSelect} accept="image/jpeg" multiple style="display: none;"/></label>
        {/if}
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
      <h2>{modelinfoModell}</h2>
    {/snippet}
    {#snippet mainContent()}
      <!-- eslint-disable svelte/no-at-html-tags -->
      <p>{@html markdownToHtml(modelinfoBeskrivelse)}</p>
    {/snippet}
    {#if synligKontekst}
      <textarea 
        use:autosize
        id="inputKontekst" 
        placeholder="Her kan du legge inn kontekst til språkmodellen." 
        bind:value={kontekst} 
        rows="4" 
        cols="auto">
      </textarea>
      <label for="temperatur">Temperatur: </label>
      <input type="range" id="temperatur" name="temperatur" min="0" max="2" step="0.1" bind:value={temperatur}/>
      {temperatur}
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

  .modellSelect {
    padding: 10px;
    border-radius: 1rem;
    border: 1px solid #ccc;
    background-color: #f5f5f5;
    width: 26rem;
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

    .modellSelect {
      width: 320px;
      margin-right: 5px;
    }

    .modelTampering > h2 {
      font-size: 1rem;
    }

    .button-text {
      display: none;
    }

    #modelinfoButton {
      padding: 5px 9px 0px 9px;
    }
    #modelinfoButton::before {
      content: "\e8b8"; /* Unicode for cog wheel icon */
      font-family: 'Material Icons';
      font-size: 1.5rem;
    }
  }
</style>
