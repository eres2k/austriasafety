export class VoiceRecognition {
  private recognition: any
  private isListening: boolean = false
  private onResult: (text: string) => void
  private onError: (error: any) => void
  private language: string

  constructor(options: {
    onResult: (text: string) => void
    onError?: (error: any) => void
    language?: string
  }) {
    this.onResult = options.onResult
    this.onError = options.onError || console.error
    this.language = options.language || 'de-DE'

    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition()
      this.setupRecognition()
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition()
      this.setupRecognition()
    } else {
      console.warn('Speech recognition not supported')
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = this.language

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript

      if (event.results[last].isFinal) {
        this.onResult(transcript)
      }
    }

    this.recognition.onerror = (event: any) => {
      this.onError(event.error)
      this.isListening = false
    }

    this.recognition.onend = () => {
      this.isListening = false
    }
  }

  start() {
    if (!this.recognition || this.isListening) return
    
    try {
      this.recognition.start()
      this.isListening = true
    } catch (error) {
      this.onError(error)
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) return
    
    try {
      this.recognition.stop()
      this.isListening = false
    } catch (error) {
      this.onError(error)
    }
  }

  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }
}