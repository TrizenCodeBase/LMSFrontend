
import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Course } from '@/services/courseService';

interface CourseProgressTrackerProps {
  weekProgress: Record<string, boolean>;
  learningGoal: number;
  onDayToggle: (day: string) => void;
  onGoalChange: (goal: number) => void;
  courseDetails?: Course;
}

const CourseProgressTracker = ({
  weekProgress,
  learningGoal,
  onDayToggle,
  onGoalChange,
  courseDetails
}: CourseProgressTrackerProps) => {
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [goalInput, setGoalInput] = useState(learningGoal);
  
  const daysOfWeek = [
    { key: 'm', label: 'M' },
    { key: 't', label: 'T' },
    { key: 'w', label: 'W' },
    { key: 'th', label: 'TH' },
    { key: 'f', label: 'F' },
    { key: 's', label: 'S' },
    { key: 'su', label: 'SU' }
  ];
  
  const handleGoalSave = () => {
    if (goalInput >= 1 && goalInput <= 7) {
      onGoalChange(goalInput);
      setShowGoalEditor(false);
    }
  };
  
  const completedDays = Object.values(weekProgress).filter(Boolean).length;
  
  return (
    <div className="w-full md:w-72 lg:w-80 h-full bg-card border-l border-border p-4 space-y-6 overflow-y-auto">
      {/* Weekly goal progress tracker */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly goal progress tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            I'm committed to learning {learningGoal} days a week on this platform.
          </p>
          
          <div className="grid grid-cols-7 gap-1">
            {daysOfWeek.map(day => (
              <button
                key={day.key}
                onClick={() => onDayToggle(day.key)}
                className={`h-8 w-8 flex items-center justify-center text-xs rounded-full border ${
                  weekProgress[day.key] 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          
          <div className="text-sm text-center text-muted-foreground">
            {completedDays}/{learningGoal} days completed this week
          </div>
          
          {!showGoalEditor ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setShowGoalEditor(true)}
            >
              Edit my goal
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="goal" className="text-sm">Days per week:</label>
                <input
                  id="goal"
                  type="number"
                  min="1"
                  max="7"
                  value={goalInput}
                  onChange={(e) => setGoalInput(Number(e.target.value))}
                  className="w-12 px-2 py-1 border rounded text-sm"
                />
              </div>
              <Button size="sm" className="w-full text-xs" onClick={handleGoalSave}>
                Save Goal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Course timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Course timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Start date: May 1, 2025</span>
          </div>
          
          <Separator />
          
          {/* Timeline items */}
          <div className="space-y-2">
            <div className="border-l-2 border-orange-500 pl-3 py-1">
              <p className="text-sm font-medium">Sentiment Analysis</p>
              <p className="text-xs text-orange-600">Overdue: Programming Assignment</p>
            </div>
            
            <div className="border-l-2 border-yellow-500 pl-3 py-1">
              <p className="text-sm font-medium">Vector Space Models</p>
              <p className="text-xs text-yellow-600">Due: May 15, 2025</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Expected end date: June 15, 2025</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Course information */}
      {courseDetails && (
        <div className="text-sm space-y-2">
          <p className="font-medium">{courseDetails.title}</p>
          <p className="text-muted-foreground">Instructor: {courseDetails.instructor}</p>
        </div>
      )}
    </div>
  );
};

export default CourseProgressTracker;
