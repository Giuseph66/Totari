import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useRef, useState } from 'react';
import { AccessibilityInfo, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { saveMessage, updateMessagePayload, updateMessageStatus } from '../api/firestore';
import { generatePersonalityResponse, transcribeWithGemini } from '../api/gemini';
import { Message } from '../types';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { formatTime } from '../utils/formatters';
import { MAX_AUDIO_DURATION, validateAudioDuration, validateAudioFileSize } from '../utils/helpers';

interface RecordingStatus {
  isRecording: boolean;
  duration: number;
}

interface RecorderProps {
  threadId: string;
  onRecordingComplete: (message: Message) => void;
  onMessageUpdate?: (messageId: string, updatedMessage: Message) => void;
  personality?: any; // Personality type
  conversationHistory?: string[];
}

export const Recorder: React.FC<RecorderProps> = ({ 
  threadId, 
  onRecordingComplete, 
  onMessageUpdate, 
  personality, 
  conversationHistory = [] 
}) => {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>({
    isRecording: false,
    duration: 0,
  });
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      // Stop any existing recording
      if (recordingRef.current) {
        await stopRecording();
      }

      // Request permissions
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      
      // Start duration tracking
      setRecordingStatus({ isRecording: true, duration: 0 });
      
      // Announce recording started
      AccessibilityInfo.announceForAccessibility('Gravação iniciada');
      
      intervalRef.current = setInterval(() => {
        setRecordingStatus(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Erro', 'Falha ao iniciar gravação');
      AccessibilityInfo.announceForAccessibility('Falha ao iniciar gravação');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;
      
      // Check minimum duration (1 second)
      if (recordingStatus.duration < 1) {
        Alert.alert(
          'Gravação Muito Curta', 
          'A gravação deve ter pelo menos 1 segundo de duração.'
        );
        AccessibilityInfo.announceForAccessibility(
          'Gravação muito curta. A gravação deve ter pelo menos 1 segundo de duração.'
        );
        return;
      }
      
      // Check duration limit (20 minutes max)
      if (!validateAudioDuration(recordingStatus.duration)) {
        Alert.alert(
          'Gravação Muito Longa', 
          `Duração máxima de gravação é ${MAX_AUDIO_DURATION / 60} minutos.`
        );
        AccessibilityInfo.announceForAccessibility(
          `Gravação muito longa. Duração máxima é ${MAX_AUDIO_DURATION / 60} minutos.`
        );
        return;
      }
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Get file info
      const uri = recordingRef.current.getURI();
      const duration = recordingStatus.duration;
      
      // Clean up
      recordingRef.current = null;
      setRecordingStatus({ isRecording: false, duration: 0 });
      
      // Validate and upload
      if (uri) {
        // Validate file size
        const isValidSize = await validateAudioFileSize(uri);
        if (!isValidSize) {
          Alert.alert(
            'Arquivo Muito Grande', 
            'A gravação é muito grande (máx 25MB). Por favor, grave uma mensagem mais curta.'
          );
          AccessibilityInfo.announceForAccessibility(
            'Arquivo muito grande. Por favor, grave uma mensagem mais curta.'
          );
          return;
        }
        
        // Upload to Firebase Storage
        await uploadAudioAndTranscribe(uri, duration);
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Erro', 'Falha ao parar gravação');
      AccessibilityInfo.announceForAccessibility('Falha ao parar gravação');
    }
  };

  const uploadAudioAndTranscribe = async (uri: string, duration: number) => {
    try {
      // Get device ID
      const deviceId = await getOrCreateDeviceId();
      
      // Read file and convert to base64
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }
      
      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(uri, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
      // Create message with audio payload
      const message: Omit<Message, 'id'> = {
        threadId,
        ownerId: deviceId,
        kind: 'audio',
        source: 'mobile',
        createdAt: Date.now(),
        payload: {
          audio: {
            base64,
            contentType: 'audio/m4a',
            durationSec: duration,
            sizeBytes: fileInfo.size || 0,
          }
        },
        status: 'recording'
      };
      
      // Save message to Firestore
      const messageId = await saveMessage(message);
      const savedMessage: Message = { ...message, id: messageId };
      
      // Notify parent that recording is complete
      onRecordingComplete(savedMessage);
      // Update status to transcribing
      await updateMessageStatus(messageId, 'transcribing');
      
      // Notify parent about transcribing status
      if (onMessageUpdate) {
        const transcribingMessage: Message = {
          ...savedMessage,
          status: 'transcribing'
        };
        onMessageUpdate(messageId, transcribingMessage);
      }
      
      // Transcribe with Gemini
      AccessibilityInfo.announceForAccessibility('Transcrevendo áudio');
      
      try {
        // Transcribe with Gemini using base64 audio
        const transcriptData = await transcribeWithGemini(base64, 'audio/m4a');
        
        // Update message with transcript
        await updateMessagePayload(messageId, {
          transcript: {
            text: transcriptData.text,
            words: transcriptData.words,
            languageCode: transcriptData.language_code,
            confidence: transcriptData.confidence
          }
        });
        
        // Update status to transcribed
        await updateMessageStatus(messageId, 'transcribed');
        
        // Notify parent about completed transcription
        if (onMessageUpdate) {
          const transcribedMessage: Message = {
            ...savedMessage,
            status: 'transcribed',
            payload: {
              ...savedMessage.payload,
              transcript: {
                text: transcriptData.text,
                words: transcriptData.words,
                languageCode: transcriptData.language_code,
                confidence: transcriptData.confidence
              }
            }
          };
          onMessageUpdate(messageId, transcribedMessage);
        }
        
        // Generate AI response with personality
        AccessibilityInfo.announceForAccessibility('Gerando resposta da IA');
        
        try {
          console.log('Generating AI response with personality:', {
            personality: personality?.name || 'None',
            transcript: transcriptData.text,
            historyLength: conversationHistory.length
          });
          
          const aiResponse = await generatePersonalityResponse(
            transcriptData.text,
            personality,
            conversationHistory
          );
          
          console.log('AI Response generated:', aiResponse);
          
          // Create AI response message
          const aiMessage: Omit<Message, 'id'> = {
            threadId,
            ownerId: await getOrCreateDeviceId(),
            kind: 'note',
            source: 'server',
            createdAt: Date.now(),
            payload: {
              note: {
                text: aiResponse
              }
            },
            status: 'improved'
          };
          
          console.log('AI Message created:', aiMessage);
          
          // Save AI response message
          const aiMessageId = await saveMessage(aiMessage);
          const savedAiMessage: Message = { ...aiMessage, id: aiMessageId };
          
          console.log('AI Message saved with ID:', aiMessageId);
          
          // Notify parent about AI response
          if (onMessageUpdate) {
            console.log('Notifying parent about AI response');
            onMessageUpdate(aiMessageId, savedAiMessage);
          } else {
            console.log('No onMessageUpdate callback provided');
          }
          
          // Announce completion
          AccessibilityInfo.announceForAccessibility('Resposta da IA gerada com sucesso');
        } catch (aiError) {
          console.error('AI response generation failed:', aiError);
          AccessibilityInfo.announceForAccessibility('Falha ao gerar resposta da IA');
        }
        
        // Announce completion
        AccessibilityInfo.announceForAccessibility('Áudio transcrito com sucesso');
        } catch (transcriptionError) {
          console.error('Transcription failed:', transcriptionError);
          await updateMessageStatus(messageId, 'error', 'Transcription failed');
          
          // Notify parent about error
          if (onMessageUpdate) {
            const errorMessage: Message = {
              ...savedMessage,
              status: 'error',
              error: 'Transcription failed'
            };
            onMessageUpdate(messageId, errorMessage);
          }
          
          AccessibilityInfo.announceForAccessibility('Falha na transcrição');
        }
      } catch (error) {
      console.error('Failed to save and transcribe audio', error);
      Alert.alert('Erro', 'Falha ao salvar e transcrever áudio');
      AccessibilityInfo.announceForAccessibility('Falha ao salvar e transcrever áudio');
    }
  };

  const toggleRecording = () => {
    if (recordingStatus.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: recordingStatus.isRecording ? 'rgba(0, 0, 0, 0.5)' : 'transparent', borderRadius: recordingStatus.isRecording ? 100 : 28 }]} accessibilityLabel="Audio recorder">
      {recordingStatus.isRecording && (
        <Text 
          style={styles.timer} 
          accessibilityLabel={`Tempo de gravação: ${formatTime(recordingStatus.duration)}`}
        >
          {formatTime(recordingStatus.duration)}
        </Text>
      )}
      <TouchableOpacity 
        style={[
          styles.button,
          recordingStatus.isRecording ? styles.recordingButton : styles.stoppedButton
        ]}
        onPress={toggleRecording}
        accessibilityLabel={recordingStatus.isRecording ? "Parar gravação" : "Iniciar gravação"}
        accessibilityRole="button"
        accessibilityState={{ busy: recordingStatus.isRecording }}
        >
        
        <Ionicons 
          name={recordingStatus.isRecording ? "stop" : "mic"} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    minWidth: 150,
    borderRadius: 100,
    gap: 16,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordingButton: {
    backgroundColor: '#f44336', // More accessible red
  },
  stoppedButton: {
    backgroundColor: '#4CAF50', // More accessible green
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333', // Better contrast
  },
});