// AR Controller
export class ARController {
    constructor() {
        this.stream = null;
        this.isActive = false;
    }

    init() {
        document.getElementById('arClose').addEventListener('click', () => this.stop());
        document.getElementById('arCapture').addEventListener('click', () => this.capture());
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            const video = document.getElementById('arVideo');
            video.srcObject = this.stream;
            
            document.getElementById('arOverlay').classList.add('active');
            this.isActive = true;
            
            console.log('AR mode activated');
        } catch (error) {
            console.error('Camera error:', error);
            alert('Camera access denied');
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        document.getElementById('arOverlay').classList.remove('active');
        this.isActive = false;
    }

    capture() {
        alert('Photo captured!');
    }
}