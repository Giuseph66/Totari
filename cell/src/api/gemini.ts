import axios from 'axios';
import { Personality } from '../types';

/**
 * Transcribe audio using Google Gemini API
 * @param base64Audio The base64 encoded audio data
 * @param contentType The MIME type of the audio
 * @returns Promise that resolves with the transcription result
 */
export async function transcribeWithGemini(base64Audio: string, contentType: string = 'audio/m4a') {
  try {
    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new Error('Chave API do Gemini não configurada. Configure a chave nas configurações.');
    }
    
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    // Determinar o tipo MIME correto para o Gemini
    let geminiMimeType = contentType;
    if (contentType.includes('webm')) {
      geminiMimeType = 'audio/webm';
    } else if (contentType.includes('mp4')) {
      geminiMimeType = 'audio/mp4';
    } else if (contentType.includes('wav')) {
      geminiMimeType = 'audio/wav';
    } else if (contentType.includes('m4a')) {
      geminiMimeType = 'audio/mp4'; // Gemini aceita MP4 para M4A
    }

    console.log('Iniciando transcrição com Gemini...', {
      base64_length: base64Audio.length,
      mime_type: geminiMimeType,
      api_key: GEMINI_API_KEY ? 'Present' : 'Missing',
      env_vars: {
        EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY ? 'Present' : 'Missing',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Present' : 'Missing'
      }
    });

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Por favor, transcreva o áudio fornecido para texto em português. Retorne apenas o texto transcrito, sem comentários adicionais."
            },
            {
              inline_data: {
                mime_type: geminiMimeType,
                data: base64Audio
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    };

    const response = await axios.post(API_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      timeout: 120000 // 2 minutes
    });

    if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
      throw new Error('Resposta inválida da API de transcrição');
    }

    const transcription = response.data.candidates[0].content.parts[0].text.trim();
    
    if (!transcription || transcription.length < 5) {
      throw new Error('Transcrição muito curta ou vazia');
    }

    console.log('Transcrição realizada com sucesso:', transcription);
    
    return {
      text: transcription,
      words: [], // Gemini não retorna palavras individuais
      language_code: 'pt',
      confidence: 0.9 // Gemini tem alta confiabilidade
    };
  } catch (error: any) {
    console.log('Error transcribing with Gemini:', error);
    
    // Log more details about the error
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('Request error:', error.request);
    } else {
      console.log('Error message:', error.message);
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

/**
 * Generate AI response with personality using Google Gemini API
 * @param transcription The transcribed text from audio
 * @param personality The selected personality for the AI
 * @param conversationHistory Previous messages for context
 * @returns Promise that resolves with the AI response
 */
export async function generatePersonalityResponse(
  transcription: string, 
  personality: Personality | null,
  conversationHistory: string[] = []
): Promise<string> {
  try {
    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new Error('Chave API do Gemini não configurada');
    }
    
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    // Build personality context
    const personalityContext = personality ? `
Você é ${personality.name}, ${personality.role}.

Descrição: ${personality.description}

Regras de comportamento:
${personality.rules.map(rule => `- ${rule}`).join('\n')}

` : `
Você é uma IA amigável e útil que pode ajudar com qualquer assunto.
`;

    // Build conversation history context
    const historyContext = conversationHistory.length > 0 ? `
Histórico da conversa:
${conversationHistory.join('\n')}

` : '';

    const prompt = `${personalityContext}${historyContext}O usuário disse: "${transcription}"

Responda de forma natural e conversacional em português brasileiro, mantendo sua personalidade e considerando o contexto da conversa. Seja útil, empático e engajante.`;

    console.log('Gerando resposta com personalidade:', {
      personality: personality?.name || 'Padrão',
      transcription_length: transcription.length,
      history_length: conversationHistory.length
    });

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7, // Mais criativo para personalidade
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const response = await axios.post(API_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      timeout: 60000 // 1 minute
    });

    if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
      throw new Error('Resposta inválida da API');
    }

    const aiResponse = response.data.candidates[0].content.parts[0].text.trim();
    
    if (!aiResponse || aiResponse.length < 5) {
      throw new Error('Resposta muito curta ou vazia');
    }

    console.log('Resposta gerada com sucesso:', aiResponse.substring(0, 100) + '...');
    
    return aiResponse;
  } catch (error) {
    console.error('Erro ao gerar resposta com personalidade:', error);
    
    // Fallback response based on personality
    const fallbackResponse = personality 
      ? `Desculpe, ${personality.name} está com dificuldades técnicas no momento. Pode tentar novamente?`
      : 'Desculpe, estou com dificuldades técnicas no momento. Pode tentar novamente?';
    
    return fallbackResponse;
  }
}
