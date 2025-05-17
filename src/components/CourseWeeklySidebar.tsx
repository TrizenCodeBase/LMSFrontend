import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WeekData } from '@/data/courseWeekData';

interface CourseWeeklySidebarProps {
  weekData: Record<string, WeekData>;
  selectedWeek: string;
  onWeekSelect: (weekId: string) => void;
  courseTitle: string;
  instructor: string;
}

const CourseWeeklySidebar = ({
  weekData,
  selectedWeek,
  onWeekSelect,
  courseTitle,
  instructor
}: CourseWeeklySidebarProps) => {
  const [isWeeksOpen, setIsWeeksOpen] = useState(true);
  
  return (
    <div className="w-full md:w-72 lg:w-80 bg-card border-r border-border flex-shrink-0">
      <div className="p-4 space-y-4">
        {/* Course title */}
        <div>
          <h2 className="font-semibold text-lg leading-tight">{courseTitle}</h2>
          <p className="text-sm text-muted-foreground">{instructor}</p>
        </div>
        
        <Separator />
        
        {/* Course materials dropdown */}
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer py-1"
            onClick={() => setIsWeeksOpen(!isWeeksOpen)}
          >
            <h3 className="font-medium">Course Material</h3>
            {isWeeksOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          
          {isWeeksOpen && (
            <div className="pl-2 space-y-1">
              {Object.values(weekData).map(week => (
                <div 
                  key={week.id}
                  className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-accent ${
                    selectedWeek === week.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => onWeekSelect(week.id)}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                    week.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-primary'
                  }`}>
                    {week.completed && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">
                    Week {week.id.replace('week', '')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Other sidebar sections */}
        <div className="space-y-2">
          <div className="py-1">
            <h3 className="font-medium">Grades</h3>
          </div>
          <div className="pl-2 space-y-1">
            <div className="text-sm p-2 cursor-pointer hover:bg-accent rounded-md">Notes</div>
            <div className="text-sm p-2 cursor-pointer hover:bg-accent rounded-md">Messages</div>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search in course" 
            className="w-full pl-10 pr-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
          />
        </div>
        
        <div className="bg-accent/50 p-3 rounded-md">
          <p className="text-sm">
            Like this course? Become an expert by joining the Natural Language Processing Specialization
          </p>
          <Button variant="link" className="text-primary p-0 h-auto text-sm mt-1">
            Learn more
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseWeeklySidebar;
