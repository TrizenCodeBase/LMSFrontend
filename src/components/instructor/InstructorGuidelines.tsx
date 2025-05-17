import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  BookOpen,
  Users,
  BarChart2,
  Calendar,
  Settings,
  HelpCircle,
  Lightbulb,
  Video,
  CheckSquare
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const InstructorGuidelines = () => {
  const [showGuidelines, setShowGuidelines] = useState(true);

  if (!showGuidelines) {
    return (
      <div className="flex justify-end my-4">
        <Button variant="outline" onClick={() => setShowGuidelines(true)}>
          <HelpCircle className="w-4 h-4 mr-2" />
          Show Instructor Guidelines
        </Button>
      </div>
    );
  }

  return (
    <div className="my-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
          Instructor Guidelines
        </h2>
        <Button variant="ghost" onClick={() => setShowGuidelines(false)}>
          Hide Guidelines
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Instructor Dashboard</CardTitle>
          <CardDescription>
            Follow these guidelines to make the most of your teaching experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="getting-started">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="getting-started" className="space-y-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Quick Start Guide</AlertTitle>
                <AlertDescription>
                  Complete these steps to get started as an instructor.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-medium">Complete Your Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your instructor profile with your expertise, experience, and a professional photo to build credibility with potential students.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-medium">Create Your First Course</h3>
                    <p className="text-sm text-muted-foreground">
                      Click the "Create Course" button to set up your first course. Add a compelling title, description, and cover image.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-medium">Add Course Content</h3>
                    <p className="text-sm text-muted-foreground">
                      Organize your course into modules and lessons. Upload videos, texts, quizzes, and assignments to create an engaging learning experience.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">4</div>
                  <div>
                    <h3 className="font-medium">Publish and Promote</h3>
                    <p className="text-sm text-muted-foreground">
                      Once your course is ready, publish it and use our promotional tools to reach potential students.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Overview Section
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The dashboard overview shows important metrics including your active courses, student enrollment rates, and completion statistics.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Monitor student enrollments, course completions, and reviews in real-time through the recent activity feed.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Upcoming Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      View and manage your scheduled live sessions. Click "Schedule Session" to create a new live class.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Course Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      See all your courses at a glance with quick stats on student numbers and overall performance.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="courses" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Creating Courses</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">To create a new course:</p>
                    <ol className="list-decimal list-inside space-y-2 mb-2">
                      <li>Click the "Create Course" button in the top right of your dashboard</li>
                      <li>Fill in the course details form with title, description, and category</li>
                      <li>Upload a compelling cover image that represents your course</li>
                      <li>Set the course difficulty level and expected duration</li>
                      <li>Click "Save" to create your course</li>
                    </ol>
                    <p className="text-sm text-muted-foreground">After creating the course shell, you'll be redirected to add content.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>Managing Course Content</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Adding Modules</h4>
                        <p className="text-sm text-muted-foreground">
                          Organize your course into modules (sections) to group related lessons. Click "Add Module" and provide a clear title and description.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Creating Lessons</h4>
                        <p className="text-sm text-muted-foreground">
                          Within each module, add lessons that contain your teaching content. Each lesson can include videos, text, and downloadable resources.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Adding Assessments</h4>
                        <p className="text-sm text-muted-foreground">
                          Create quizzes and assignments to test student knowledge. Set passing scores and determine if they're required for course completion.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>Publishing and Updating</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Review Before Publishing</h4>
                        <p className="text-sm text-muted-foreground">
                          Use the "Preview" feature to see your course as students will see it. Check all content, links, and assessments.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Publishing Process</h4>
                        <p className="text-sm text-muted-foreground">
                          Once ready, click "Publish" to make your course available. You can choose to publish immediately or schedule a future date.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Updating Course Content</h4>
                        <p className="text-sm text-muted-foreground">
                          Keep your course current by regularly updating content. Students will be notified of significant updates.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="students" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <Users className="w-4 h-4 mr-2" />
                    Student Management
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The Students page allows you to view and manage all enrolled students across your courses.
                  </p>
                  
                  <h4 className="text-sm font-medium mb-1">Key Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Course selector dropdown to switch between courses</li>
                    <li>Search functionality to find specific students</li>
                    <li>Progress tracking for each student</li>
                    <li>Filter students by enrollment status</li>
                    <li>Direct communication options</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Using the Course Selector</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the course dropdown at the top of the page to quickly switch between your different courses and view enrolled students for each.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Student Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor each student's progress through the course with the visual progress bar. This shows percentage of course completion.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Contacting Students</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the actions menu to contact students directly via email or in-platform messaging for personalized support.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Course Analytics
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    The Analytics page provides detailed insights about your courses and student engagement.
                  </p>
                  
                  <h4 className="text-sm font-medium mb-1">Key Metrics:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside mb-4">
                    <li>Enrollment rates over time</li>
                    <li>Completion percentages</li>
                    <li>Average engagement time</li>
                    <li>Course ratings and reviews</li>
                    <li>Student demographics</li>
                  </ul>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Use analytics to identify:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Popular lessons and content</li>
                      <li>Drop-off points where students disengage</li>
                      <li>Difficult sections based on quiz performance</li>
                      <li>Opportunities for course improvements</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Interpreting Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      Look for patterns in the data to understand student behavior. High drop-off rates in specific modules may indicate difficult or unclear content that needs revision.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Improving Based on Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the analytics to make data-driven decisions about course improvements. Consider adding more explanations or examples to sections with low completion rates.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Exporting Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Download detailed reports to analyze offline or share with team members. Reports are available in CSV format for easy integration with other tools.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 pt-6 border-t flex items-center justify-between">
            <div className="flex items-center">
              <Video className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm">Need more help? Watch our <a href="#" className="text-primary underline">instructor tutorial videos</a></span>
            </div>
            <CheckSquare className="h-5 w-5 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorGuidelines; 