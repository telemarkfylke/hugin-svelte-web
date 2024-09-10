<script>
  import { docQueryOpenAi } from "$lib/services/openAiTools";
  import ChatBlobs from "$lib/components/ChatBlobs.svelte";

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
    fil: "",
    filArray: "",
  };

  async function sporDokument() {
    try {
      docQueryOpenAi(files, userParams).then((response) => {
        console.log("TestRRR:", JSON.parse(response).status);
        console.log("Response: ", JSON.parse(response).data.messages[1].content[0].text.value);
        svar = JSON.parse(response).data.messages[1].content[0].text.value;
      });
    } catch (e) {
      console.log("Oj, noe gikk galt!");
    }
  }
</script>

<h1>Dokumentspørring - Eksperimentell</h1>
<p>Her kan du laste opp dokumenter for å få svar på spørsmål. Denne funksjonen er under utvikling og kan virke noe ustabil.</p>
<div class="output">
  
  {#await svar}
    <p>Laster...</p>
  {:then resultat}
    <ChatBlobs role={"user"} content={resultat} />
  {:catch error}
    <p>{error.message}</p>
  {/await}
</div>
<input
  type="text"
  placeholder="Spør dokumentet"
  bind:value={userParams.message}
  size="50"
/>
<button on:click={sporDokument}>Trykk på meg</button><br />
<label for="many">Last opp en fil:</label>
<input bind:files id="many" multiple type="file" accept=".xls, .xlsx, .docx, .pdf, .txt, .json, .md"/>

<style>

.output {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
  background-color: ghostwhite;
  width: 50%;
}

</style>
