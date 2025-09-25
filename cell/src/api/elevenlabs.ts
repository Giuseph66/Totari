import axios from 'axios';

/**
 * Transcribe audio using ElevenLabs Speech-to-Text API
 * @param base64Audio The base64 encoded audio data
 * @param contentType The MIME type of the audio
 * @returns Promise that resolves with the transcription result
 */
export async function transcribeWithElevenLabs(base64Audio: string, contentType: string = 'audio/m4a') {
  try {
    // Fix base64 padding
    const fixedBase64 = base64Audio.padEnd(base64Audio.length + (4 - base64Audio.length % 4) % 4, '=');
    
    console.log('Iniciando transcrição com ElevenLabs...', {
      base64_length: base64Audio.length,
      api_key: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY ? 'Present' : 'Missing'
    });

    // Create a Blob from base64 for better compatibility
    const binaryString = atob(fixedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create Blob
    const blob = new Blob([bytes], { type: 'audio/wav' });

    // Create form data for file upload
    const formData = new FormData();
    
    // Add the audio file with correct field name and format
    formData.append('file', blob, 'audio.wav');
    
    // Add model_id parameter
    formData.append('model_id', 'scribe_v1');

    const response = await axios.post('https://api.elevenlabs.io/v1/speech-to-text', formData, {
      headers: {
        'xi-api-key': process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',
        'Accept': 'application/json'
      },
      maxBodyLength: Infinity,
      timeout: 120000 // 2 minutes
    });

    console.log('Transcrição ElevenLabs:', response.data);
    
    return {
      text: response.data?.text || response.data?.transcript || '',
      words: response.data?.words || [],
      language_code: response.data?.language_code || 'pt',
      confidence: response.data?.confidence || 0.8
    };
  } catch (error) {
    console.error('Error transcribing with ElevenLabs:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // Return a fallback instead of throwing
    return {
      text: 'Transcrição não disponível no momento',
      words: [],
      language_code: 'pt',
      confidence: 0
    };
  }
}