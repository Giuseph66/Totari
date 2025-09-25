import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatTime } from '../utils/formatters';

interface AudioPlayerProps {
  uri?: string;
  base64?: string;
  duration: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ uri, base64, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const playbackRef = useRef<Audio.Sound | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (playbackRef.current) {
        playbackRef.current.unloadAsync();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const loadAndPlay = async () => {
    if (!uri && !base64) return;
    
    setIsLoading(true);
    
    try {
      // Unload previous playback if exists
      if (playbackRef.current) {
        await playbackRef.current.unloadAsync();
      }
      
      let audioSource;
      if (base64) {
        // Convert base64 to data URI directly
        const dataUri = `data:audio/m4a;base64,${base64}`;
        audioSource = { uri: dataUri };
      } else {
        audioSource = { uri: uri! };
      }
      
      // Create new playback
      const { sound } = await Audio.Sound.createAsync(
        audioSource,
        { shouldPlay: true }
      );
      
      playbackRef.current = sound;
      
      // Set up playback status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          
          if (status.isPlaying) {
            const position = status.positionMillis / 1000;
            const durationSec = status.durationMillis ? status.durationMillis / 1000 : duration;
            setProgress(position / durationSec);
          }
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setProgress(0);
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
            }
            AccessibilityInfo.announceForAccessibility('Audio playback finished');
          }
        }
      });
      
      // Start playing
      await sound.playAsync();
      setIsLoading(false);
      AccessibilityInfo.announceForAccessibility('Audio playback started');
      
      // Set up progress tracking
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      
      progressInterval.current = setInterval(async () => {
        if (playbackRef.current) {
          const status = await playbackRef.current.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            const position = status.positionMillis / 1000;
            const durationSec = status.durationMillis ? status.durationMillis / 1000 : duration;
            setProgress(position / durationSec);
          }
        }
      }, 500);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
      AccessibilityInfo.announceForAccessibility('Error playing audio');
    }
  };

  const togglePlayback = async () => {
    if (isLoading) return;
    
    if (isPlaying) {
      // Pause playback
      if (playbackRef.current) {
        await playbackRef.current.pauseAsync();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      AccessibilityInfo.announceForAccessibility('Audio playback paused');
    } else {
      // Play or resume playback
      if (playbackRef.current) {
        await playbackRef.current.playAsync();
        
        // Restart progress tracking
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        
        progressInterval.current = setInterval(async () => {
          if (playbackRef.current) {
            const status = await playbackRef.current.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
              const position = status.positionMillis / 1000;
              const durationSec = status.durationMillis ? status.durationMillis / 1000 : duration;
              setProgress(position / durationSec);
            }
          }
        }, 500);
        AccessibilityInfo.announceForAccessibility('Audio playback resumed');
      } else {
        // Load and play for the first time
        await loadAndPlay();
      }
    }
  };

  const handleSeek = async (value: number) => {
    if (!playbackRef.current) return;
    
    try {
      const status = await playbackRef.current.getStatusAsync();
      if (status.isLoaded) {
        const durationMillis = status.durationMillis || (duration * 1000);
        const positionMillis = value * durationMillis;
        await playbackRef.current.setPositionAsync(positionMillis);
        setProgress(value);
        AccessibilityInfo.announceForAccessibility(`Seeked to ${formatTime(Math.floor(value * duration))}`);
      }
    } catch (error) {
      console.error('Error seeking audio:', error);
      AccessibilityInfo.announceForAccessibility('Error seeking audio');
    }
  };

  return (
    <View style={styles.container} accessibilityLabel="Audio player">
      <TouchableOpacity 
        style={styles.playButton} 
        onPress={togglePlayback}
        disabled={isLoading}
        accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" accessibilityLabel="Loading audio" />
        ) : (
          <Text style={styles.playButtonText} accessibilityTraits="button">
            {isPlaying ? '⏸' : '▶'}
          </Text>
        )}
      </TouchableOpacity>
      
      <View 
        style={styles.progressContainer}
        accessibilityLabel={`Progress: ${Math.round(progress * 100)}%`}
      >
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBar,
              { width: `${progress * 100}%` }
            ]} 
          />
        </View>
      </View>
      
      <Text 
        style={styles.durationText}
        accessibilityLabel={`Duration: ${formatTime(Math.floor(progress * duration))} of ${formatTime(duration)}`}
      >
        {formatTime(Math.floor(progress * duration))} / {formatTime(duration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    // Ensure sufficient contrast
    minWidth: 40,
  },
  playButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  progressContainer: {
    flex: 1,
    height: 6,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  durationText: {
    fontSize: 12,
    color: '#333', // Better contrast
    minWidth: 70,
    textAlign: 'right',
    fontWeight: '500',
  },
});