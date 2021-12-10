window.addEventListener("load", () => {
    const canvas = document.querySelector("#canvas1");
    const snail = document.querySelector("#snail");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Bar {
        constructor(x, y, width, height, color, index){
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = color;
            this.index = index;
        }

        update(micInput) {
            const sound = micInput * 1000;
            if (sound > this.height) {
                this.height = sound;
            } else {
                this.height -= this.height * 0.03;
            }
        }

        draw(context) {
            context.strokeStyle = this.color;
            context.lineWidth = this.width;
            context.save();
            context.rotate(this.index * 0.043);
            context.beginPath();
            context.bezierCurveTo(this.x/2, this.y/2, this.height * -0.5 - 150, this.height + 50, this.x, this.y);
            context.stroke();
            if (this.index > 170) {
                context.beginPath();
                context.arc(this.x, this.y + 10 + this.height / 2 + this.height * 0.1, this.height * 0.05, 0, Math.PI * 2);
                context.stroke();
                context.beginPath();
                context.moveTo(this.x, this.y + 10);
                context.lineTo(this.x, this.y + 10 + this.height / 2);
                context.stroke();
            }
            context.restore();
        }
    }

    class Microphone {
        constructor(fftSize) {
            this.initialized = false;
            navigator.mediaDevices.getUserMedia({audio: true})
            .then((stream) => {
                this.audioContext = new AudioContext();
                this.microphone = this.audioContext.createMediaStreamSource(stream);
                this.analyzer = this.audioContext.createAnalyser();
                this.analyzer.fftSize = fftSize;
                this.bufferLength = this.analyzer.frequencyBinCount;
                this.dataArray = new Uint8Array(this.bufferLength);
                this.microphone.connect(this.analyzer);
                this.initialized = true;
            }).catch((err) => console.log(err))
        }

        getSamples() {
            this.analyzer.getByteTimeDomainData(this.dataArray);
            let normSamples = [...this.dataArray].map(e => e/128 - 1);
            return normSamples;
        }

        getVolume() {
            this.analyzer.getByteTimeDomainData(this.dataArray);
            let normSamples = [...this.dataArray].map(e => e/128 - 1);
            let sum = 0;
            for (let i = 0; i < normSamples.length; i++) {
                sum  += normSamples[i] * normSamples[i];
            }
            let volume = Math.sqrt(sum / normSamples.length);
            return volume;
        }
    }

    let fftSize = 512
    const microphone = new Microphone(fftSize);
    let bars = [];
    let barWidth = canvas.width / (fftSize/2);
    const createBars = () => {
        for (let i = 1 ; i < (fftSize/2); i++) {
            let color = `hsl(${i * 2}, 100%, 50%)`;
            bars.push(new Bar(0, i * 0.9, 1, 50, color, i));
        }
    }
    createBars();

    let softVolume = 0;
    const animate = () => {
        if (microphone.initialized) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const samples = microphone.getSamples();
            const volume = microphone.getVolume();
            ctx.save();
            ctx.translate(canvas.width / 2 - 70, canvas.height / 2 + 50);
            bars.forEach((bar, i) => {
                bar.update(samples[i]);
                bar.draw(ctx, volume);
            });
            ctx.restore();

            softVolume = softVolume * 0.9 + volume * 0.1;
            snail.style.transform = `translate(-50%, -50%) scale(${1 + softVolume * 3}, ${1 + softVolume * 3})`;
        };
        requestAnimationFrame(animate);
    }
    animate();
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    })
})