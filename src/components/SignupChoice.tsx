import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = 'student' | 'instructor';

interface SignupChoiceProps {
  selected: UserRole;
  onSelect: (role: UserRole) => void;
}

const SignupChoice = ({ selected, onSelect }: SignupChoiceProps) => {
  return (
    <div className="mb-6">
      <Card
        className={cn(
          "cursor-pointer hover:border-primary/50 transition-colors",
          selected === 'student' && "border-primary bg-primary/5"
        )}
        onClick={() => onSelect('student')}
      >
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-full bg-primary/10 p-3">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Student</h3>
            <p className="text-sm text-muted-foreground">
              Join as a student to access courses and start learning
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupChoice;
