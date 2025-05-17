
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Users } from "lucide-react";

interface InternshipCardProps {
  title: string;
  department: string;
  location: string;
  type: "remote" | "hybrid" | "on-site";
  description: string;
  requirements: string[];
  applyLink: string;
}

const InternshipCard: React.FC<InternshipCardProps> = ({
  title,
  department,
  location,
  type,
  description,
  requirements,
  applyLink,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Briefcase className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{department}</span>
            </CardDescription>
          </div>
          <Badge 
            variant={type === "remote" ? "outline" : type === "hybrid" ? "secondary" : "default"}
            className={`
              ${type === "remote" ? "border-primary text-primary" : ""}
              ${type === "hybrid" ? "bg-secondary/20 text-secondary" : ""}
            `}
          >
            {type}
          </Badge>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Users className="h-4 w-4 mr-1" />
          <span>{location}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Requirements
            </h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-1">
              {requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <a href={applyLink} target="_blank" rel="noopener noreferrer">
            Apply Now
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InternshipCard;
