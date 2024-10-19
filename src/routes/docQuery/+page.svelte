<script>
    import { docQueryOpenAi } from "$lib/services/openAiTools"
    import { modelinfo } from "$lib/data/modelinfo" // Tekstbeskrivelser om valgt modell
    import ChatBlobs from "$lib/components/ChatBlobs.svelte" // Komponent for å vise chatmeldinger
    // import GPT4o from '$lib/images/GPT4o.png' // Bilde av valgt modell
    import ModelInfo from "../../lib/components/ModelInfo.svelte"
    import "@material/web/button/elevated-button"
    import { onMount, afterUpdate } from "svelte"
    import { getHuginToken } from "../../lib/useApi"
    import IconSpinner from "../../lib/components/IconSpinner.svelte"
    import Modal from "../../lib/components/Modal.svelte"
  
    // UserParams og globale variabler
    let files;
    let svar;

    const userParams = {
        message: "",
        messageHistory: [],
        kontekst: "",
        valgtModell: "option1", // Settes til default
        base64String: "",
        temperatur: 1.0,
        assistant: "docQuery",
        newThread: true,
        threadId: "",
        vectorStoreId: "",
        fil: "Fil ikke valgt",
        filArray: "",
    };
  
    // Variabler for håndtering av data og innhold i frontend
    let outputElement
    let tekstFraPdf = "" // Brukes ikke....Ennå
    let selectedFiles = []
    let respons
    let modelinfoModell = modelinfo[userParams.valgtModell].navn
    let modelinfoBeskrivelse = modelinfo[userParams.valgtModell].description
    let illustrasjonsbilde = modelinfo[userParams.valgtModell].illustrasjonsbilde
    let modelTampering = false // Viser modellinformasjon
    let advancedInteractions = false
    let token = null
    let chatWindow
    let isWaiting = false
    let isError = false
    let errorMessage = ""
    let showModal = false
    const appName = import.meta.env.VITE_APP_NAME
  
    userParams.messageHistory.push({
      role: "assistant",
      content: `Velkommen til ${appName}! Hva kan jeg hjelpe deg med i dag?`,
    })
  
    onMount(async () => {
      if (
        import.meta.env.VITE_MOCK_API &&
        import.meta.env.VITE_MOCK_API === "true"
      ) {
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
  async function sporDokument() {
    userParams.fil = files ? files[0].name : "Ingen fil valgt"
    isWaiting = true
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
      userParams.message = "";
      isWaiting = false
    } catch (e) {
      console.log("Oj, noe gikk galt!");
    }
  }

    $: if (respons && chatWindow) {
      scrollToBottom(chatWindow)
    }
  
    const onKeyPress = async (e) => {
      if (e.charCode === 13) {
        // isEnterPressed = true
        scrollToBottom(chatWindow)
        await sporDokument()
      }
    }
  
    // Fester scroll til bunnen av chatvinduet etter oppdatering av chatvinduet
    afterUpdate(() => {
      if (respons && chatWindow && userParams.message.length === 0) {
        scrollToBottom(chatWindow)
      }
    })
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
        <h2>Dokumentspørring - Eksperimentell</h2>
        <div class="boxyHeader">
            <p>Her kan du laste opp ett dokument og samtale med dette. Denne funksjonen er under utvikling og kan være ustabil.<br><b>Ikke last opp dokument som inneholder sensitive opplysninger eller annen informasjon som ikke kan deles offentlig</b><br>Du har lastet opp dokumentet: {userParams.fil}</p>
        </div>
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
            <ChatBlobs role={chatMessage.role} content={chatMessage.content} />
          {/each}
        {/if}
      </div>

      <div class="userInteractionField">
        <input name="askHugin" type="text" autocomplete="off" placeholder={`Spør ${appName}`} size="50" bind:value={userParams.message} on:keypress={onKeyPress} />
        <input class="sendButton" type="button" on:click={sporDokument} on:keypress={onKeyPress} value={`Spør ${appName}`} />
        <label for="filopplasting">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                <path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.67v6h4V9h3.67L12 2z" />
            </svg>
        </label>
            <input bind:files id="filopplasting" multiple type="file" accept=".xls, .xlsx, .docx, .pdf, .txt, .json, .md, .pptx"/>
      </div>
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
    <br><p>Husk at språkmodeller lager tekst som kan inneholde feil. Sjekk alltid flere kilder og bruk sunn fornuft når du bruker KI-tjenester.<br> Ikke send inn data som kan være sensitive eller inneholder informasjon som ikke kan deles offentlig</p><br>
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
      padding: 10px;
      margin-bottom: 20px;
      display: block;
      width: 100%;
      overflow: hidden;
      resize: both;
      min-height: 40px;
      line-height: 20px;
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
      padding: 10px;
      margin: 10px;
    }
  
    label .material-symbols-outlined:hover {
      background-color: var(--gress-50);
    }
  
    .userInteractionField {
      display: flex;
      width: 100%;
      border: 1px solid #ccc;
    }
    .userInteractionField button {
      transition: transform 0.7s ease-in-out;
    }
    .userInteractionField button:hover {
      transform: rotate(360deg);
    }
  
    input[type="text"] {
      all: unset;
      width: 80%;
      padding: 15px 20px;
      margin: 8px 5px;
      border-right: 1px solid #ccc;
    }
  
    input[type="file"] {
      display: none;
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
  
    /* .right {
      float: right;
      width: 30%;
      padding: 10px;
      margin-right: 80px;
      border: 1px solid #ccc;
      border-radius: 5px;
      margin-bottom: 10px;
    } */
  
    .modelTampering {
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 5px;
      margin-bottom: 10px;
      width: 100%;
    }
  
    .sendButton {
      padding: 15px;
      margin: 8px;
      background-color: var(--gress-10);
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      color: black;
    }
  
    .sendButton:hover {
      background-color: var(--gress-50);
    }
  
    .modellSelect {
      padding: 10px;
      border-radius: 5px;
      border: 1px solid #ccc;
      background-color: #f5f5f5;
      width: 16rem;
    }
  
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  
    .errorMsg {
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      margin: 10px;
      justify-content: center;
      width: 97%;
      height: 20vh;
      overflow: auto;
    }
  
    .centerstuff {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      justify-content: center;
      padding: 5px;
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
  