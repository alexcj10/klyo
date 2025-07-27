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
}