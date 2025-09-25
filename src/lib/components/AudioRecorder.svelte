<script>
  import IconSpinner from './IconSpinner.svelte'

  let {
    isRecording = $bindable(false),
    recordingTime = $bindable(0),
    audioUrl = $bindable(null),
    // eslint-disable-next-line prefer-const
    isProcessing = false,
    // eslint-disable-next-line prefer-const
    disabled = false,
    // eslint-disable-next-line prefer-const
    onRecordingStart,
    // eslint-disable-next-line prefer-const
    onRecordingStop,
    // eslint-disable-next-line prefer-const
    onRecordingComplete,
    // eslint-disable-next-line prefer-const
    onRecordingClear,
    // eslint-disable-next-line prefer-const
    onSendToProcess,
    // eslint-disable-next-line prefer-const
    onError
  } = $props()

  let mediaRecorder = $state()
  let audioChunks = $state([])
  let timerInterval = $state()
  let recordingSupported = $state(true)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const checkMediaSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      recordingSupported = false
      return false
    }
    return true
  }

  const startRecording = async () => {
    if (!checkMediaSupport() || disabled || isProcessing) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      audioChunks = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, {
          type: mediaRecorder.mimeType || 'audio/wav'
        })
        audioUrl = URL.createObjectURL(audioBlob)

        // Clean up
        stream.getTracks().forEach(track => track.stop())
        clearInterval(timerInterval)

        onRecordingComplete?.({ audioBlob, filename: `opptak-${Date.now()}.wav` })
      }

      mediaRecorder.start(100) // Collect data every 100ms
      isRecording = true
      recordingTime = 0

      timerInterval = setInterval(() => {
        recordingTime += 1
      }, 1000)

      onRecordingStart?.()
    } catch (error) {
      console.error('Error accessing microphone:', error)
      onError?.({ message: 'Kunne ikke få tilgang til mikrofonen. Sjekk tillatelser.' })
    }
  }

  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return

    mediaRecorder.stop()
    isRecording = false
    clearInterval(timerInterval)
    onRecordingStop?.()
  }

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      audioUrl = null
    }
    recordingTime = 0
    audioChunks = []
    onRecordingClear?.()
  }

  const downloadRecording = () => {
    if (!audioUrl) return

    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `opptak-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
</script>

<div class="audio-recorder">
  <div class="recorder-header">
    <h3>Spill inn lyd</h3>
    <p>Ta opp lyd direkte fra mikrofonen</p>
  </div>

  {#if !recordingSupported}
    <div class="error-message" role="alert">
      ⚠️ Din nettleser støtter ikke lydopptak. Prøv en nyere versjon av Chrome, Firefox eller Safari.
    </div>
  {:else}
    <div class="recorder-controls">
      <button
        class="record-button {isRecording ? 'recording' : ''}"
        onclick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        aria-label={isRecording ? 'Stopp opptak' : 'Start opptak'}
        aria-describedby="recording-status"
      >
        {#if isRecording}
          🛑 Stopp opptak
        {:else}
          🎤 Start opptak
        {/if}
      </button>

      {#if isRecording}
        <div class="recording-indicator" id="recording-status">
          <div class="pulse"></div>
          <span>Opptak pågår: {formatTime(recordingTime)}</span>
        </div>
      {/if}
    </div>

    {#if audioUrl && !isRecording}
      <div class="playback-section">
        <div class="audio-controls">
          <audio
            controls
            src={audioUrl}
            aria-label="Forhåndsvisning av lydopptak"
          >
            Din nettleser støtter ikke audio-elementet.
          </audio>
        </div>

        <div class="recording-actions">
          <button
            class="action-button download"
            onclick={downloadRecording}
            aria-label="Last ned opptak"
          >
            📥 Last ned
          </button>

          <button
            class="action-button primary"
            onclick={() => onSendToProcess?.({ audioUrl })}
            disabled={isProcessing}
            aria-label="Send til transkripsjon"
          >
            {#if isProcessing}
              <IconSpinner width="20px" />
              Sender...
            {:else}
              📤 Send til transkripsjon
            {/if}
          </button>

          <button
            class="action-button secondary"
            onclick={clearRecording}
            disabled={isProcessing}
            aria-label="Start på nytt"
          >
            🗑️ Slett opptak
          </button>
        </div>

        <div class="recording-info">
          <p>
            <strong>Tips:</strong> Last ned opptaket før du sender det til transkripsjon.
            Opptaket slettes automatisk etter prosessering.
          </p>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .audio-recorder {
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .recorder-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .recorder-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #1f2937);
  }

  .recorder-header p {
    margin: 0;
    color: var(--text-secondary, #6b7280);
    font-size: 0.875rem;
  }

  .recorder-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .record-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.75rem;
    padding: 1rem 2rem;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 180px;
    justify-content: center;
  }

  .record-button:hover:not(:disabled) {
    background-color: #2563eb;
    transform: translateY(-1px);
  }

  .record-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .record-button.recording {
    background-color: #ef4444;
    animation: pulse 1.5s infinite;
  }

  .record-button.recording:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .recording-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: var(--bg-danger, #fef2f2);
    color: #dc2626;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
  }

  .pulse {
    width: 12px;
    height: 12px;
    background-color: #ef4444;
    border-radius: 50%;
    animation: pulse-dot 1s infinite;
  }

  .playback-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color, #e2e8f0);
  }

  .audio-controls {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .audio-controls audio {
    width: 100%;
    max-width: 400px;
  }

  .recording-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-button.primary {
    background-color: #16a34a;
    color: white;
  }

  .action-button.primary:hover:not(:disabled) {
    background-color: #15803d;
  }

  .action-button.secondary {
    background-color: #6b7280;
    color: white;
  }

  .action-button.secondary:hover:not(:disabled) {
    background-color: #4b5563;
  }

  .action-button.download {
    background-color: #0891b2;
    color: white;
  }

  .action-button.download:hover:not(:disabled) {
    background-color: #0e7490;
  }

  .recording-info {
    background-color: var(--bg-info, #eff6ff);
    border: 1px solid #93c5fd;
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: center;
  }

  .recording-info p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary, #1e40af);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: #fef2f2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #fecaca;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @media (max-width: 640px) {
    .audio-recorder {
      padding: 1rem;
    }

    .record-button {
      min-width: 160px;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
    }

    .recording-actions {
      flex-direction: column;
    }

    .action-button {
      justify-content: center;
      width: 100%;
    }
  }
</style>