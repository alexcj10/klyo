import { Event, Task } from '../types';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly team sync',
    date: new Date(2024, 11, 15),
    startTime: '09:00',
    endTime: '10:00',
    category: 'work',
    priority: 'high',
    color: '#3B82F6'
  },
  {
    id: '2',
    title: 'Doctor Appointment',
    description: 'Annual checkup',
    date: new Date(2024, 11, 16),
    startTime: '14:00',
    endTime: '15:00',
    category: 'health',
    priority: 'medium',
    color: '#10B981'
  },
  {
    id: '3',
    title: 'Coffee with Sarah',
    description: 'Catch up over coffee',
    date: new Date(2024, 11, 18),
    startTime: '11:00',
    endTime: '12:00',
    category: 'social',
    priority: 'low',
    color: '#F97316'
  },
  {
    id: '4',
    title: 'Project Presentation',
    description: 'Present Q4 results',
    date: new Date(2024, 11, 20),
    startTime: '15:00',
    endTime: '16:30',
    category: 'work',
    priority: 'high',
    color: '#3B82F6'
  },
  {
    id: '5',
    title: 'Yoga Class',
    description: 'Morning yoga session',
    date: new Date(2024, 11, 22),
    startTime: '08:00',
    endTime: '09:00',
    category: 'health',
    priority: 'medium',
    color: '#10B981'
  }
];

export const mockTasks: Task[] = [];