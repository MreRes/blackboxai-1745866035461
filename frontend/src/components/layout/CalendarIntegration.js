import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { notificationAPI } from '../../utils/api';

const localizer = momentLocalizer(moment);

const CalendarIntegration = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await notificationAPI.getUserReminders();
      const reminders = response.data.data.map(reminder => ({
        id: reminder.id,
        title: reminder.title,
        start: new Date(reminder.start),
        end: new Date(reminder.end),
        allDay: reminder.allDay
      }));
      setEvents(reminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Calendar Reminders</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default CalendarIntegration;
