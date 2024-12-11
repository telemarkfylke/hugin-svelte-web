<script>
  import { docQueryOpenAi } from "$lib/services/openAiTools"
  import { multimodalOpenAi, noraChat, openAiAssistant } from "../../lib/services/openAiTools"
  import { multimodalMistral } from "$lib/services/mistralTools"
  import { modelinfo } from "../../lib/data/modelinfo" // Tekstbeskrivelser om valgt modell
  import ChatBlobs from "$lib/components/ChatBlobs.svelte" // Komponent for å vise chatmeldinger
  import ModelInfo from "../../lib/components/ModelInfo.svelte"
  import "@material/web/button/elevated-button"
  import { onMount, afterUpdate } from "svelte"
  import { getHuginToken } from "../../lib/useApi"
  import IconSpinner from "../../lib/components/IconSpinner.svelte"
  import autosize from 'svelte-autosize';
  import Modal from "../../lib/components/Modal.svelte"

  // Modell-parametere og payload
  const userParams = {
    message: "",
    assistant_id: "",
    newThread: true,
    threadId: "",
    messageHistory: [],
    kontekst: "",
    valgtModell: "option1", // Default modell GPT-4o
    base64String: "",
    temperatur: 0.7, // Default temperatur
    synligKontekst: true,  
    assistant: "docQuery",
    newThread: true,
    threadId: "",
    vectorStoreId: "",      
    fil: "Fil ikke valgt",
    filArray: "",
  }

  // Variabler for håndtering av data og innhold i frontend
  let files;
  let svar;
  let showModal = false
  let selectedFiles = []
  let respons
  let modelinfoModell = modelinfo[userParams.valgtModell].navn
  let modelinfoBeskrivelse = modelinfo[userParams.valgtModell].description
  let modelTampering = false // Viser modellinformasjon
  let token = null
  let chatWindow
  let isWaiting = false // Venter på svar fra modell
  let isError = false
  let errorMessage = ""
  let inputMessage = ""
  const appName = import.meta.env.VITE_APP_NAME

  // Starter med en velkomstmelding
  userParams.messageHistory.push({
    role: "assistant",
    content: `Velkommen til ${appName}! Hva kan jeg hjelpe deg med i dag?`,
  })

  onMount(async () => {
    if ( import.meta.env.VITE_MOCK_API && import.meta.env.VITE_MOCK_API === "true" ) {
      // Pretend to wait for api call
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    token = await getHuginToken(true)
  })

  // Fester scroll til bunnen av chatvinduet
  const scrollToBottom = async (node) => {
    node.scroll({ top: node.scrollHeight, behavior: "smooth" })
  }

  // Håndterer valg av modell og oppdaterere modellinformasjon på siden
  function valgtModell(event) {
    userParams.valgtModell = event.target.value
    modelinfoModell = modelinfo[userParams.valgtModell].navn
    modelinfoBeskrivelse = modelinfo[userParams.valgtModell].description
    userParams.synligKontekst =
    modelinfo[userParams.valgtModell].synligKontekst
  }

  // Kaller på valgt modell med tilhørende parametre basert på brukerens valg
  const brukervalg = async () => {
    isWaiting = true
    // Get the textarea and set the height
    const textarea = document.querySelector("textarea")
    textarea.style.height = "60px"
    userParams.message = inputMessage
    inputMessage = ""
    try {
      // GPT-4o
      if (userParams.valgtModell === "option1") {
        userParams.messageHistory.push({
          role: "user",
          content: userParams.message,
        })
        respons = await multimodalOpenAi(userParams)
        userParams.messageHistory.push({ role: "assistant", content: respons })
        scrollToBottom(chatWindow)
        isWaiting = false

      // Nora
      }  else if (userParams.valgtModell === "option2") {
        userParams.synligKontekst = false
        const message = userParams.message
        userParams.messageHistory.push({
          role: "user",
          content: message,
        })
        respons = await noraChat(userParams)
        userParams.messageHistory.push({ role: "assistant", content: respons })
        scrollToBottom(chatWindow)
        isWaiting = false

      // Fagbotter - Matematikk og Geologi
      } else if (userParams.valgtModell === "option3" || userParams.valgtModell === "option4"  || userParams.valgtModell === "option5" || userParams.valgtModell === "option6" || userParams.valgtModell === "option7" || userParams.valgtModell === "option8") {
        userParams.messageHistory.push({
          role: "user",
          content: userParams.message,
        })
        respons = await openAiAssistant(userParams)
        userParams.messageHistory.push({ role: "assistant", content: respons.messages[0].content[0].text.value })
        userParams.newThread = false
        userParams.threadId = respons.thread_id
        scrollToBottom(chatWindow)
        isWaiting = false
      }

      // Pixtral
      else if (userParams.valgtModell === "option13") {
        userParams.messageHistory.push({
          role: "user",
          content: userParams.message,
        })
        respons = await multimodalMistral(userParams)
        console.log("History:", userParams.messageHistory)
        userParams.messageHistory.push({ role: "assistant", content: respons })
        scrollToBottom(chatWindow)
        isWaiting = false
      }
    } catch (error) {
      isError = true
      errorMessage = error
      isWaiting = false
      userParams.messageHistory.push({
        role: "assistant",
        content: "Noe gikk galt. Prøv igjen.",
      })
    }
  }

// Justerer størrelsen på opplastede bilder
const resizeBase64Image = (base64, width, height) => {
    // Opprett et canvas-element
    const canvas = document.createElement('canvas');
    // Opprett et bilde-element fra base64-strengen
    const image = new Image();
    image.src = base64;
    // Returner en Promise som løses når bildet er lastet
    return new Promise((resolve, reject) => {
        image.onload = () => {
            // Beregn bildets aspektforhold
            const aspectRatio = image.width / image.height;
            // Beregn beste passform-dimensjoner for canvas
            if (width / height > aspectRatio) {
                canvas.width = height * aspectRatio;
                canvas.height = height;
            } else {
                canvas.width = width;
                canvas.height = width / aspectRatio;
            }
            // Tegn bildet på canvas
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
            }
            // Løs Promisen med det skalerte bildet som en base64-streng
            resolve(canvas.toDataURL('image/jpeg'));
        };
        image.onerror = reject;
    });
};

  // Konverterer opplastet fil til base64
  const handleFileSelect = async (event) => {
    selectedFiles = event.target.files
    const file = selectedFiles[0]

    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          userParams.messageHistory.push({
            role: "user",
            content: await resizeBase64Image(reader.result, 400, 400),
          })
          userParams.base64String = reader.result
        } catch (error) {
          console.log("Noe gikk galt", error)
        }
      }
      reader.readAsDataURL(file) // This method reads the file as a base64 string
    }
  }

  $: if (respons && chatWindow) {
    scrollToBottom(chatWindow)
  }

  const onKeyPress = async (e, callback) => {
    if (e.charCode === 13 && !e.shiftKey) {
      e.preventDefault()
      scrollToBottom(chatWindow)
      callback()
    }
  }

  // Fester scroll til bunnen av chatvinduet etter oppdatering av chatvinduet
  afterUpdate(() => {
    if (respons && chatWindow && userParams.message.length === 0) {
      scrollToBottom(chatWindow)
    }
  })

  // beta-sjekk
  let isBeta = false;
  if (window.location.search.includes('?beta')) {
  isBeta = true;
  }

  async function sporDokument() {
    userParams.fil = files ? files[0].name : "Ingen fil valgt"
    isWaiting = true
    userParams.message = inputMessage
    inputMessage = ""
    userParams.messageHistory.push({
          role: "user",
          content: userParams.message,
        })
    try {
      respons = await docQueryOpenAi(files, userParams).then((response) => {
        const l = JSON.parse(response).data.messages.length;
        svar = JSON.parse(response).data.messages[l - 1].content[0].text.value;
        // Get last message from data.messages
        userParams.newThread = false;
        userParams.vectorStoreId = JSON.parse(response).data.vectorStore_id;
        userParams.threadId = JSON.parse(response).data.thread_id;
        userParams.fil = files[0].name;
      });
      userParams.messageHistory.push({ role: "assistant", content: svar });
      scrollToBottom(chatWindow)
      isWaiting = false
    } catch (e) {
      console.log("Oj, noe gikk galt!", e);
    }
  }
</script>

<main>
  {#if !token}
    <div class="loading">
      <IconSpinner width={"32px"} />
    </div>
  {:else if !token.roles.some( (r) => [`${appName.toLowerCase()}.basic`, `${appName.toLowerCase()}.admin`].includes(r) )}
    <p>Oi, du har ikke tilgang. Prøver du deg på noe lurt? 🤓</p>
  {:else}
    <div class="modelTampering">
      <h2>Modellvelger</h2>
      <div class="boxyHeader">
        <select class="modellSelect" on:change={valgtModell}>
          <option value="option1" default>GPT-4o</option>
          <option value="option13">Mistral</option>
          <option value="option2">Nora - Eksperimentell</option>
          <option value="option3">Matematikkens byggesteiner</option>
          <option value="option4">Teoretisk matematikk Nivå 1</option>
          <option value="option5">Teoretisk matematikk Nivå 2</option>
          <option value="option8">Geologi - Eksperimentell</option>
        </select>
        <div class="showNhideBtns">
          {#if modelTampering}
            <button class="link" on:click={() => { modelTampering = !modelTampering }}>
              Trykk her for å lukke<span class="material-symbols-outlined">keyboard_arrow_up</span>
            </button>
          {:else}
            <button id="modelinfoButton" class="link" on:click={() => { modelTampering = !modelTampering }}>
              Trykk her for å legge inn kontekst og systemledetekster<br>
              Les mer om modellen og dens egenskaper<span class="material-symbols-outlined">keyboard_arrow_down</span>
            </button>
          {/if}
        </div>
      </div>

      {#if modelTampering}
        <div class="boxy" id="testBox">
          <ModelInfo modelinfo={modelinfoModell} infoText={modelinfoBeskrivelse} />
          {#key userParams.synligKontekst}
            {#if userParams.synligKontekst}
              <textarea use:autosize id="inputKontekst" placeholder="Her kan du legge inn kontekst til språkmodellen." bind:value={userParams.kontekst} rows="4" cols="auto"></textarea>
              <label for="temperatur">Temperatur: </label>
                <input type="range" id="temperatur" name="temperatur" min="0" max="2" step="0.1" bind:value={userParams.temperatur}/>
              {userParams.temperatur}
            {/if}
          {/key}
        </div>
      {/if}
    </div>
    <div class="output" bind:this={chatWindow}>
      {#if userParams.messageHistory.length === 1}
        <ChatBlobs
          role="assistant"
          content={userParams.messageHistory[0].content}
        />
      {:else if isWaiting}
        {#each userParams.messageHistory as chatMessage}
          <ChatBlobs role={chatMessage.role} content={chatMessage.content} />
        {/each}
        <ChatBlobs role={"assistant"} content={"..."} />
      {:else}
        {#each userParams.messageHistory as chatMessage}
          {#if typeof chatMessage.content === "string"}
            <ChatBlobs role={chatMessage.role} content={chatMessage.content} />
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
        placeholder={`Skriv inn ledetekst (Shift + Enter for flere linjer)`} 
        bind:value={inputMessage} 
        on:keypress={(e) => onKeyPress(e, files && files.length > 0 ? sporDokument : brukervalg)}></textarea>

      {#if token.roles.some( (r) => [`${appName.toLowerCase()}.admin`].includes(r) )}
        <label for="fileButton"><span class="material-symbols-outlined">cloud_upload</span>
          <input style="display:none;" bind:files={files} id="fileButton" multiple type="file" accept=".xls, .xlsx, .docx, .pdf, .txt, .json, .md, .pptx" />
        </label>
        <!--span>{files && files.length > 0 ? files[0].name : ""}</span-->
        {#if files && files.length > 0}
          <div class="fileName flash">
            {files[0].name}
            <button 
              class="removeFile" 
              on:click={() => { files = null; selectedFiles = []; document.getElementById('fileButton').value = '';}} 
              aria-label="Remove file">
              &times;
            </button>
          </div>
        {/if}     
        {#if isError}
          <Modal bind:showModal>
            <h2 slot="header">Error</h2>
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
            <div class="errorMsg">{JSON.stringify(errorMessage)}</div>
          </Modal>
        {/if}
      {/if}
      <label for="imageButton"><span class="material-symbols-outlined">add_photo_alternate</span>
      <input id="imageButton" type="file" bind:files={selectedFiles} on:change={handleFileSelect} accept="image/*" style="display: none;"/></label>
      <label for="sendButton"><span class="material-symbols-outlined">send</span>
        <input id="sendButton" type="button" on:click={files && files.length > 0 ? sporDokument : brukervalg}  value={`Spør ${appName}`} style="display: none;"/></label>
    </div>
  {/if}
  <br>
  <p style="font-size: 14px;font-color: light-grey">
    Husk at språkmodeller lager tekst som kan inneholde feil. Vurder alltid om bruken av språkteknologi passer med formålet ditt.<br> 
    Ikke send inn data som kan være sensitive eller inneholder informasjon som ikke kan deles offentlig. <a href="https://www.vestfoldfylke.no/no/meny/tjenester/opplaring/digitale-laringsressurser-til-videregaende-opplaring/munin/">Les mer om bruk av {appName} her.</a></p>
  <br>
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
    align-items: center;
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
  }

  .boxy {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 10px;
    margin-top: 10px;
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
    padding: 1px;
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

  .fileName {
    display: inline-block;
    position: relative;
    padding-right: 20px;
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

  .flash {
  animation: flash 2s ease-in-out;
  }

  .removeFile {
    position: absolute;
    top: 0;
    right: 4px;
    background: red;
    color: white;
    border-radius: 50%;
    width: 13px !important; /* veien til helvete er brolagt med !important css */
    height: 13px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0px 1px 1px 0px;
    border: 0;
    font-size: 12px;
  }

/* Tror ikke disse gjør noe...

#imageButton {
  background-color: #e0e0e0;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  #sendButton {
    background-color: #e0e0e0;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  #sendButton:hover {
    background-color: var(--gress-50);
  }*/

  .modellSelect {
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    background-color: #f5f5f5;
    width: 26rem;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media only screen and (max-width: 768px) {
    main {
      height: calc(80vh - 100px);
      margin: 2px;
    }

    .output {
      padding: 1px;
      border: 1px solid #ccc;
      border-radius: 5px;
      margin-bottom: 10px;
      height: 100vw;
      max-height: 1440px;
      width: 100%;
      overflow-y: scroll;
    }
  }
</style>
