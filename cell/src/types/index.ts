export type MessageKind = 'audio' | 'transcript' | 'improvement' | 'note' | 'system';

export type Message = {
  id: string;
  threadId: string;
  ownerId: string;
  kind: MessageKind;
  source: 'mobile' | 'desktop' | 'server';
  createdAt: number;
  payload: {
    audio?: { 
      base64: string; 
      contentType: string; 
      durationSec: number; 
      sizeBytes: number;
    };
    transcript?: { 
      text: string; 
      words?: Array<{start:number;end:number;word:string}>; 
      languageCode?: string; 
      confidence?: number 
    };
    improvement?: { 
      texto_melhorado: string; 
      topicos: string[]; 
      insights: string[]; 
      resumo: string 
    };
    note?: { text: string };
  };
  status?: 'pending'|'recording'|'transcribing'|'transcribed'|'improved'|'error';
  error?: string | null;
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
};

export type Thread = {
  id: string;
  ownerId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export interface Personality {
  id: string;
  name: string;
  role: string;
  description: string;
  rules: string[];
  icon: string;
  color: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PersonalityRule {
  id: string;
  personalityId: string;
  rule: string;
  priority: number;
  createdAt: number;
}