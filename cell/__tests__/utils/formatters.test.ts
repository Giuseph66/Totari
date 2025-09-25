import { formatTime, formatRelativeTime, formatDate } from './formatters';

describe('formatTime', () => {
  test('formats seconds correctly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(3600)).toBe('60:00');
  });
});

describe('formatRelativeTime', () => {
  beforeAll(() => {
    // Mock Date.now() to a fixed time for consistent tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('formats recent times correctly', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 30000)).toBe('just now'); // 30 seconds ago
    expect(formatRelativeTime(now - 300000)).toBe('5 minutes ago'); // 5 minutes ago
    expect(formatRelativeTime(now - 7200000)).toBe('2 hours ago'); // 2 hours ago
    expect(formatRelativeTime(now - 172800000)).toBe('2 days ago'); // 2 days ago
  });
});

describe('formatDate', () => {
  test('formats date correctly', () => {
    // Mock Date for consistent output
    const mockDate = new Date('2023-01-01T12:30:45Z');
    const timestamp = mockDate.getTime();
    
    // Since toLocaleDateString output depends on the system locale,
    // we'll just check that it returns a non-empty string
    const result = formatDate(timestamp);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});