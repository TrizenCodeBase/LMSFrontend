import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CalendarDays, Clock } from "lucide-react";

const events = [
  {
    id: 1,
    type: "Bootcamp",
    title: "MERN Stack Bootcamp",
    date: "June 15, 2025",
    time: "2:00 PM - 4:00 PM",
    isLive: false
  },
  {
    id: 2,
    type: "Bootcamp",
    title: "AI & Machine Learning Bootcamp",
    date: "June 22, 2025",
    time: "1:00 PM - 2:30 PM",
    isLive: false
  },
  {
    id: 3,
    type: "Bootcamp",
    title: "Crafting an Interview Winning Resume",
    date: "June 30, 2025",
    time: "10:00 AM - 4:00 PM",
    isLive: false
  }
];

const EventsSection = () => {
  return (
    <section id="events-section" className="py-16 bg-white">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Upcoming Events</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Join live webinars and workshops hosted by industry experts to elevate your learning and career growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {events.map((event) => (
            <Card
              key={event.id}
              className="overflow-hidden rounded-xl shadow-sm border transition hover:shadow-md"
            >
              <div className="text-white text-sm font-semibold text-center py-2 uppercase tracking-wide" style={{ backgroundColor: 'hsl(243 52% 34%)' }}>
                {event.type}
              </div>

              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {event.title}
                </h3>

                <div className="flex items-center text-gray-500 mb-2">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  <span className="italic text-sm text-gray-400">Details will be revealed soon</span>
                </div>

                <div className="flex items-center text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="italic text-sm text-gray-400">Stay tuned for timing</span>
                </div>
              </CardContent>

              <CardFooter className="border-t bg-gray-50 px-6 py-3">
                <div className="w-full text-center bg-indigo-50 text-indigo-600 border border-indigo-200 font-medium py-2 rounded-md">
                  Launching Soon
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
