import React from 'react';
import { CodeEditor } from './CodeEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Code2 } from 'lucide-react';

interface DayCodeEditorProps {
  dayNumber: number;
  code: string;
  onSave: (code: string) => Promise<void>;
}

export const DayCodeEditor: React.FC<DayCodeEditorProps> = ({
  dayNumber,
  code,
  onSave,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Code2 className="w-4 h-4 mr-2" />
          Edit Code Content
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Code Content - Day {dayNumber}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <CodeEditor
            initialCode={code}
            onSave={onSave}
            title={`Day ${dayNumber} Code`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 