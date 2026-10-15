import { ChurchServiceTemplate } from '../types/timer';

export const CHURCH_SERVICE_TEMPLATES: ChurchServiceTemplate[] = [
  {
    id: 'sunday-main',
    name: 'Sunday Morning Worship',
    description: 'Standard Sunday celebration order of service',
    items: [
      { id: 'sun-1', title: 'Opening Prayer & Call to Worship', durationMinutes: 5, category: 'prayer' },
      { id: 'sun-2', title: 'Praise & Worship', durationMinutes: 25, category: 'worship' },
      { id: 'sun-3', title: 'Welcome & Announcements', durationMinutes: 7, category: 'announcements' },
      { id: 'sun-4', title: 'Choir Ministration / Special Song', durationMinutes: 8, category: 'worship' },
      { id: 'sun-5', title: 'The Sermon / Word', speaker: 'Senior Pastor', durationMinutes: 35, category: 'word' },
      { id: 'sun-6', title: 'Altar Call & Ministry Prayer', durationMinutes: 8, category: 'prayer' },
      { id: 'sun-7', title: 'Tithes & Offering', durationMinutes: 5, category: 'offering' },
      { id: 'sun-8', title: 'Benediction & Pastoral Blessing', durationMinutes: 3, category: 'prayer' },
    ],
  },
  {
    id: 'midweek-service',
    name: 'Midweek Bible Study',
    description: 'Focused teaching and prayer service',
    items: [
      { id: 'mid-1', title: 'Opening Hymn & Prayer', durationMinutes: 10, category: 'prayer' },
      { id: 'mid-2', title: 'Praise & Adoration', durationMinutes: 15, category: 'worship' },
      { id: 'mid-3', title: 'Expository Bible Teaching', durationMinutes: 45, category: 'word' },
      { id: 'mid-4', title: 'Q&A / Discussion', durationMinutes: 15, category: 'word' },
      { id: 'mid-5', title: 'Intercessory Prayer', durationMinutes: 15, category: 'prayer' },
      { id: 'mid-6', title: 'Benediction', durationMinutes: 3, category: 'prayer' },
    ],
  },
  {
    id: 'youth-service',
    name: 'Youth & Young Adults Service',
    description: 'Dynamic worship and relevant topical message',
    items: [
      { id: 'yth-1', title: 'Icebreaker & Countdown', durationMinutes: 5, category: 'announcements' },
      { id: 'yth-2', title: 'Youth Praise & Worship', durationMinutes: 20, category: 'worship' },
      { id: 'yth-3', title: 'Testimony / Spotlight', durationMinutes: 7, category: 'worship' },
      { id: 'yth-4', title: 'Message / Word', durationMinutes: 25, category: 'word' },
      { id: 'yth-5', title: 'Prayer & Small Group Wrap-up', durationMinutes: 10, category: 'prayer' },
    ],
  },
  {
    id: 'quick-presets',
    name: 'Common Quick Timers',
    description: 'Quick-access standard countdowns',
    items: [
      { id: 'qp-2m', title: 'Wrap-Up Warning', durationMinutes: 2, category: 'custom' },
      { id: 'qp-5m', title: '5 Minute Countdown', durationMinutes: 5, category: 'custom' },
      { id: 'qp-10m', title: '10 Minute Segment', durationMinutes: 10, category: 'custom' },
      { id: 'qp-15m', title: '15 Minute Timer', durationMinutes: 15, category: 'custom' },
      { id: 'qp-20m', title: '20 Minute Session', durationMinutes: 20, category: 'custom' },
      { id: 'qp-30m', title: '30 Minute Sermon', durationMinutes: 30, category: 'word' },
      { id: 'qp-45m', title: '45 Minute Keynote', durationMinutes: 45, category: 'word' },
      { id: 'qp-60m', title: '60 Minute Service Block', durationMinutes: 60, category: 'custom' },
    ],
  },
];
