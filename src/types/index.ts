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
  status: 'todo' | 'in-progress' | 'done';
}

export type KanbanStatus = string;
export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ColumnTheme {
  id: string;
  label: string;
  color: string;
  bgColor: string;
}

export interface KanbanColumn {
  id: KanbanStatus;
  title: string;
  color: string;
  bgColor: string;
}

export interface KanbanTicket {
  id: string;
  title: string;
  description?: string;
  status: KanbanStatus;
  priority: KanbanPriority;
  storyPoints?: number;
  labels: string[];
  createdAt: Date;
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
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