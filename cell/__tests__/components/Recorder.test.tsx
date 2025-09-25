// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(),
    setAudioModeAsync: jest.fn(),
    Recording: {
      createAsync: jest.fn(),
      STOP_AND_UNLOAD: 'stopAndUnload',
    },
  },
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Recorder } from '../../src/components/Recorder';

describe('Recorder', () => {
  const mockOnRecordingComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    const { getByText } = render(
      <Recorder onRecordingComplete={mockOnRecordingComplete} />
    );
    
    expect(getByText('RECORD')).toBeTruthy();
  });

  test('toggles recording state when button is pressed', async () => {
    // Mock the recording creation
    const mockRecording = {
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn().mockReturnValue('file://test-uri'),
    };
    
    require('expo-av').Audio.Recording.createAsync.mockResolvedValue({
      recording: mockRecording,
    });
    
    const { getByText } = render(
      <Recorder onRecordingComplete={mockOnRecordingComplete} />
    );
    
    // Press record button
    fireEvent.press(getByText('RECORD'));
    
    // Should now show STOP button
    await waitFor(() => {
      expect(getByText('STOP')).toBeTruthy();
    });
    
    // Press stop button
    fireEvent.press(getByText('STOP'));
    
    // Should call onRecordingComplete
    await waitFor(() => {
      expect(mockOnRecordingComplete).toHaveBeenCalledWith('file://test-uri', 0);
    });
  });
});