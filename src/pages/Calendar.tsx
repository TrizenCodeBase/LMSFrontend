import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Video, BookOpen } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'lecture' | 'assignment' | 'exam' | 'workshop';
  course: string;
}

// Static events data
const staticEvents: Event[] = [
  {
    id: '1',
    title: 'Introduction to React',
    date: new Date(2024, 4, 10), // May 10, 2024
    time: '10:00 AM',
    type: 'lecture',
    course: 'React Development'
  },
  {
    id: '2',
    title: 'React Hooks Assignment',
    date: new Date(2024, 4, 12), // May 12, 2024
    time: '2:00 PM',
    type: 'assignment',
    course: 'React Development'
  },
  {
    id: '3',
    title: 'TypeScript Fundamentals',
    date: new Date(2024, 4, 15), // May 15, 2024
    time: '11:00 AM',
    type: 'lecture',
    course: 'TypeScript Mastery'
  },
  {
    id: '4',
    title: 'Final Project Submission',
    date: new Date(2024, 4, 20), // May 20, 2024
    time: '3:00 PM',
    type: 'exam',
    course: 'React Development'
  }
];

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const selectedDateEvents = staticEvents.filter(event => 
    date && event.date.toDateString() === date.toDateString()
  );

  const getEventTypeIcon = (type: Event['type']) => {
    switch (type) {
      case 'lecture': return <Video className="h-4 w-4" />;
      case 'assignment': return <BookOpen className="h-4 w-4" />;
      case 'exam': return <CalendarIcon className="h-4 w-4" />;
      case 'workshop': return <Video className="h-4 w-4" />;
    }
  };

  const getEventTypeBadgeColor = (type: Event['type']) => {
    switch (type) {
      case 'lecture': return 'bg-blue-500';
      case 'assignment': return 'bg-yellow-500';
      case 'exam': return 'bg-red-500';
      case 'workshop': return 'bg-green-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">
              Track your course schedule and deadlines
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Events for {date?.toDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDateEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No events scheduled for this date
                  </p>
                ) : (
                  selectedDateEvents.map(event => (
                    <div 
                      key={event.id} 
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getEventTypeBadgeColor(event.type)} text-white`}>
                            {getEventTypeIcon(event.type)}
                          </Badge>
                          <span className="font-medium">{event.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {event.course}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2" />
                          {event.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;