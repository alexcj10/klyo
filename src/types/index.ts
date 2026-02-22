export type Mood = 'focus' | 'stress' | 'easy' | 'exhausting' | 'none';

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  category: 'work' | 'personal' | 'health' | 'social' | 'other';
  priority: 'low' | 'medium' | 'high';
  color: string;
  isAllDay?: boolean;
  mood?: Mood;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimatedTime?: number; // in minutes
  category: 'work' | 'personal' | 'health' | 'social' | 'other';
  mood?: Mood;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  agent?: string;
  discussion?: Array<{ agent: string, content: string }>;
  timestamp: Date;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}