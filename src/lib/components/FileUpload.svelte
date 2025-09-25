<script>
  import IconSpinner from './IconSpinner.svelte'

  const {
    accept = 'audio/*',
    maxSize = 50 * 1024 * 1024, // 50MB
    allowedFormats = ['mp3', 'wav', 'wma', 'm4a', 'flac', 'ogg'],
    isUploading = false,
    progress = 0,
    label = 'Last opp lydfil',
    helperText = 'Dra og slipp lydfilen her, eller klikk for å velge fil',
    onFileSelected,
    onFileCleared
  } = $props()

  let fileInput = $state()
  let isDragOver = $state(false)
  let errorMessage = $state('')
  let uploadedFileName = $state('')

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file) => {
    errorMessage = ''

    // Check file size
    if (file.size > maxSize) {
      errorMessage = `Filen er for stor. Maksimum størrelse er ${formatFileSize(maxSize)}`
      return false
    }

    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension && !allowedFormats.includes(extension)) {
      errorMessage = `Ikke støttet filformat. Støttede formater: ${allowedFormats.join(', ')}`
      return false
    }

    // Check MIME type
    if (!file.type.startsWith('audio/')) {
      errorMessage = 'Kun lydfiler er tillatt'
      return false
    }

    return true
  }

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!validateFile(file)) return

    uploadedFileName = file.name
    onFileSelected?.({ file })
  }

  const handleInputChange = (event) => {
    handleFileSelect(event.target.files)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    isDragOver = true
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    isDragOver = false
  }

  const handleDrop = (event) => {
    event.preventDefault()
    isDragOver = false
    const files = event.dataTransfer?.files
    handleFileSelect(files)
  }

  const openFileDialog = () => {
    fileInput?.click()
  }

  const clearFile = () => {
    uploadedFileName = ''
    errorMessage = ''
    if (fileInput) fileInput.value = ''
    onFileCleared?.()
  }
</script>

<div class="file-upload-container">
  <label for="file-input" class="file-upload-label">
    {label}
  </label>

  <div
    class="file-upload-zone {isDragOver ? 'drag-over' : ''} {errorMessage ? 'error' : ''}"
    role="button"
    tabindex="0"
    aria-label="Filopplastingsområde. {helperText}"
    onkeydown={(e) => e.key === 'Enter' && openFileDialog()}
    onclick={openFileDialog}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    {#if isUploading}
      <div class="upload-progress">
        <IconSpinner width="24px" />
        <span>Laster opp... {progress}%</span>
        {#if progress > 0}
          <div class="progress-bar">
            <div class="progress-fill" style="width: {progress}%"></div>
          </div>
        {/if}
      </div>
    {:else if uploadedFileName}
      <div class="file-selected">
        <span class="file-icon">📄</span>
        <div class="file-info">
          <span class="file-name">{uploadedFileName}</span>
          <button
            type="button"
            class="clear-button"
            onclick={clearFile}
            aria-label="Fjern valgt fil"
          >
            Fjern
          </button>
        </div>
      </div>
    {:else}
      <div class="upload-prompt">
        <span class="upload-icon">📁</span>
        <p class="upload-text">{helperText}</p>
        <p class="upload-limits">
          Støttede formater: {allowedFormats.join(', ')} | Maks størrelse: {formatFileSize(maxSize)}
        </p>
      </div>
    {/if}
  </div>

  {#if errorMessage}
    <div class="error-message" role="alert" aria-live="polite">
      {errorMessage}
    </div>
  {/if}

  <input
    bind:this={fileInput}
    id="file-input"
    type="file"
    {accept}
    onchange={handleInputChange}
    class="file-input-hidden"
    aria-hidden="true"
    tabindex="-1"
  />
</div>

<style>
  .file-upload-container {
    width: 100%;
    max-width: 600px;
  }

  .file-upload-label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #1f2937);
  }

  .file-upload-zone {
    border: 2px dashed #d1d5db;
    border-radius: 0.75rem;
    padding: 2rem;
    text-align: center;
    background-color: var(--bg-secondary, #f9fafb);
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .file-upload-zone:hover {
    border-color: #3b82f6;
    background-color: var(--bg-hover, #eff6ff);
  }

  .file-upload-zone:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-color: #3b82f6;
  }

  .file-upload-zone.drag-over {
    border-color: #3b82f6;
    background-color: var(--bg-hover, #eff6ff);
    transform: scale(1.02);
  }

  .file-upload-zone.error {
    border-color: #ef4444;
    background-color: #fef2f2;
  }

  .upload-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .upload-icon {
    font-size: 3rem;
    opacity: 0.7;
  }

  .upload-text {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary, #374151);
    margin: 0;
  }

  .upload-limits {
    font-size: 0.875rem;
    color: var(--text-secondary, #6b7280);
    margin: 0;
  }

  .file-selected {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--bg-success, #f0fdf4);
    border: 1px solid #86efac;
    border-radius: 0.5rem;
    width: 100%;
  }

  .file-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .file-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .file-name {
    font-weight: 500;
    color: var(--text-primary, #1f2937);
    word-break: break-all;
  }

  .clear-button {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    color: var(--text-secondary, #6b7280);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .clear-button:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  .upload-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .progress-bar {
    width: 100%;
    max-width: 300px;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
    border-radius: 4px;
  }

  .error-message {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
    color: #dc2626;
    font-size: 0.875rem;
  }

  .file-input-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 640px) {
    .file-upload-zone {
      padding: 1.5rem 1rem;
      min-height: 120px;
    }

    .upload-icon {
      font-size: 2rem;
    }

    .upload-text {
      font-size: 1rem;
    }

    .upload-limits {
      font-size: 0.8rem;
    }
  }
</style>