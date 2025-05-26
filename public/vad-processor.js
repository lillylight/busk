/**
 * Voice Activity Detection (VAD) processor for AudioWorklet
 * This replaces the deprecated ScriptProcessorNode implementation
 */

class VADProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isSpeaking = false;
    this.silenceCounter = 0;
    this.silenceThreshold = 25; // About 500ms at 48kHz with 128 buffer size
  }

  process(inputs, outputs, parameters) {
    // Get the first input channel data
    const input = inputs[0][0];
    
    if (!input) return true;
    
    // Calculate average amplitude
    const sum = input.reduce((acc, val) => acc + Math.abs(val), 0);
    const average = sum / input.length;
    
    // Threshold for voice detection (adjust as needed)
    const threshold = 0.01;
    
    if (average > threshold && !this.isSpeaking) {
      this.isSpeaking = true;
      this.silenceCounter = 0;
      this.port.postMessage({ type: 'vad.speaking.started' });
    } else if (average <= threshold && this.isSpeaking) {
      // Count consecutive silent frames before marking as not speaking
      this.silenceCounter++;
      
      if (this.silenceCounter >= this.silenceThreshold) {
        this.isSpeaking = false;
        this.silenceCounter = 0;
        this.port.postMessage({ type: 'vad.speaking.stopped' });
      }
    } else if (average <= threshold) {
      // Reset silence counter if we're still silent
      this.silenceCounter = 0;
    }
    
    // Return true to keep the processor alive
    return true;
  }
}

registerProcessor('vad-processor', VADProcessor);