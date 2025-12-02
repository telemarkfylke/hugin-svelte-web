<script>
  import { nbTranscript } from "$lib/services/openaiToolsLabs"
  import { getHuginToken } from "$lib/useApi.js"
  import { onMount, onDestroy } from "svelte"
  import IconSpinner from "../../lib/components/IconSpinner.svelte"
  import InfoBox from "$lib/components/InfoBox.svelte"
  import { checkRoles } from '$lib/helpers/checkRoles'

  // Konstanter
  const MAX_FILE_SIZE = 70 * 1024 * 1024 // 70MB
  const ALLOWED_TYPES = [
    'audio/mpeg', 'audio/mp3',    // MP3
    'audio/wav', 'audio/wave',     // WAV
    'audio/m4a', 'audio/x-m4a',   // M4A
    'video/mp4',                   // MP4
    'video/quicktime',             // MOV
    'video/x-msvideo'              // AVI
  ]
  const SUCCESS_MESSAGE_DURATION = 5000 // 5 sekunder

  const { VITE_APP_NAME: appName, VITE_MOCK_API: mockApi } = import.meta.env

  // State variabler - lydopptak
  let mediaRecorder = $state(null)
  let audioChunks = $state([])
  let audioBlob = $state(null)
  let audioUrl = $state(null)
  let recording = $state(false)
  let timer = $state(0)
  let timerInterval = null

  // State variabler - autentisering og metadata
  let token = $state(null)
  const metadata = $state({ "filnavn": "", "spraak": "", "format": "" })

  // State variabler - UI tilstand
  let isSending = $state(false)
  let sendError = $state(null)
  let recordingError = $state(null)
  let fileError = $state(null)
  let showConfirmation = $state(false)
  let sendSuccess = $state(false)

  // Hjelpefunksjon: Rydder opp audioUrl for å forhindre minnelekkasje
  const cleanupAudioUrl = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      audioUrl = null
    }
  }

  // Hjelpefunksjon: Nullstiller all audio-relatert state
  const resetAudioState = () => {
    cleanupAudioUrl()
    audioBlob = null
    metadata.filnavn = ''
    sendSuccess = false
  }

  onMount(async () => {
    if (mockApi && mockApi === "true") {
      // Simulerer API-kall i mock-modus
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    token = await getHuginToken(true)
  })

  onDestroy(() => {
    // Rydder opp ved unmount: stopper timere og frigjør ressurser
    cleanupAudioUrl()
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    if (mediaRecorder && recording) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }
  })

  // Starter lydopptak fra mikrofon
  async function startRecording() {
    try {
      recordingError = null
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        metadata.filnavn = 'mittopptak.wav'
        cleanupAudioUrl()
        audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        audioUrl = URL.createObjectURL(audioBlob)
        audioChunks = []
        clearInterval(timerInterval)
        timer = 0
      }

      mediaRecorder.start()
      recording = true
      timerInterval = setInterval(() => {
        timer += 1
      }, 1000)
    } catch (error) {
      recordingError = 'Kunne ikke starte opptak. Sørg for at nettleseren har tilgang til mikrofon.'
      console.error('Recording error:', error)
    }
  }

  // Stopper pågående lydopptak
  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop()
      recording = false
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }
  }

  // Håndterer opplasting av lydfil fra brukerens enhet
  const handleAudioFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    fileError = null

    if (!selectedFile) return

    // Validerer filtype
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      fileError = 'Ugyldig filtype. Kun MP3, WAV, M4A, MP4, MOV og AVI er tillatt.'
      event.target.value = ''
      return
    }

    // Validerer filstørrelse
    if (selectedFile.size > MAX_FILE_SIZE) {
      fileError = 'Filen er for stor. Maksimal filstørrelse er 70MB.'
      event.target.value = ''
      return
    }

    // Laster inn lydfilen
    metadata.filnavn = selectedFile.name
    cleanupAudioUrl()
    audioBlob = selectedFile
    audioUrl = URL.createObjectURL(audioBlob)
  }

  // Viser bekreftelsesdialog før sending
  const handleSendClick = () => {
    showConfirmation = true
  }

  // Bekrefter sending av lydfil til transkribering
  const confirmSend = async () => {
    showConfirmation = false
    await sendTilTranscript()
  }

  // Avbryter sending
  const cancelSend = () => {
    showConfirmation = false
  }

  // Sender lydfilen til transkribering via API
  const sendTilTranscript = async () => {
    try {
      isSending = true
      sendError = null
      sendSuccess = false
      await nbTranscript(audioBlob, metadata)
      sendSuccess = true

      // Nullstiller skjema automatisk etter 5 sekunder
      setTimeout(() => {
        resetAudioState()
      }, SUCCESS_MESSAGE_DURATION)
    } catch (error) {
      sendError = 'Kunne ikke sende til transkribering. Prøv igjen senere.'
      console.error('Transcription error:', error)
    } finally {
      isSending = false
    }
  }
</script>

{#if !token}
      <div class="loading">
        <IconSpinner width="32px" />
      </div>
    {:else if !checkRoles(token, [`${appName.toLowerCase()}.admin`, `${appName.toLowerCase()}.transkripsjon`])}
      <p>Oi, du har ikke tilgang. Prøver du deg på noe lurt? 🤓</p>
      {:else}
      <h1>Eksperimentell selvbetjeningsløsning for transkripsjon av tale</h1>

      <p class="intro-text">Her kan du spille inn eller laste opp lyd og få transkripsjonen tilsendt på epost til brukeren du er logget inn med.</p>
      <div class="alert">
        <p><b>Husk at:</b></p>
        <ul>
          <li>Tjenesten er under utvikling og kan være ustabil.</li>
          <li>Bruk ikke tjenesten til sensitiv eller taushetsbelagt informasjon.</li>
          <li>Alle parter må opplyses om at det gjøres opptak før innspilling påbegynnes.</li>
          <li>Transkripsjoner og oppsummeringer kan inneholde feil og må alltid kvalitetssikres av brukeren.</li>
          <li>Sørg for at taleopptak du laster opp i transkripsjonsløsningen blir permanent slettet fra mobilen eller andre lagringssteder etter opplasting, og at de ikke lagres i din egen skyløsning (f.eks. iCloud). Du skal aldri ta eller laste opp taleopptak av elever.</li>
        </ul>
      </div>

      <!-- Combined input section -->
      <section class="card">
        <div class="input-grid">
          <!-- Opplasting av lydfil -->
          <div class="input-column">
            <h2>Last opp en lydfil</h2>
            <p>Last opp lydklipp på MP3, WAV, M4A, MP4, MOV eller AVI-format (maks 70MB). Den ferdige transkripsjonen og en oppsummering blir sendt til deg på epost.</p>
            <p><b>Husk å slette lydfilen fra enheten din etter opplasting</b></p>

            {#if fileError}
              <div class="error">{fileError}</div>
            {/if}

            <div class="file-upload-group">
              <label for="audioFile" class="file-label">
                <span class="visually-hidden">Velg lydfil for opplasting</span>
                <input type="file" accept=".mp3,.wav,.m4a,.mp4,.mov,.avi" id="audioFile" name="audioFile" onchange={handleAudioFileSelect} aria-label="Velg lydfil for opplasting" />
              </label>
              {#if metadata.filnavn && !fileError}
                <div class="file-selected">✓ Valgt fil: <strong>{metadata.filnavn}</strong></div>
              {/if}
            </div>
          </div>

          <!-- Spill inn lyd -->
          <div class="input-column">
            <h2>...eller spill inn lyd</h2>
            <div class="warning-text"><b>NB!</b> Husk å laste ned lydopptaket før du sender til transkribering i tilfelle noe går galt eller om du trenger en backup. Lydopptaket slettes umiddelbart etter at det er sendt avgårde.</div>

            {#if recordingError}
              <div class="error">{recordingError}</div>
            {/if}

            <div class="control-group">
              <button class="primary-btn" onclick={recording ? stopRecording : startRecording} aria-label={recording ? 'Stopp lydopptak' : 'Start lydopptak'}>
                {recording ? 'Stopp opptak' : 'Start opptak'}
              </button>
              {#if recording}
                <span class="recording-status">Opptak pågår: {timer}s</span>
              {/if}
            </div>
          </div>
        </div>
      </section>

      <!-- Send til transkripsjon section - appears when audio is ready -->
      {#if audioUrl}
        <section class="card send-card">
          <h2>Send til transkripsjon</h2>
          <p>Lydfilen er klar til å sendes. Transkripsjonen vil bli sendt til deg på e-post når den er ferdig.</p>

          <div class="audio-preview-send">
            <audio controls src={audioUrl} aria-label="Forhåndsvisning av lydopptak"></audio>
            <a href={audioUrl} download={metadata.filnavn || "recording.wav"} class="secondary-btn download-btn-inline" aria-label="Last ned lydopptak">Last ned opptak</a>
          </div>

          {#if sendSuccess}
            <div class="success">
              ✓ Lydfilen er sendt til transkribering! Transkripsjonen vil bli sendt til deg på e-post når den er ferdig.
            </div>
          {/if}

          {#if sendError}
            <div class="error">{sendError}</div>
          {/if}

          <div class="button-group">
            <button class="primary-btn send-btn" onclick={handleSendClick} disabled={isSending || sendSuccess} aria-label="Send lydfil til transkribering">
              {#if isSending}
                <IconSpinner width="16px" /> Sender...
              {:else if sendSuccess}
                ✓ Sendt
              {:else}
                Send til transkripsjon
              {/if}
            </button>
          </div>
        </section>
      {/if}

      <!-- Confirmation Modal -->
      {#if showConfirmation}
        <div
          class="modal-overlay"
          onclick={cancelSend}
          onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && cancelSend()}
          role="button"
          tabindex="0"
          aria-label="Lukk bekreftelsesdialog"
        >
          <div
            class="modal"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabindex="-1"
          >
            <h3 id="modal-title">Bekreft sending</h3>
            <p>Er du sikker på at du vil sende lydfilen til transkribering?</p>
            <p class="modal-info">Lenke til transkripsjonen vil bli sendt til deg på e-post.</p>
            <div class="modal-buttons">
              <button onclick={confirmSend} class="confirm-btn">Send</button>
              <button onclick={cancelSend} class="cancel-btn">Avbryt</button>
            </div>
          </div>
        </div>
      {/if}
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
        Hvis du har spørsmål eller bekymringer om denne personvernerklæringen, vennligst kontakt oss på <a href="mailto:personvernombudet@telemarkfylke.no">personvernombudet@telemarkfylke.no</a>.
      </p>
    </InfoBox>
 
    <style>
      .intro-text {
        margin: 10px 0 20px 0;
        font-size: 1.05em;
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      /* Card styling for sections */
      .card {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 24px;
      }

      .card h2 {
        margin-top: 0;
        margin-bottom: 12px;
        font-size: 1.5em;
      }

      .card p {
        margin: 8px 0 16px 0;
        color: #495057;
      }

      /* Input grid layout */
      .input-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }

      @media (max-width: 768px) {
        .input-grid {
          grid-template-columns: 1fr;
        }
      }

      .input-column {
        min-width: 0;
      }

      .input-column h2 {
        font-size: 1.3em;
      }

      .warning-text {
        background-color: #fff3cd;
        color: #856404;
        padding: 12px;
        margin: 12px 0;
        border: 1px solid #ffeeba;
        border-radius: 4px;
        font-size: 0.95em;
      }

      /* Button styling */
      .primary-btn {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1em;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.2s;
      }

      .primary-btn:hover:not(:disabled) {
        background-color: #0056b3;
      }

      .primary-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .secondary-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background-color: #6c757d;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 1em;
        transition: background-color 0.2s;
      }

      .secondary-btn:hover {
        background-color: #5a6268;
      }

      .control-group {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 16px 0;
      }

      .recording-status {
        font-weight: bold;
        color: #dc3545;
        font-size: 1.1em;
      }

      .audio-preview-send {
        background: white;
        border-radius: 6px;
        padding: 16px;
        margin: 16px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .download-btn-inline {
        align-self: flex-start;
      }

      audio {
        width: 100%;
        margin-bottom: 0;
      }

      .button-group {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .file-upload-group {
        margin: 16px 0;
      }

      .file-label input[type="file"] {
        font-size: 1em;
        padding: 8px;
        border: 2px dashed #ced4da;
        border-radius: 4px;
        background: white;
        width: 100%;
        max-width: 500px;
        cursor: pointer;
      }

      .file-label input[type="file"]:hover {
        border-color: #007bff;
      }

      .alert {
        background-color: #f8d7da;
        color: #721c24;
        padding: 16px;
        margin: 16px 0;
        border: 1px solid #f5c6cb;
        border-radius: 6px;
      }

      .error {
        background-color: #f8d7da;
        color: #721c24;
        padding: 12px;
        margin: 12px 0;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
      }

      .file-selected {
        color: #155724;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        padding: 12px;
        margin: 12px 0;
        border-radius: 4px;
        font-size: 1em;
      }

      .success {
        color: #155724;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        padding: 12px;
        margin: 12px 0;
        border-radius: 4px;
        font-weight: bold;
      }

      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      /* Send card highlighting */
      .send-card {
        background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
        border: 2px solid #007bff;
      }

      .send-card h2 {
        color: #007bff;
      }

      .send-btn {
        font-size: 1.1em;
        padding: 12px 24px;
      }

      /* Modal Styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .modal h3 {
        margin-top: 0;
        margin-bottom: 16px;
      }

      .modal-info {
        font-size: 0.9em;
        color: #666;
      }

      .modal-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        justify-content: flex-end;
      }

      .confirm-btn {
        background-color: #28a745;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }

      .confirm-btn:hover {
        background-color: #218838;
      }

      .cancel-btn {
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }

      .cancel-btn:hover {
        background-color: #5a6268;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
    </style>