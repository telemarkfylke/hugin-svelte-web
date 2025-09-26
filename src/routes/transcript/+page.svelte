<script>
  // disabled as this seems to not be fully implemented yet
  import { nbTranscript } from "$lib/services/openaiToolsLabs"
  import { getHuginToken } from "$lib/useApi.js"
  import { onMount, } from "svelte"
  import IconSpinner from "../../lib/components/IconSpinner.svelte"
  import InfoBox from "$lib/components/InfoBox.svelte";
  import { checkRoles } from '$lib/helpers/checkRoles';


// Global variabler
let mediaRecorder;
  let audioChunks = [];
  let audioBlob;
  let audioUrl = $state();
  let token = $state(null)
  // disabled as this seems to not be fully implemented yet
  // eslint-disable-next-line no-unused-vars
  let ferdigTranskript = $state("Her kommer transkripsjonen");
  let recording = $state(false);
  let timer = $state(0);
  let timerInterval;

  const { VITE_APP_NAME: appName, VITE_MOCK_API: mockApi } = import.meta.env


  /* eslint-disable-next-line prefer-const */
  let metadata = $state({ "filnavn": "", "spraak": "", "format": "" });

  onMount(async () => {
    if (mockApi && mockApi === "true") {
      // Pretend to wait for api call
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    token = await getHuginToken(true)
  })

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      metadata.filnavn = 'mittopptak.wav';
      audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      audioUrl = URL.createObjectURL(audioBlob);
      audioChunks = [];
      clearInterval(timerInterval);
      timer = 0;
    };

    mediaRecorder.start();
    recording = true;
    timerInterval = setInterval(() => {
      timer += 1;
    }, 1000);
  }

  function stopRecording() {
    mediaRecorder.stop();
    recording = false;
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }

  // Filhåndtering
  const handleAudioFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      metadata.filnavn = selectedFile.name;
      // Lager blob til transkripsjon og url for avspilling
      audioBlob = new Blob([selectedFile], { type: 'audio/wav' });
      audioUrl = URL.createObjectURL(audioBlob);
      // sendTilTranscript(audioBlob);
    }
  };

  const sendTilTranscript = async () => {
    const transButton = document.getElementById('transButton');
    transButton.textContent = "epost på vei";
    transButton.disabled = true;
    // disabled as this seems to not be fully implemented yet
    ferdigTranskript = await nbTranscript(audioBlob, metadata);
  };
</script>

{#if !token}
      <div class="loading">
        <IconSpinner width="32px" />
      </div>
    {:else if !checkRoles(token, [`${appName.toLowerCase()}.admin`, `${appName.toLowerCase()}.transkripsjon`])}
      <p>Oi, du har ikke tilgang. Prøver du deg på noe lurt? 🤓</p>
      {:else}
      <h1>Eksperimentell selvbetjeningsløsning for transkripsjon av tale</h1>
      
      <p style="margin-top:10px">Her kan du spille inn eller laste opp lyd og få transkripsjonen tilsendt på epost til brukeren du er logget inn med.</p>
      <div class="alert"><p><b>Tjenesten er under utvikling og kan være ustabil. Husk at du ikke må sende inn lydklipp som inneholder sensitiv informasjon.</b></p></div>
      <h2>Spill inn lyd</h2>
      <div style="margin-bottom: 10px;"><b>NB!</b> Husk å laste ned lydopptaket før du sender til transkribering. Lydopptaket slettes etter at det er sendt avgårde. </div>
      
      <button onclick={recording ? stopRecording : startRecording}>
        {recording ? 'Stopp opptak' : 'Start opptak'}
      </button>
    
      {#if recording}
      <p>Opptak pågår: {timer}s</p>
      {/if}
      <br />
      {#if audioUrl}
        <p>
          <!-- Avspilling fra audioUrl-objektet -->
          <audio controls src = {audioUrl}></audio><br>
          <button id="transButton" onclick={sendTilTranscript}>Send til transkripsjon</button>
          <button><a href={audioUrl} download="recording.wav">Last ned opptak</a></button>
        </p>
      {/if}
    
        <!-- Opplasting av lydfil -->
        <h2 style="margin-top: 10px">Eller last opp en lydfil</h2>
        <p>Last opp lydklipp på mp3- eller wma-format. Den ferdige transkripsjonen blir sendt til deg på epost.</p>
        <br />
      <input type="file" accept="audio/*" id="audioFile" name="audioFile" onchange={handleAudioFileSelect} />
      {#if metadata.selectedFileName}
        <p>Valgt fil: {metadata.selectedFileName}</p>
      {/if}
      <br>
    {/if}
    <br />
    Modell: Nasjonalbibliotekets nb-whisper-medium
    <!-- Download button -->
     <br />
     <br />
    <InfoBox title="Personvernerklæring">
      <h1>Personvernerklæring for Selvbetjeningsløsning for transkribering i Hugin</h1>

      <h2>Innledning</h2>
      <p>
        Denne personvernerklæringen beskriver hvordan selvbetjeningsløsning for transkribering i Hugin samler inn og bruker personopplysninger når du bruker vår tjeneste for transkribering av lydopptak.
        Ved å benytte tjenesten, godtar du behandling av dine personopplysninger i henhold til denne erklæringen.
      </p>

      <h2>Hvor lagres dataene?</h2>
      <ul>
        <li>
          <strong>Telemark fylkeskommunes Azure-installasjon</strong> (datasenter i Norge):<br>
          Her lagres kun lydklippet som sendes inn.
        </li>
        <li>
          <strong>Lokal server på fylkeshuset:</strong><br>
          Her lages transkriberingen midlertidig før den sendes til bruker. Transkripsjonen slettes etter at den er sendt.
        </li>
      </ul>

      <h2>Hva samles inn</h2>
      <ul>
        <li>
          <strong>Lydopptak:</strong> Når du laster opp eller leser inn lydfiler for transkribering.
        </li>
        <li>
          <strong>Personlige opplysninger:</strong> Navn og e-postadresse som er nødvendig for å sende deg transkriberte tekster.
        </li>
        <li>
          <strong>Bruksinformasjon:</strong> Statistikk over bruk og feillogger som lagres på lokal server. Disse dataene er anonymisert.
        </li>
      </ul>

      <h2>Formål</h2>
      <ul>
        <li>
          <strong>Transkribering:</strong> For å transkribere lydopptakene du sender inn med norsk språkmodell.
        </li>
        <li>
          <strong>Forbedring av tjenesten:</strong> For å analysere bruken av vår tjeneste og forbedre våre tjenester.
        </li>
      </ul>

      <h2>Deling av informasjon</h2>
      <p>
        Ingen informasjon deles eller gjenbrukes til andre eller i andre sammenhenger.
        Det logges kun statistikk for bruk, men denne inneholder ingen informasjon om innhold.
      </p>

      <h2>Sikkerhet</h2>
      <p>
        Innlogging skjer på fylkeskommunens tjenester. All dataoverføring skjer enten med HTTPS og/eller kryptert kommunikasjon.
      </p>

      <h2>Lagring av data</h2>
      <p>
        Dine lydopptak og transkriberte dokumenter blir mellomlagret i inntil en time for prosessering. Alle data blir umiddelbart slettet når transkriberingen er gjort. 
        Lydopptaket blir slettet i det det blir sendt til prosessering. Det kan være retention-policyer på tenant-nivå som muliggjør gjenoppretting av filer innen en viss tidsperiode.
      </p>

      <h2>Dine rettigheter</h2>
      <ul>
        <li>
          <strong>Innsyn:</strong> Du har rett til å be om innsyn i hvilke personopplysninger vi har lagret om deg.
        </li>
        <li>
          <strong>Rettelse:</strong> Du kan be om å få korrigert feilaktige personopplysninger.
        </li>
        <li>
          <strong>Sletting:</strong> Du kan be om sletting av dine personopplysninger, med visse unntak som kreves ved lov.
        </li>
      </ul>

      <h2>Kontaktinformasjon</h2>
      <p>
        Hvis du har spørsmål eller bekymringer om denne personvernerklæringen, vennligst kontakt oss på <a href="mailto:noen@telemarkfylke.no">noen@telemarkfylke.no</a>.
      </p>
    </InfoBox>
 
    <style>
      audio {
        margin-top: 20px;
      }
    
      button {
        margin-right: 10px;
        margin-bottom: 10px;
      }
    
      .alert {
        background-color: #f8d7da;
        color: #721c24;
        padding: 20px;
        margin-top: 10px;
        margin-bottom: 20px;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
      }
    
    </style>