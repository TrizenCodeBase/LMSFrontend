import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Trophy, Target } from "lucide-react";

const Grades = () => {
  const { user } = useAuth();

  const gradesData = {
    overallGrade: 92,
    courseGrades: [
      {
        id: 1,
        courseName: "React Development",
        grade: 95,
        progress: 80,
        assignments: [
          { name: "React Hooks", score: 98, total: 100 },
          { name: "State Management", score: 92, total: 100 },
          { name: "Final Project", score: 95, total: 100 }
        ]
      },
      {
        id: 2,
        courseName: "TypeScript Fundamentals",
        grade: 88,
        progress: 60,
        assignments: [
          { name: "Basic Types", score: 90, total: 100 },
          { name: "Interfaces", score: 85, total: 100 },
          { name: "Generics", score: 89, total: 100 }
        ]
      },
      {
        id: 3,
        courseName: "Next.js Mastery",
        grade: 93,
        progress: 75,
        assignments: [
          { name: "Routing", score: 95, total: 100 },
          { name: "API Routes", score: 92, total: 100 },
          { name: "SSR vs SSG", score: 92, total: 100 }
        ]
      }
    ]
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-500";
    if (grade >= 80) return "text-blue-500";
    if (grade >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <DashboardLayout>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Grade Overview</h1>
              <p className="text-muted-foreground">
                Track your academic performance
              </p>
            </div>
          </div>

          {/* Overall Grade Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">Overall Grade</h2>
                  <p className="text-muted-foreground">Across all courses</p>
                </div>
                <div className={`text-4xl font-bold ${getGradeColor(gradesData.overallGrade)}`}>
                  {gradesData.overallGrade}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Grades */}
          <div className="space-y-6">
            {gradesData.courseGrades.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{course.courseName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getGradeColor(course.grade)}>
                            Grade: {course.grade}%
                          </Badge>
                          <Badge variant="outline">
                            Progress: {course.progress}%
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Progress value={course.progress} className="h-2" />

                    <div className="space-y-3">
                      {course.assignments.map((assignment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">{assignment.name}</span>
                          <span className={`font-semibold ${getGradeColor(
                            (assignment.score / assignment.total) * 100
                          )}`}>
                            {assignment.score}/{assignment.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Grades;