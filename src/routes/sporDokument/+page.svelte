<script>
  import { docQueryOpenAi } from "$lib/services/openAiTools"
  import ChatBlobs from "$lib/components/ChatBlobs.svelte"; // Komponent for å vise chatmeldinger
  import { onMount, tick } from "svelte";
  import { getHuginToken } from "$lib/useApi";
  import IconSpinner from "$lib/components/IconSpinner.svelte";
  import autosize from "svelte-autosize";
  import { checkRoles } from '$lib/helpers/checkRoles';
  import { generateUniqueId } from '$lib/helpers/unique-id.js'

  // Init state - Modell-parametere og payload
  const userParams = $state({
    message: "",
    response_id: null,
    vectorStore_id: null,
    imageB64: [],
    dokFiles: [],
    messageHistory: [],
    kontekst: "",
    valgtModell: "0",
    temperatur: 0.7, // Default temperatur
    synligKontekst: true,   
    new_thread: true,  
  })

  // Variabler for håndtering av data og innhold i frontend
  let dokFiles = $state(null);
  let token = $state(null)
  let chatWindow = $state()
  let isWaiting = $state(false) // Venter på svar fra modell
  const isError = $state(false)
  let inputMessage = $state("")
  let viewportWidth = $state(window.innerWidth)

  const { VITE_APP_NAME: appName, VITE_MOCK_API: mockApi } = import.meta.env

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

  // Håndterer tastetrykk i textarea
  const onKeyDown = async (e, callback) => {
    if (e.keyCode === 13 && !e.shiftKey) { // 13 is Enter key
      e.preventDefault()
      callback()
    }
  }

  let hasRun = false;
  $effect(() => {
    if (dokFiles && dokFiles.length > 0 && !hasRun) {
      handleDokFilesChange();
      hasRun = true;
    }
})

function handleDokFilesChange() {
  let dokNames = ""
  for (const dokFile of dokFiles) {
    dokNames += `${dokFile.name} \n\n`
  }
  userParams.messageHistory.push({
    role: "user",
    content: "**Du har lastet opp filen(e):** \n\n" + dokNames,
    uniqueId: generateUniqueId()
  })
}

  async function sporDokument() {
    // ToDo: sjekk at det er valgt fil
    // Disable fileInput-button
    document.getElementById("fileButton").disabled = true
    userParams.dokFiles = dokFiles
    isWaiting = true
    userParams.message = inputMessage
    inputMessage = ""
    userParams.messageHistory.push({
      role: "user",
      content: userParams.message,
      uniqueId: generateUniqueId()
    })
    try {
      const respons = await docQueryOpenAi(userParams);
      userParams.response_id = respons.id
      userParams.vectorStore_id = respons.tools[0].vector_store_ids[0]
      userParams.new_thread = false
      userParams.messageHistory.push({
        role: "assistant",
        content: respons.output_text,
        model: `${appName}`,
        uniqueId: generateUniqueId()
      })
      isWaiting = false
    } catch (e) {
      console.log("Oj, noe gikk galt!", e);
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
  {:else if !checkRoles(token, [`${appName.toLowerCase()}.admin`, `${appName.toLowerCase()}.dokumentchat`])}
    <p>Oi, du har ikke tilgang. Prøver du deg på noe lurt? 🤓</p>
  {:else}

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
        onkeydown={(e) => onKeyDown(e, sporDokument)}></textarea>
        <label for="fileButton"><span class="material-symbols-outlined inputButton">cloud_upload</span>
          <input style="display:none;" bind:files={dokFiles} id="fileButton" multiple type="file" accept=".docx, .pdf, .txt, .json, .md, .pptx" />
        </label>
        {#if isError}
          {console.log("Error:")}
        {/if}

      <label for="sendButton"><span class="material-symbols-outlined inputButton">send</span>
        <input id="sendButton" type="button" onclick={sporDokument} value={`Spør ${appName}`} style="display: none;"/>
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
  }
</style>
