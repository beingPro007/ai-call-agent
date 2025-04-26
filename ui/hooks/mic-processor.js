class MicProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._buffer = [];
        this._threshold = 0.01;
        this._isSpeaking = false;
        this._silenceFrames = 0;
        this._maxSilenceFrames = 10;
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || input.length === 0) return true;

        const channelData = input[0];
        let rms = 0;
        for (let i = 0; i < channelData.length; i++) {
            rms += channelData[i] * channelData[i];
        }
        rms = Math.sqrt(rms / channelData.length);

        const isSpeech = rms > this._threshold;

        if (isSpeech) {
            this._isSpeaking = true;
            this._silenceFrames = 0;
            this._buffer.push(new Float32Array(channelData));
        } else if (this._isSpeaking) {
            this._silenceFrames++;
            if (this._silenceFrames > this._maxSilenceFrames) {
                this._isSpeaking = false;
                const merged = this._mergeBuffers(this._buffer);
                this.port.postMessage(merged.buffer);
                this._buffer = [];
            } else {
                this._buffer.push(new Float32Array(channelData));
            }
        }

        return true;
    }

    _mergeBuffers(buffers) {
        const length = buffers.reduce((sum, b) => sum + b.length, 0);
        const result = new Float32Array(length);
        let offset = 0;
        for (let b of buffers) {
            result.set(b, offset);
            offset += b.length;
        }
        return result;
    }
}

registerProcessor('mic-processor', MicProcessor);
