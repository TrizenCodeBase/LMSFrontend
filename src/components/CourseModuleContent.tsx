
import React from 'react';
import { ChevronDown, ChevronUp, BookOpenText, FileText, FileVideo } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Module } from '@/data/courseWeekData';

interface CourseModuleContentProps {
  module: Module;
  weekId: string;
  onLectureComplete: (lectureId: string) => void;
  onToggleExpansion: () => void;
}

const CourseModuleContent = ({
  module,
  onLectureComplete,
  onToggleExpansion
}: CourseModuleContentProps) => {
  const getLectureIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <FileVideo className="h-4 w-4 text-blue-500" />;
      case 'reading':
        return <BookOpenText className="h-4 w-4 text-green-500" />;
      case 'quiz':
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="py-4 px-6 cursor-pointer flex flex-row items-start justify-between" onClick={onToggleExpansion}>
        <div>
          <h2 className="text-xl font-semibold">{module.title}</h2>
          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
            <span>{module.videosLeft} min of videos left</span>
            <span>{module.readingsLeft} min of readings left</span>
            <span>{module.assessmentsLeft} assessments left</span>
          </div>
        </div>
        {module.expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CardHeader>
      
      {module.expanded && (
        <CardContent className="px-6 pt-0 pb-4">
          <p className="text-muted-foreground mb-4">{module.description}</p>
          <Button variant="outline" size="sm" className="mb-4">
            Show Learning Objectives
          </Button>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Lecture Materials</h3>
            <ul className="space-y-3">
              {module.lectures.map(lecture => (
                <li key={lecture.id} className="flex items-start py-2 border-b border-border last:border-0">
                  <div className="flex items-center mr-3 mt-0.5">
                    <Checkbox 
                      id={lecture.id}
                      checked={lecture.completed}
                      onCheckedChange={() => onLectureComplete(lecture.id)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      {getLectureIcon(lecture.type)}
                      <label 
                        htmlFor={lecture.id}
                        className={`ml-2 font-medium cursor-pointer ${lecture.completed ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {lecture.title}
                      </label>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{lecture.type}</span>
                      <span>{lecture.duration}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CourseModuleContent;
