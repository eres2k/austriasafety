// Voice Controller
export class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
    }

    init() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.lang = 'de-AT';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                console.log('Voice input:', transcript);
                this.handleCommand(transcript.toLowerCase());
            };
        }
    }

    handleCommand(command) {
        if (command.includes('neue inspektion')) {
            alert('Starting new inspection...');
        } else if (command.includes('foto')) {
            alert('Taking photo...');
        }
    }

    toggle() {
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            document.getElementById('voiceButton').style.background = '#00d4ff';
        } else {
            this.recognition.start();
            this.isListening = true;
            document.getElementById('voiceButton').style.background = '#00ff88';
        }
    }
}