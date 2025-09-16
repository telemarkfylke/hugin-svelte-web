<script>
  import { streamResponseOpenAi, responseOpenAi } from "$lib/services/openAiTools";
  import { multimodalMistral } from "$lib/services/mistralTools";
  import { noraChat } from "$lib/services/huggingFaceTools";
  import { models } from "$lib/data/models"; // Modellkonfigurasjon
  import ChatBlobs from "$lib/components/ChatBlobs.svelte"; // Komponent for å vise chatmeldinger
  import { onMount, tick } from "svelte";
  import { getHuginToken } from "$lib/useApi";
  import IconSpinner from "$lib/components/IconSpinner.svelte";
  import autosize from "svelte-autosize";
  import Modal from "$lib/components/Modal.svelte";
  import ModelChooser from "$lib/components/ModelChooser.svelte"; // Komponent for modellvelger
  import { handleFileSelect } from "$lib/helpers/fileHandler.js"; // Import the file handler
  import { markdownToHtml } from '$lib/helpers/markdown-to-html.js'
  import { generateUniqueId } from "$lib/helpers/unique-id.js"
  import { studieledetekst } from '$lib/data/systemprompts'

  // Variabler for håndtering av data og innhold i frontend
  let imageFiles = $state(null);
  let dokFileInput = $state(null);
  /*let fileSelect = $state(false);*/
  let modelinfoModell = $state("");
  let modelinfoBeskrivelse = $state("");
  let studiemodus = $state(false); // For å aktivere studiemodus
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
  
  const modelTile = 'chat'

  const { VITE_APP_NAME: appName, VITE_MOCK_API: mockApi } = import.meta.env

  const defaultModel = models.find(m => m.metadata.tile === modelTile && m.metadata.default)?.id || '6'; // Standard valgt modell, "6" for ChatGPT-4.1 (gpt-4.1)
  
  // Initiell state - Modell-parametere og payload som sendes til proxy-api
  let message = $state("");
  let response_id = $state(null);
  let imageB64 = $state([]);
  let dokFiles = $state([]);
  let model = $state("gpt-4.1"); // Brukes kun på OpenAI-modellen
  let messageHistory = $state([]);
  let kontekst = $state("");
  let isFirstPrompt = $state(true); // For å sjekke om det er første prompt
  let valgtModell = $state(defaultModel) ; // Standard valgt modell, "6" for ChatGPT-4.1 (gpt-4.1)
  let temperatur = $state(0.7); // Default temperatur
  let synligKontekst = $state(true);
  let isStreaming = $state(false); // For å håndtere streaming state
  let currentStreamingMessage = $state(""); // For å samle streamed innhold


  // Starter med en velkomstmelding
  messageHistory = [{
    role: "assistant",
    content: `Velkommen til ${appName}! Hva kan jeg hjelpe deg med i dag?`,
    model: `${appName}`,
    uniqueId: generateUniqueId()
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

    // Aktiver studiemodus automatisk for elever
    if (token.upn && token.upn.endsWith("@skole.telemarkfylke.no")) {
      studiemodus = true;
    }
    
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
      studiemodus,
      isFirstPrompt,
      valgtModell,
      temperatur,
      synligKontekst,
      filArray
    };
  }

  // Kaller på valgt modell med tilhørende parametre basert på brukerens valg 
  const brukervalg = async () => {
    if (!inputMessage.trim()) return; // Fix for å unngå tom input
    
    // Modeller som bruker streaming (Foreløpig kun GPT-5 og GPT-4.1)
    // Men ikke når vi har PDF-filer - da bruker vi non-streaming
    if ((valgtModell === "0" || valgtModell === "6") && dokFiles.length === 0) {
      await streamingBrukervalg();
      return;
    }
    
    // Modeller som ikke bruker streaming
    isWaiting = true;
    // Get the textarea and set the height
    const textarea = document.querySelector("textarea");
    textarea.style.height = "60px";
    
    message = inputMessage;
    inputMessage = "";

    // Håndtering av kontekst og studiemodus for første prompt
    let apiMessage = message; // Melding som sendes til API (Inkluderer kontekst og studiemodus)
    const displayMessage = message; // Melding som vises
    
    if (isFirstPrompt) {
      if (kontekst) {
        apiMessage = `${kontekst}\n\n${apiMessage}`;
      }
      if (studiemodus) {
        apiMessage = `${studieledetekst.ledetekst}\n\n${apiMessage}`;
      }
    }
    
    // Legger til brukermelding i historikken i to versjoner. En med og en uten kontekst
    messageHistory = [...messageHistory, {
      role: "user",
      content: displayMessage, // UI
      fullContent: apiMessage, // API
      model: modelinfoModell,
      uniqueId: generateUniqueId()
    }];

    try {
      // Da er vi ikke på første prompt lenger
      if (isFirstPrompt) {
        isFirstPrompt = false;
      }

      // Sender inn komplett melding inkludert kontekst til API-et
      message = apiMessage;
      const params = getRequestParams(); // Hent alle parametere
      if (valgtModell === "1") { // Nora
        const response = await noraChat(params);
        messageHistory = [...messageHistory, { role: "assistant", content: response, model: modelinfoModell, uniqueId: generateUniqueId() }];
        return;
      } else if (valgtModell === "13" || valgtModell === "20") { // Mistral
        const response = await multimodalMistral(params);
        messageHistory = [...messageHistory, { role: "assistant", content: response.choices[0].message.content, model: modelinfoModell, uniqueId: generateUniqueId() }];
        return;
      } else if (valgtModell === "0" || valgtModell === "6") { // OpenAI models
        const response = await responseOpenAi(params);
        messageHistory = [...messageHistory, { role: "assistant", content: response.data.output_text, model: modelinfoModell, uniqueId: generateUniqueId() }];
        return;
      }
      // Hvis et eller annet skjer med modellvalget
      throw new Error("Ugyldig modellvalg");
    } catch (error) {
      isError = true;
      errorMessage = error;
      messageHistory = [...messageHistory, {
        role: "assistant",
        content: "Noe gikk galt. Prøv igjen.", // Når API-et feiler
        model: modelinfoModell,
        uniqueId: generateUniqueId()
      }];
    } finally {
      isWaiting = false;
    }
  }

  // Streamingversjon for OpenAI-modellene (Trenger gjennomgang)
  const streamingBrukervalg = async () => {
    if (!inputMessage.trim()) return; // Hvis bruker bare trykker send uten innhold

    // Check if we have PDF files and GPT-4.1 model - use non-streaming endpoint
    if (dokFiles.length > 0 && valgtModell === "6") {
      await brukervalg();
      return;
    }

    isWaiting = true;
    isStreaming = false;
    currentStreamingMessage = ""; // Buffervariabel til å ta i mot streamen
    
    // Get the textarea and set the height
    const textarea = document.querySelector("textarea");
    textarea.style.height = "60px";
    
    message = inputMessage;
    inputMessage = ""; // Tømmer inputfeltet

    try {
      // Handle different file upload scenarios
      if (imageB64.length > 0) {
        // For image uploads: add text message and create multimodal content
        messageHistory = [...messageHistory, {
          role: "user",
          content: message,
          model: modelinfoModell,
          uniqueId: generateUniqueId()
        }];

        const content = [{ type: 'text', text: message }];
        for (const imageBase64 of imageB64) {
          content.push({
            type: 'image_url',
            image_url: { url: imageBase64 }
          });
        }
        // Update the last message with multimodal content for API processing
        messageHistory[messageHistory.length - 1].apiContent = content;
      } else if (dokFiles.length > 0) {
        // For PDF uploads: add text message (files already added by fileHandler)
        messageHistory = [...messageHistory, {
          role: "user",
          content: message,
          model: modelinfoModell,
          uniqueId: generateUniqueId()
        }];
      } else {
        // For text-only messages
        messageHistory = [...messageHistory, {
          role: "user",
          content: message,
          model: modelinfoModell,
          uniqueId: generateUniqueId()
        }];
      }

      // console.log("Alle meldinger som skal sendes:", alleMeldinger);

          // Lager en "hjelpemedling" som skal fylles med streaminginnhold med egen ID
        const assistantMessageId = generateUniqueId();
        messageHistory = [...messageHistory, { role: "assistant", content: "", model: modelinfoModell, uniqueId: assistantMessageId, isStreaming: true }];


      // Create the messages array for API, using apiContent when available
      const apiMessages = messageHistory.map(msg => {
        if (msg.apiContent) {
          return { ...msg, content: msg.apiContent };
        }
        return msg;
      });

      const streamParams = {
        messages: apiMessages,  // Use processed messages for API
        model: model,
        kontekst: kontekst,
        studiemodus: studiemodus,
        isFirstPrompt: isFirstPrompt,
        dokFiles: dokFiles
      };


      // Dropp temperatur for gpt-5
      if (model !== 'gpt-5') {
        streamParams.temperature = temperatur;
      }

      const response = await streamResponseOpenAi(streamParams);
      
      // Kodeblokken under tar seg av streamingen
      // Stream connection established, hide spinner and start streaming
      isStreaming = true;
      
      // Set isFirstPrompt to false after first use (for streaming)
      if (isFirstPrompt) {
        isFirstPrompt = false;
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const data = part.replace("data: ", "").trim();
            if (data === "[DONE]") {
              isStreaming = false;
              // Update final message without streaming flag
              messageHistory = messageHistory.map(msg => 
                msg.uniqueId === assistantMessageId 
                  ? { ...msg, content: currentStreamingMessage, isStreaming: false }
                  : msg
              );
              return;
            }
            try {
              const json = JSON.parse(data);
              const token = json.choices[0]?.delta?.content || "";
              if (token) {
                currentStreamingMessage += token;
                // Update the streaming message in real-time
                messageHistory = messageHistory.map(msg => 
                  msg.uniqueId === assistantMessageId 
                    ? { ...msg, content: currentStreamingMessage }
                    : msg
                );
              }
            } catch (err) {
              console.error("Bad chunk:", data, err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      isError = true;
      errorMessage = error;
      // Update the assistant message with error
      const assistantMessageId = generateUniqueId();
      messageHistory = messageHistory.map(msg => 
        msg.uniqueId === assistantMessageId 
          ? { ...msg, content: "Noe gikk galt. Prøv igjen.", isStreaming: false }
          : msg
      );
    } finally {
      isWaiting = false;
      isStreaming = false;
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
  const onKeyDown = (e, callback) => {
    if (e.keyCode === 13 && !e.shiftKey) { // 13 is Enter key
      e.preventDefault();
      callback();
    }
  }

  // Toggles for UI elements
  const toggleModelInfo = () => {
    modelTampering = !modelTampering;
    showModal = true;
  };

  // Tilbakestill samtalen til initial state
  const resetConversation = () => {
    messageHistory = [{
      role: "assistant",
      content: `Velkommen til ${appName}! Hva kan jeg hjelpe deg med i dag?`,
      model: `${appName}`,
      uniqueId: generateUniqueId()
    }];
    inputMessage = "";
    imageFiles = null;
    dokFileInput = null;
    imageB64 = [];
    dokFiles = [];
    filArray = [];
    response_id = null;
    isFirstPrompt = true;
    isError = false;
    errorMessage = "";
    isStreaming = false;
    currentStreamingMessage = "";
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

    <!-- Modellvelger som itererer over modell-configfila -->
    <div class="modelTampering">
      <h2>Modellvelger</h2>
      <div class="modelSection">
        <div class="modelButtonRow">
          <div class="modelButtons">
            <ModelChooser handleModelChange={handleModelChange} models={models} tile={modelTile} selectedModelId={valgtModell} useModelId={true} />
          </div>
          <div class="rightControls">
            <label class="checkboxLabel" class:disabled={valgtModell !== "0" && valgtModell !== "6"}>
              <input type="checkbox" bind:checked={studiemodus} disabled={valgtModell !== "0" && valgtModell !== "6"} />
              <span class="checkboxText">Aktiver studiemodus</span>
            </label>
            <button id="modelinfoButton" class="link" onclick={toggleModelInfo}>
              <span class="button-text">Innstillinger</span>
            </button>
          </div>
        </div>
      </div>
    </div>


    <div class="output" bind:this={chatWindow}>
      {#if messageHistory.length === 1} <!-- Kun velkomstmelding -->
        <ChatBlobs
          role="assistant"
          content={messageHistory[0].content}
          assistant={`${appName}`}  />
      {:else if isWaiting}
        {#each messageHistory as chatMessage (chatMessage.uniqueId)} <!-- Venter på respons -->
          <ChatBlobs 
            role={chatMessage.role} 
            content={chatMessage.content} 
            isStreaming={chatMessage.isStreaming || false}
            {...(chatMessage.role === "assistant" ? { assistant: chatMessage.model } : {})} />
        {/each}
        {#if !isStreaming}
          <div class="streaming-waiting">
            <div class="streaming-spinner">
              <IconSpinner width="20px" />
              <span>Venter på respons...</span>
            </div>
          </div>
        {/if}
      {:else}
        {#each messageHistory as chatMessage (chatMessage.uniqueId)} <!-- Viser hele samtalen -->
          {#if typeof chatMessage.content === "string"} <!-- Sikre at innholdet er en streng ifm grums når streaming starter opp -->
            <ChatBlobs 
              role={chatMessage.role} 
              content={chatMessage.content} 
              isStreaming={chatMessage.isStreaming || false}
              {...(chatMessage.role === "assistant" ? { assistant: chatMessage.model } : {})}
              />
          {/if}
        {/each}
      {/if}
    </div>
    
    <div class="brukerInputWrapper">
      <label for="resetButton" title="Tilbakestill samtalen og start på nytt"><span class="material-symbols-outlined inputButton">refresh</span>
        <input id="resetButton" type="button" onclick={resetConversation} value="Ny samtale" style="display: none;"/>
      </label>
      <textarea 
        id="brukerInput" 
        use:autosize 
        name="askHugin" 
        autocomplete="off" 
        placeholder="Skriv inn ledetekst (Shift + Enter for flere linjer)" 
        bind:value={inputMessage}
        onkeydown={(e) => onKeyDown(e, brukervalg)}></textarea>

      {#if token.roles.some( (r) => [`${appName.toLowerCase()}.admin`].includes(r))}
        {#if valgtModell === "0" || valgtModell === "6" }
        <label for="fileButton" title="Last opp PDF-dokumenter for analyse"><span class="material-symbols-outlined inputButton">picture_as_pdf</span>
          <input id="fileButton" type="file" bind:files={dokFileInput} onchange={onFileSelect} accept=".pdf" multiple style="display:none;" />
        </label>
        {/if}
        {#if valgtModell === "0" || valgtModell === "6" }
        <label for="imageButton" title="Last opp bilder for analyse"><span class="material-symbols-outlined inputButton">add_photo_alternate</span>
          <input id="imageButton" type="file" bind:files={imageFiles} onchange={onFileSelect} accept="image/*" multiple style="display: none;"/></label>
        {/if}
        {#if valgtModell === "13" }
          <label for="imageButton" title="Last opp JPEG-bilder for analyse"><span class="material-symbols-outlined inputButton">add_photo_alternate</span>
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
      <label for="sendButton" title="Send melding til AI-modellen"><span class="material-symbols-outlined inputButton">send</span>
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

  .modelSection {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 5px 10px 10px 8px;
  }

  .modelButtonRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .modelButtons {
    display: flex;
    justify-content: flex-start;
  }

  .rightControls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .checkboxLabel {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #333;
  }

  .checkboxLabel input[type="checkbox"] {
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
    accent-color: #007acc;
  }

  .checkboxText {
    user-select: none;
  }

  .checkboxLabel.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .checkboxLabel.disabled input[type="checkbox"] {
    cursor: not-allowed;
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

  .streaming-waiting {
    padding: 20px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .streaming-spinner {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #1976d2;
    font-size: 0.9rem;
    padding: 15px 20px;
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e9ecef;
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

    .modelSection {
      gap: 0.75rem;
      padding: 5px 8px 8px 8px;
    }

    .modelButtonRow {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .rightControls {
      flex-direction: row;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .checkboxLabel {
      font-size: 0.85rem;
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
