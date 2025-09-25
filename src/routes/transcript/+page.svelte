<script>
  import { nbTranscript } from "$lib/services/openaiToolsLabs"
  import { getHuginToken } from "$lib/useApi.js"
  import { onMount } from "svelte"
  import IconSpinner from "$lib/components/IconSpinner.svelte"
  import InfoBox from "$lib/components/InfoBox.svelte"
  import FileUpload from "$lib/components/FileUpload.svelte"
  import AudioRecorder from "$lib/components/AudioRecorder.svelte"
  import { checkRoles } from '$lib/helpers/checkRoles'

  // State variabler
  let token = $state(null)
  let isProcessing = $state(false)
  let processingMessage = $state('')
  let audioBlob = $state(null)
  let audioUrl = $state(null)
  let isRecording = $state(false)
  let recordingTime = $state(0)
  let selectedFile = $state(null)
  const uploadProgress = $state(0)
  let errorMessage = $state('')
  let successMessage = $state('')
  let activeMethod = $state('upload')

  const { VITE_APP_NAME: appName, VITE_MOCK_API: mockApi } = import.meta.env

  const metadata = $state({ filnavn: '', spraak: '', format: '' })

  onMount(async () => {
    if (mockApi && mockApi === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    token = await getHuginToken(true)
  })

  // Handlers for AudioRecorder component
  const handleRecordingComplete = ({ audioBlob: blob, filename }) => {
    audioBlob = blob
    audioUrl = URL.createObjectURL(blob)
    metadata.filnavn = filename
    clearMessages()
  }

  const handleRecordingClear = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    audioBlob = null
    audioUrl = null
    metadata.filnavn = ''
    clearMessages()
  }

  // Handlers for FileUpload component
  const handleFileSelected = ({ file }) => {
    selectedFile = file
    metadata.filnavn = file.name
    audioBlob = new Blob([file], { type: file.type })
    audioUrl = URL.createObjectURL(audioBlob)
    clearMessages()
  }

  const handleFileCleared = () => {
    selectedFile = null
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    audioBlob = null
    audioUrl = null
    metadata.filnavn = ''
    clearMessages()
  }

  const clearMessages = () => {
    errorMessage = ''
    successMessage = ''
  }

  const sendTilTranscript = async (source = null) => {
    if (!audioBlob) {
      errorMessage = 'Ingen lydfil valgt for transkripsjon'
      return
    }

    isProcessing = true
    processingMessage = 'Sender lydfil til transkripsjon...'
    clearMessages()

    try {
      await nbTranscript(audioBlob, metadata)
      successMessage = 'Transkripsjonen er sendt til deg på e-post!'

      // Clean up after successful processing
      setTimeout(() => {
        if (source === 'recording') {
          handleRecordingClear()
        } else {
          handleFileCleared()
        }
      }, 2000)

    } catch (error) {
      console.error('Transkripsjonsfeil:', error)
      errorMessage = 'Det oppstod en feil ved transkripsjon. Prøv igjen senere.'
    } finally {
      isProcessing = false
      processingMessage = ''
    }
  }
</script>

{#if !token}
  <div class="loading-container">
    <IconSpinner width="32px" />
    <p>Laster transkripsjonsjenetste...</p>
  </div>
{:else if !checkRoles(token, [`${appName.toLowerCase()}.admin`, `${appName.toLowerCase()}.transkripsjon`])}
  <div class="access-denied">
    <span class="access-denied-icon">🚫</span>
    <h2>Ingen tilgang</h2>
    <p>Du har ikke tilgang til transkripsjonsdjenesten. Kontakt administrator for tilgang.</p>
  </div>
{:else}
  <main class="transcript-main">
    <header class="page-header">
      <h1>Transkripsjon av tale</h1>
      <p class="page-description">
        Last opp lydfiler eller ta opp lyd direkte for å få tekst tilsendt på e-post.
        Tjenesten bruker Nasjonalbibliotekets nb-whisper-medium modell.
      </p>
    </header>

    <div class="warning-banner" role="alert" aria-labelledby="warning-title">
      <span class="warning-icon">⚠️</span>
      <div class="warning-content">
        <h3 id="warning-title">Viktig informasjon</h3>
        <p>
          Tjenesten er under utvikling og kan være ustabil. Transkriberingen skjer lokalt og ingen data sendes ut av Telemark fylkeskommunes systemer. Vær allikevel oppmerksom på hvordan du bruker resultatene videre og at du er bevisst på hvordan du håndterer sensitive data.
        </p>
      </div>
    </div>

    {#if errorMessage}
      <div class="message error-message" role="alert" aria-live="polite">
        ❌ {errorMessage}
      </div>
    {/if}

    {#if successMessage}
      <div class="message success-message" role="alert" aria-live="polite">
        ✅ {successMessage}
      </div>
    {/if}

    {#if processingMessage}
      <div class="message processing-message" role="status" aria-live="polite">
        <IconSpinner width="20px" />
        {processingMessage}
      </div>
    {/if}

    <div class="main-content">
      <section class="transcription-section" aria-labelledby="transcription-heading">
        <h2 id="transcription-heading">Transkripsjon av lydfiler</h2>
        <p class="section-description">
          Velg mellom å ta opp lyd direkte eller laste opp en lydfil. Støtter mp3, wav, wma, m4a, flac og ogg. Maksimal filstørrelse er 50MB.
        </p>

        <div class="method-selector">
          <div class="method-tabs">
            <button
              class="tab-button {activeMethod === 'upload' ? 'active' : ''}"
              onclick={() => activeMethod = 'upload'}
            >
              📁 Last opp lydfil
            </button>
            <button
              class="tab-button {activeMethod === 'record' ? 'active' : ''}"
              onclick={() => activeMethod = 'record'}
            >
              🎤 Spill inn lyd
            </button>
          </div>

          <div class="method-content">
            {#if activeMethod === 'upload'}
              <div class="method-panel">
                <FileUpload
                  maxSize={50 * 1024 * 1024}
                  allowedFormats={['mp3', 'wav', 'wma', 'm4a', 'flac', 'ogg']}
                  label="Velg lydfil"
                  helperText="Dra og slipp lydfilen her, eller klikk for å velge fil"
                  isUploading={isProcessing}
                  progress={uploadProgress}
                  onFileSelected={handleFileSelected}
                  onFileCleared={handleFileCleared}
                />

                {#if selectedFile && audioUrl}
                  <div class="file-preview">
                    <h3>Forhåndsvisning</h3>
                    <audio
                      controls
                      src={audioUrl}
                      aria-label="Forhåndsvisning av valgt lydfil"
                    >
                      Din nettleser støtter ikke audio-elementet.
                    </audio>

                    <div class="preview-actions">
                      <button
                        class="btn btn-primary"
                        onclick={() => sendTilTranscript('upload')}
                        disabled={isProcessing}
                        aria-label="Send valgt fil til transkripsjon"
                      >
                        {#if isProcessing}
                          <IconSpinner width="16px" />
                          Sender...
                        {:else}
                          📤 Send til transkripsjon
                        {/if}
                      </button>
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <div class="method-panel">
                <AudioRecorder
                  bind:isRecording
                  bind:recordingTime
                  bind:audioUrl
                  isProcessing={isProcessing}
                  onRecordingComplete={handleRecordingComplete}
                  onRecordingClear={handleRecordingClear}
                  onSendToProcess={() => sendTilTranscript('recording')}
                />
              </div>
            {/if}
          </div>
        </div>
      </section>
    </div>

    <footer class="model-info">
      <p>
        <strong>AI-modell:</strong> Nasjonalbibliotekets nb-whisper-medium
      </p>
    </footer>
  </main>
{/if}
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
  :global(body) {
    line-height: 1.6;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
    color: var(--text-secondary, #6b7280);
  }

  .access-denied {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
    text-align: center;
    color: var(--text-danger, #dc2626);
  }

  .access-denied-icon {
    font-size: 3rem;
  }

  .access-denied h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .access-denied p {
    margin: 0;
    max-width: 400px;
    color: var(--text-secondary, #6b7280);
  }

  .transcript-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background-color: var(--bg-primary, #ffffff);
    min-height: 100vh;
  }

  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .page-header h1 {
    margin: 0 0 1rem 0;
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--text-primary, #1f2937);
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .page-description {
    margin: 0;
    font-size: 1.125rem;
    color: var(--text-secondary, #6b7280);
    max-width: 600px;
    margin: 0 auto;
  }

  .warning-banner {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid #f59e0b;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .warning-icon {
    color: #d97706;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .warning-content h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #92400e;
  }

  .warning-content p {
    margin: 0;
    color: #78350f;
    line-height: 1.5;
  }

  .message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }

  .error-message {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .success-message {
    background-color: #f0fdf4;
    color: #16a34a;
    border: 1px solid #86efac;
  }

  .processing-message {
    background-color: #eff6ff;
    color: #2563eb;
    border: 1px solid #93c5fd;
  }

  .main-content {
    margin-bottom: 3rem;
  }

  .transcription-section {
    background-color: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 1rem;
    padding: 2rem;
  }

  .transcription-section h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-primary, #1f2937);
    text-align: center;
  }

  .method-selector {
    margin-top: 2rem;
  }

  .method-tabs {
    display: flex;
    background-color: var(--bg-tertiary, #f1f5f9);
    border-radius: 0.75rem;
    padding: 0.25rem;
    margin-bottom: 2rem;
    gap: 0.25rem;
  }

  .tab-button {
    flex: 1;
    padding: 0.875rem 1.5rem;
    border: none;
    background: transparent;
    border-radius: 0.625rem;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-secondary, #64748b);
  }

  .tab-button:hover {
    color: var(--text-primary, #374151);
    background-color: rgba(255, 255, 255, 0.5);
  }

  .tab-button.active {
    background-color: white;
    color: var(--text-primary, #1f2937);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-weight: 600;
  }

  .method-content {
    min-height: 400px;
  }

  .method-panel {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .section-description {
    margin: 0 0 1.5rem 0;
    color: var(--text-secondary, #6b7280);
    font-size: 1rem;
    line-height: 1.5;
    text-align: center;
  }

  .file-preview {
    background-color: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-top: 1.5rem;
  }

  .file-preview h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #374151);
  }

  .file-preview audio {
    width: 100%;
    margin-bottom: 1.5rem;
    border-radius: 0.375rem;
  }

  .preview-actions {
    display: flex;
    justify-content: center;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    min-width: 120px;
    justify-content: center;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .model-info {
    text-align: center;
    padding: 2rem;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 0.75rem;
    border: 1px solid var(--border-color, #cbd5e1);
  }

  .model-info p {
    margin: 0;
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
  }

  .model-info strong {
    color: var(--text-primary, #334155);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .method-tabs {
      flex-direction: column;
      gap: 0.5rem;
    }

    .tab-button {
      text-align: center;
    }
  }

  @media (max-width: 768px) {
    .transcript-main {
      padding: 1rem;
    }

    .page-header h1 {
      font-size: 1.875rem;
    }

    .warning-banner {
      padding: 1rem;
      flex-direction: column;
      text-align: center;
    }

    .warning-icon {
      align-self: center;
    }

    .transcription-section {
      padding: 1.5rem;
    }

    .transcription-section h2 {
      font-size: 1.5rem;
    }

    .file-preview {
      padding: 1rem;
    }
  }

  @media (max-width: 480px) {
    .page-header h1 {
      font-size: 1.5rem;
    }

    .page-description {
      font-size: 1rem;
    }

    .warning-banner {
      padding: 0.875rem;
    }

    .message {
      padding: 0.875rem;
      font-size: 0.875rem;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      font-size: 0.8rem;
    }
  }

  /* High Contrast Mode Support */
  @media (prefers-contrast: high) {
    .warning-banner {
      background: #fff3cd;
      border-color: #856404;
    }

    .btn-primary {
      background-color: #0056b3;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #004085;
    }
  }

  /* Reduced Motion Support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }

    .method-panel {
      animation: none;
    }
  }

  /* Focus Visible Support */
  .btn:focus-visible,
  button:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
</style>