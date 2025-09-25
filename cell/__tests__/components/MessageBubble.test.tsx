import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MessageBubble } from '../../src/components/MessageBubble';

describe('MessageBubble', () => {
  const mockOnCopyText = jest.fn();
  
  const baseMessage = {
    id: '1',
    threadId: 'thread-1',
    ownerId: 'user-1',
    kind: 'note' as const,
    source: 'mobile' as const,
    createdAt: Date.now(),
    payload: {
      note: {
        text: 'Test message',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders note message correctly', () => {
    const { getByText } = render(
      <MessageBubble message={baseMessage} onCopyText={mockOnCopyText} />
    );
    
    expect(getByText('Test message')).toBeTruthy();
    expect(getByText('Note')).toBeTruthy();
  });

  test('renders audio message correctly', () => {
    const audioMessage = {
      ...baseMessage,
      kind: 'audio' as const,
      payload: {
        audio: {
          gcsPath: 'test-path',
          contentType: 'audio/m4a',
          durationSec: 30,
        },
      },
    };
    
    const { getByText } = render(
      <MessageBubble message={audioMessage} onCopyText={mockOnCopyText} />
    );
    
    expect(getByText('You')).toBeTruthy();
    expect(getByText('Uploaded')).toBeTruthy();
  });

  test('renders transcript message with copy button', () => {
    const transcriptMessage = {
      ...baseMessage,
      kind: 'transcript' as const,
      payload: {
        transcript: {
          text: 'This is a transcript',
        },
      },
    };
    
    const { getByText } = render(
      <MessageBubble message={transcriptMessage} onCopyText={mockOnCopyText} />
    );
    
    expect(getByText('Transcript')).toBeTruthy();
    expect(getByText('This is a transcript')).toBeTruthy();
    expect(getByText('Copy Text')).toBeTruthy();
  });

  test('calls onCopyText when copy button is pressed', () => {
    const transcriptMessage = {
      ...baseMessage,
      kind: 'transcript' as const,
      payload: {
        transcript: {
          text: 'This is a transcript',
        },
      },
    };
    
    const { getByText } = render(
      <MessageBubble message={transcriptMessage} onCopyText={mockOnCopyText} />
    );
    
    fireEvent.press(getByText('Copy Text'));
    
    expect(mockOnCopyText).toHaveBeenCalledWith('This is a transcript');
  });
});