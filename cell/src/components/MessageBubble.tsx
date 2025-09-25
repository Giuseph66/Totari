import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Message } from '../types';
import { formatRelativeTime } from '../utils/formatters';
import { AudioPlayer } from './AudioPlayer';

interface MessageBubbleProps {
  message: Message;
  onCopyText?: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCopyText }) => {
  switch (message.kind) {
    case 'audio':
      return <AudioMessage message={message} onCopyText={onCopyText} />;
    case 'transcript':
      return <TranscriptMessage message={message} onCopyText={onCopyText} />;
    case 'improvement':
      return <ImprovementMessage message={message} onCopyText={onCopyText} />;
    case 'note':
      return <NoteMessage message={message} onCopyText={onCopyText} />;
    default:
      return <DefaultMessage message={message} onCopyText={onCopyText} />;
  }
};

const AudioMessage: React.FC<{ message: Message; onCopyText?: (text: string) => void }> = ({ message, onCopyText }) => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  if (!message.payload.audio) return null;
  
  const handleCopyTranscript = () => {
    if (onCopyText && message.payload.transcript?.text) {
      onCopyText(message.payload.transcript.text);
    }
  };
  
  return (
    <View 
      style={[
        styles.bubble, 
        { 
          backgroundColor: colors.audioBubble,
          borderColor: colors.audioBubbleBorder,
          alignSelf: 'flex-end'
        }
      ]} 
      accessibilityLabel="Mensagem de áudio"
    >
      <View style={styles.header}>
        <Text style={[styles.sender, { color: colors.text }]} accessibilityRole="header">Você</Text>
        <Text style={[styles.timestamp, { color: colors.text }]} accessibilityLabel={`Enviado ${formatRelativeTime(message.createdAt)}`}>
          {formatRelativeTime(message.createdAt)}
        </Text>
      </View>
      
      <AudioPlayer 
        base64={message.payload.audio.base64}
        duration={message.payload.audio.durationSec}
      />
      
      {/* Show transcript if available */}
      {message.payload.transcript?.text && (
        <View style={styles.transcriptSection}>
          <Text style={[styles.transcriptLabel, { color: colors.text }]}>Transcrição:</Text>
          <Text 
            style={[styles.transcriptText, { color: colors.text }]}
            accessibilityLabel="Texto da transcrição"
            accessible={true}
          >
            {message.payload.transcript.text}
          </Text>
          {onCopyText && (
            <TouchableOpacity 
              onPress={handleCopyTranscript} 
              style={[styles.copyButton, { backgroundColor: 'transparent' }]}
              accessibilityLabel="Copiar texto da transcrição"
              accessibilityRole="button"
            >
              <Ionicons name="copy-outline" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.statusContainer}>
        <Text 
          style={[styles.status, { color: colors.text }]}
          accessibilityLabel={`Status: ${
            message.status === 'recording' ? 'Gravando' :
            message.status === 'transcribing' ? 'Transcrevendo' :
            message.status === 'transcribed' ? 'Transcrito' :
            message.status === 'improved' ? 'Processado' :
            message.status === 'error' ? `Erro: ${message.error || 'Erro desconhecido'}` :
            'Desconhecido'
          }`}
        >
          {message.status === 'recording' && 'Gravando...'}
          {message.status === 'transcribing' && 'Transcrevendo...'}
          {message.status === 'transcribed' && ''}
          {message.status === 'improved' && 'Processado'}
          {message.status === 'error' && `Erro: ${message.error || 'Erro desconhecido'}`}
        </Text>
      </View>
    </View>
  );
};

const TranscriptMessage: React.FC<{ message: Message; onCopyText?: (text: string) => void }> = ({ 
  message, 
  onCopyText 
}) => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  if (!message.payload.transcript) return null;
  
  const handleCopy = () => {
    if (onCopyText) {
      onCopyText(message.payload.transcript?.text || '');
    }
  };
  
  return (
    <View 
      style={[
        styles.bubble, 
        { 
          backgroundColor: colors.transcriptBubble,
          borderColor: colors.transcriptBubbleBorder,
          alignSelf: 'flex-start'
        }
      ]} 
      accessibilityLabel="Mensagem de transcrição"
    >
      <View style={styles.header}>
        <Text style={[styles.sender, { color: colors.text }]} accessibilityRole="header">Transcrição</Text>
        <Text style={[styles.timestamp, { color: colors.text }]} accessibilityLabel={`Enviado ${formatRelativeTime(message.createdAt)}`}>
          {formatRelativeTime(message.createdAt)}
        </Text>
      </View>
      
      <Text 
        style={[styles.transcriptText, { color: colors.text }]}
        accessibilityLabel="Transcript text"
        accessible={true}
      >
        {message.payload.transcript.text}
      </Text>
      
      <TouchableOpacity 
        onPress={handleCopy} 
        style={[styles.copyButton, { backgroundColor: colors.tint }]}
        accessibilityLabel="Copiar texto da transcrição"
        accessibilityRole="button"
      >
        <Ionicons name="copy-outline" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const ImprovementMessage: React.FC<{ message: Message; onCopyText?: (text: string) => void }> = ({ 
  message, 
  onCopyText 
}) => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  if (!message.payload.improvement) return null;
  
  const { texto_melhorado, topicos, insights, resumo } = message.payload.improvement;
  
  return (
    <View 
      style={[
        styles.bubble, 
        { 
          backgroundColor: colors.improvementBubble,
          borderColor: colors.improvementBubbleBorder,
          alignSelf: 'flex-start'
        }
      ]} 
      accessibilityLabel="Improvement message"
    >
      <View style={styles.header}>
        <Text style={[styles.sender, { color: colors.text }]} accessibilityRole="header">Improvement</Text>
        <Text style={[styles.timestamp, { color: colors.text }]} accessibilityLabel={`Enviado ${formatRelativeTime(message.createdAt)}`}>
          {formatRelativeTime(message.createdAt)}
        </Text>
      </View>
      
      <View 
        style={styles.section}
        accessibilityLabel="Improved text section"
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">Improved Text</Text>
        <Text 
          style={[styles.improvedText, { color: colors.text }]}
          accessibilityLabel="Improved text content"
          accessible={true}
        >
          {texto_melhorado}
        </Text>
        {onCopyText && (
          <TouchableOpacity 
            onPress={() => onCopyText(texto_melhorado)} 
            style={[styles.copyButton, { backgroundColor: colors.tint }]}
            accessibilityLabel="Copy improved text"
            accessibilityRole="button"
          >
            <Ionicons name="copy-outline" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
      
      {topicos && topicos.length > 0 && (
        <View 
          style={styles.section}
          accessibilityLabel="Topics section"
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">Topics</Text>
          {topicos.map((topic, index) => (
            <Text 
              key={index} 
              style={[styles.listItem, { color: colors.text }]}
              accessibilityLabel={`Topic ${index + 1}: ${topic}`}
              accessible={true}
            >
              • {topic}
            </Text>
          ))}
        </View>
      )}
      
      {insights && insights.length > 0 && (
        <View 
          style={styles.section}
          accessibilityLabel="Insights section"
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">Insights</Text>
          {insights.map((insight, index) => (
            <Text 
              key={index} 
              style={[styles.listItem, { color: colors.text }]}
              accessibilityLabel={`Insight ${index + 1}: ${insight}`}
              accessible={true}
            >
              • {insight}
            </Text>
          ))}
        </View>
      )}
      
      {resumo && (
        <View 
          style={styles.section}
          accessibilityLabel="Summary section"
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">Summary</Text>
          <Text 
            style={[styles.summaryText, { color: colors.text }]}
            accessibilityLabel="Summary content"
            accessible={true}
          >
            {resumo}
          </Text>
          {onCopyText && (
            <TouchableOpacity 
              onPress={() => onCopyText(resumo)} 
              style={[styles.copyButton, { backgroundColor: colors.tint }]}
              accessibilityLabel="Copy summary"
              accessibilityRole="button"
            >
              <Ionicons name="copy-outline" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const NoteMessage: React.FC<{ message: Message; onCopyText?: (text: string) => void }> = ({ 
  message, 
  onCopyText 
}) => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  if (!message.payload.note) return null;
  
  const handleCopy = () => {
    if (onCopyText) {
      onCopyText(message.payload.note?.text || '');
    }
  };
  
  return (
    <View 
      style={[
        styles.bubble, 
        { 
          backgroundColor: colors.improvementBubble,
          borderColor: colors.improvementBubbleBorder,
          alignSelf: 'flex-start'
        }
      ]} 
      accessibilityLabel="Resposta da IA"
    >
      <View style={styles.header}>
        <Text style={[styles.sender, { color: colors.text }]} accessibilityRole="header">IA</Text>
        <Text style={[styles.timestamp, { color: colors.text }]} accessibilityLabel={`Enviado ${formatRelativeTime(message.createdAt)}`}>
          {formatRelativeTime(message.createdAt)}
        </Text>
      </View>
      
      <Text 
        style={[styles.noteText, { color: colors.text }]}
        accessibilityLabel="Resposta da IA"
        accessible={true}
      >
        {message.payload.note.text}
      </Text>
      
      {onCopyText && (
        <TouchableOpacity 
          onPress={handleCopy} 
          style={[styles.copyButton, { backgroundColor: 'transparent' }]}
          accessibilityLabel="Copiar resposta da IA"
          accessibilityRole="button"
        >
          <Ionicons name="copy-outline" size={16} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const DefaultMessage: React.FC<{ message: Message; onCopyText?: (text: string) => void }> = ({ message, onCopyText }) => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const handleCopy = () => {
    if (onCopyText && message.payload.note?.text) {
      onCopyText(message.payload.note.text);
    }
  };
  
  return (
    <View 
      style={[
        styles.bubble, 
        { 
          backgroundColor: colors.defaultBubble,
          borderColor: colors.defaultBubbleBorder,
          alignSelf: 'flex-start'
        }
      ]} 
      accessibilityLabel={`${message.kind === 'system' ? 'System' : 'Note'} message`}
    >
      <View style={styles.header}>
        <Text style={[styles.sender, { color: colors.text }]} accessibilityRole="header">
          {message.kind === 'system' ? 'System' : 'Note'}
        </Text>
        <Text style={[styles.timestamp, { color: colors.text }]} accessibilityLabel={`Enviado ${formatRelativeTime(message.createdAt)}`}>
          {formatRelativeTime(message.createdAt)}
        </Text>
      </View>
      
      <Text 
        style={[styles.defaultText, { color: colors.text }]}
        accessibilityLabel="Message content"
        accessible={true}
      >
        {message.payload.note?.text || 'Unsupported message type'}
      </Text>
      
      {onCopyText && message.payload.note?.text && (
        <TouchableOpacity 
          onPress={handleCopy} 
          style={[styles.copyButton, { backgroundColor: colors.tint }]}
          accessibilityLabel="Copiar mensagem"
          accessibilityRole="button"
        >
          <Ionicons name="copy-outline" size={16} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    maxWidth: '85%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sender: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
  },
  statusContainer: {
    marginTop: 8,
  },
  status: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  transcriptSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 22,
  },
  copyButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  improvedText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  defaultText: {
    fontSize: 16,
    lineHeight: 22,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
});