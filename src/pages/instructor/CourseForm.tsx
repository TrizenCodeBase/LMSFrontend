import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  ArrowRight,
  X
} from 'lucide-react';
import { 
  useCreateCourse, 
  useUpdateCourse, 
  useCourseDetails, 
  Course, 
  RoadmapDay,
  MCQQuestion
} from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import MCQForm from '@/components/MCQForm';
import { DayCodeEditor } from '@/components/instructor/DayCodeEditor';
import axios from '@/lib/axios';
import { Progress } from '@/components/ui/progress';

// Define our own type for axios progress event
interface UploadProgressEvent {
  loaded: number;
  total?: number;
}

interface UploadDetails {
  fileName: string;
  totalSize: string;
  isChunked: boolean;
  chunks: {
    number: number;
    size: string;
    status: string;
  }[];
  totalChunks?: number;
  status: string;
}

interface UploadProgress {
  progress: number;
  uploaded: number;
  total: number;
}

const convertGoogleDriveLink = (url: string): string => {
  try {
    if (!url) return url;

    // Check if it's a Google Drive URL
    if (url.includes('drive.google.com')) {
      let fileId = '';

      // Format: https://drive.google.com/file/d/FILE_ID/view
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0];
      }
      // Format: https://drive.google.com/open?id=FILE_ID
      else if (url.includes('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
      }

      if (fileId) {
        return `https://images.weserv.nl/?url=https://drive.google.com/uc?export=view%26id=${fileId}`;
      }
    }

    // If it's already a direct image URL, return as is
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return url;
    }

    return url;
  } catch (error) {
    return url;
  }
};

interface CourseFormData {
  title: string;
  description: string;
  longDescription: string;
  duration: string;
  level: string;
  category: string;
  image: string;
  courseAccess: boolean;
  skills: string[];
  roadmap: RoadmapDay[];
  instructor: string;
}

interface MCQFormProps {
  mcqs: MCQQuestion[];
  onChange: (mcqs: MCQQuestion[]) => void;
  dayNumber: number;
  className: string;
}

const CourseForm = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const isEditMode = !!courseId;
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [skill, setSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingVideoIndex, setUploadingVideoIndex] = useState<number | null>(null);
  const [currentUpload, setCurrentUpload] = useState<{
    fileName: string;
    totalSize: number;
    uploadedSize: number;
    progress: number;
  } | null>(null);
  const [uploadDetails, setUploadDetails] = useState<UploadDetails | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [serverProgressLogs, setServerProgressLogs] = useState<string[]>([]);

  const { data: existingCourse, isLoading: isLoadingCourse } = useCourseDetails(courseId);
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();

  const [courseData, setCourseData] = useState<CourseFormData>({
    title: '',
    description: '',
    longDescription: '',
    duration: '',
    level: 'Beginner',
    category: '',
    image: '',
    courseAccess: true,
    skills: [],
    roadmap: [{
      day: 1,
      topics: '',
      video: '',
      transcript: '',
      notes: '',
      mcqs: [],
      code: ''
    }],
    instructor: user?.name || ''
  });

  // Load existing course data if in edit mode
  useEffect(() => {
    if (isEditMode && existingCourse) {
      setCourseData({
        title: existingCourse.title || '',
        description: existingCourse.description || '',
        longDescription: existingCourse.longDescription || '',
        duration: existingCourse.duration || '',
        level: existingCourse.level || 'Beginner',
        category: existingCourse.category || '',
        image: existingCourse.image || '',
        courseAccess: Boolean(existingCourse.courseAccess),
        skills: existingCourse.skills || [],
        roadmap: existingCourse.roadmap || [{
          day: 1,
          topics: '',
          video: '',
          transcript: '',
          notes: '',
          mcqs: [],
          code: ''
        }],
        instructor: existingCourse.instructor || user?.name || ''
      });
    }
  }, [existingCourse, isEditMode, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!courseData.title.trim()) throw new Error("Course title is required");
      if (!courseData.description.trim()) throw new Error("Course description is required");
      if (!courseData.image.trim()) throw new Error("Course image URL is required");
      if (!courseData.duration.trim()) throw new Error("Course duration is required");
      if (!courseData.category) throw new Error("Course category is required");
      if (!courseData.instructor.trim()) throw new Error("Instructor name is required");

      // Validate roadmap data
      const validatedRoadmap = courseData.roadmap.map((day, index) => {
        if (!day.topics.trim()) {
          throw new Error(`Topics are required for Day ${index + 1}`);
        }
        if (!day.video.trim()) {
          throw new Error(`Video link is required for Day ${index + 1}`);
        }
        
        return {
          day: index + 1,
          topics: day.topics.trim(),
          video: day.video.trim(),
          transcript: day.transcript?.trim() || '',
          notes: day.notes?.trim() || '',
          mcqs: (day.mcqs || []).map(mcq => ({
            ...mcq,
            question: mcq.question.trim(),
            options: mcq.options.map(opt => ({
              ...opt,
              text: opt.text.trim()
            }))
          })),
          code: day.code || '',
          language: day.language || 'javascript'
        } as RoadmapDay;
      });

      // Format data for API
      const formattedCourseData: Partial<Course> = {
        title: courseData.title.trim(),
        description: courseData.description.trim(),
        longDescription: courseData.longDescription?.trim(),
        duration: courseData.duration.trim(),
        level: courseData.level as "Beginner" | "Intermediate" | "Advanced",
        category: courseData.category,
        image: courseData.image.trim(),
        courseAccess: courseData.courseAccess,
        skills: courseData.skills,
        roadmap: validatedRoadmap,
        instructor: courseData.instructor.trim()
      };

      if (isEditMode && courseId) {
        await updateCourseMutation.mutateAsync({
          courseId,
          courseData: formattedCourseData
        });
        toast({
          title: "Success",
          description: "Course updated successfully",
        });
      } else {
        await createCourseMutation.mutateAsync(formattedCourseData);
        toast({
          title: "Success",
          description: "Course created successfully",
        });
      }
      navigate('/instructor/courses');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save course';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Course form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = () => {
    if (skill.trim() && !courseData.skills.includes(skill.trim())) {
      setCourseData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
      setSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setCourseData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const addRoadmapDay = () => {
    const nextDay = courseData.roadmap.length + 1;
    setCourseData(prev => ({
      ...prev,
      roadmap: [
        ...prev.roadmap,
        {
          day: nextDay,
          topics: '',
          video: '',
          transcript: '',
          notes: '',
          mcqs: [],
          code: ''
        }
      ]
    }));

    // Wait for the DOM to update before scrolling
    setTimeout(() => {
      const newDayElement = document.getElementById(`day-${nextDay}`);
      if (newDayElement) {
        newDayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const updateRoadmapDay = (index: number, field: keyof RoadmapDay, value: any) => {
    setCourseData(prev => {
      const updatedRoadmap = [...prev.roadmap];
      updatedRoadmap[index] = {
        ...updatedRoadmap[index],
        [field]: value
      };
      return {
        ...prev,
        roadmap: updatedRoadmap
      };
    });
  };

  const removeRoadmapDay = (index: number) => {
    setCourseData(prev => {
      const updatedRoadmap = prev.roadmap.filter((_, i) => i !== index)
        .map((day, i) => ({ ...day, day: i + 1 }));
      return {
        ...prev,
        roadmap: updatedRoadmap
      };
    });
  };

  const handleLevelChange = (value: string) => {
    const validLevel = value as "Beginner" | "Intermediate" | "Advanced";
    setCourseData(prev => ({ ...prev, level: validLevel }));
  };

  const handleNextTab = () => {
    switch (activeTab) {
      case 'basic':
        setActiveTab('details');
        break;
      case 'details':
        setActiveTab('roadmap');
        break;
      case 'roadmap':
        setActiveTab('media');
        break;
    }
  };

  const handleMcqsUpdate = (dayIndex: number, mcqs: MCQQuestion[]) => {
    // Validate MCQs before updating
    mcqs.forEach((mcq, index) => {
      // Ensure question is not empty
      if (!mcq.question) {
        mcq.question = "";
      }
      
      // Ensure options array exists
      if (!mcq.options || !Array.isArray(mcq.options)) {
        mcq.options = [];
      }
      
      // Ensure each option has text and isCorrect properties
      mcq.options = mcq.options.map(option => ({
        text: option.text || "",
        isCorrect: Boolean(option.isCorrect)
      }));
    });
    
    updateRoadmapDay(dayIndex, 'mcqs', mcqs);
  };

  const handleCodeSave = async (dayIndex: number, newCode: string) => {
    try {
      const updatedRoadmap = [...courseData.roadmap];
      updatedRoadmap[dayIndex] = {
        ...updatedRoadmap[dayIndex],
        code: newCode
      };
      setCourseData(prev => ({
        ...prev,
        roadmap: updatedRoadmap
      }));

      toast({
        title: 'Success',
        description: `Code for Day ${dayIndex + 1} saved successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save code',
        variant: 'destructive',
      });
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      toast({
        title: 'Upload Cancelled',
        description: 'Video upload has been cancelled',
      });
      setUploadingVideoIndex(null);
      setCurrentUpload(null);
      abortControllerRef.current = null;
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    // Reset server progress logs
    setServerProgressLogs([]);

    setUploadingVideoIndex(index);
    setCurrentUpload({
      fileName: file.name,
      totalSize: file.size,
      uploadedSize: 0,
      progress: 0
    });

    let lastLoggedPercent = 0;

    try {
      const formData = new FormData();
      formData.append('video', file);
        
      const response = await axios.post<{ url: string }>('/api/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent: UploadProgressEvent) => {
          if (progressEvent.total) {
            const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100);
            setCurrentUpload({
              fileName: file.name,
              totalSize: file.size,
              uploadedSize: progressEvent.loaded,
              progress: percent
            });

            // Simulate server-side logs - similar to the pattern in server.js
            if (percent >= lastLoggedPercent + 10 || percent === 100) {
              lastLoggedPercent = percent;
              const logMessage = `Upload progress: ${percent}%`;
              setServerProgressLogs(prev => [...prev, logMessage]);
            }
          }
        }
      } as any);

      if (response.data.url) {
        updateRoadmapDay(index, 'video', response.data.url);
      }

      toast({
        title: 'Success',
        description: 'Video uploaded successfully',
      });
    } catch (error) {
      // Check if the request was cancelled
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Upload cancelled by user');
        setServerProgressLogs(prev => [...prev, 'Upload cancelled by user']);
      } else {
        console.error('Video upload failed:', error);
        setServerProgressLogs(prev => [...prev, 'Upload failed: ' + (error?.message || 'Unknown error')]);
        toast({
          title: 'Upload Failed',
          description: 'Unable to upload video. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setUploadingVideoIndex(null);
      setCurrentUpload(null);
      abortControllerRef.current = null;
    }
  };

  const renderUploadProgress = () => {
    if (!currentUpload) return null;

    return (
      <div className="mt-4 space-y-2 p-4 border rounded-md bg-muted">
        <div className="flex justify-between items-center">
          <span className="font-medium">Uploading: {currentUpload.fileName}</span>
          <span className="text-sm text-muted-foreground">
            {Math.round(currentUpload.progress)}%
          </span>
        </div>
        
        <Progress value={currentUpload.progress} className="h-2" />
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {(currentUpload.uploadedSize / (1024 * 1024)).toFixed(2)}MB / 
            {(currentUpload.totalSize / (1024 * 1024)).toFixed(2)}MB
          </p>
          
          {/* <Button 
            variant="destructive" 
            size="sm" 
            onClick={cancelUpload}
            className="h-8 px-3"
          >
            <X className="w-4 h-4 mr-1" />
            Stop Upload
          </Button> */}
        </div>

        {/* Server-side progress logs */}
        {serverProgressLogs.length > 0 && (
          <div className="mt-2 p-2 bg-black/10 rounded-md">
            <p className="text-xs font-semibold mb-1">Server Logs:</p>
            <div className="font-mono text-xs max-h-24 overflow-y-auto space-y-1">
              {serverProgressLogs.map((log, index) => (
                <div key={index} className="text-muted-foreground">
                  <span className="text-primary">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoadingCourse && isEditMode) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p>Loading course data...</p>
      </div>
    );
  }

  return (
    <div className="p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/instructor/courses')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Courses</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold">{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-16">
            <TabsTrigger value="basic" className="text-sm sm:text-base">
              <span className="hidden sm:inline">Basic Information</span>
              <span className="sm:hidden">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="text-sm sm:text-base">
              <span className="hidden sm:inline">Course Details</span>
              <span className="sm:hidden">Details</span>
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="text-sm sm:text-base">
              <span className="hidden sm:inline">Course Roadmap</span>
              <span className="sm:hidden">Roadmap</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="text-sm sm:text-base">
              <span className="hidden sm:inline">Media & Resources</span>
              <span className="sm:hidden">Media</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={courseData.title}
                    onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description *</Label>
                  <Textarea
                    id="description"
                    value={courseData.description}
                    onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description (displayed in course cards)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longDescription">Full Description</Label>
                  <Textarea
                    id="longDescription"
                    value={courseData.longDescription}
                    onChange={(e) => setCourseData(prev => ({ ...prev, longDescription: e.target.value }))}
                    placeholder="Detailed course description"
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor Name *</Label>
                    <Input
                      id="instructor"
                      value={courseData.instructor}
                      onChange={(e) => setCourseData(prev => ({ ...prev, instructor: e.target.value }))}
                      placeholder="Enter instructor name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      value={courseData.duration}
                      onChange={(e) => setCourseData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g. 30 Days, 8 Weeks"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={courseData.category}
                      onValueChange={(value) => setCourseData(prev => ({ ...prev, category: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Web Development">Web Development</SelectItem>
                        <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                        <SelectItem value="Data Science">Data Science</SelectItem>
                        <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                        <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                        <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                        <SelectItem value="Blockchain">Blockchain</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level *</Label>
                    <Select
                      value={courseData.level}
                      onValueChange={handleLevelChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="courseAccess"
                    checked={courseData.courseAccess}
                    onCheckedChange={(checked) => 
                      setCourseData(prev => ({ ...prev, courseAccess: checked === true }))
                    }
                  />
                  <Label htmlFor="courseAccess">Make course available immediately after creation</Label>
                </div>
              </CardContent>
              <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-2 p-4 sm:p-6 pt-0">
                <Button type="button" onClick={handleNextTab} className="w-full sm:w-auto">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Course Skills & Requirements</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-4">
                  <Label>Skills Students Will Learn</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      placeholder="Add a skill"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {courseData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeSkill(skill)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {courseData.skills.length === 0 && (
                      <span className="text-sm text-muted-foreground">No skills added yet</span>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-2 p-4 sm:p-6 pt-0">
                <Button type="button" onClick={handleNextTab} className="w-full sm:w-auto">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="roadmap">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-4 sm:p-6">
                <div className="space-y-1">
                  <CardTitle className="text-lg sm:text-xl">Course Roadmap</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add and manage the daily content for your course.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={addRoadmapDay} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Day
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {courseData.roadmap.map((day, index) => (
                  <div key={index} className="space-y-4 pb-4 border-b" id={`day-${day.day}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Day {day.day}</h3>
                      {courseData.roadmap.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeRoadmapDay(index)}
                          className="h-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`topics-${index}`}>Topics *</Label>
                      <Textarea
                        id={`topics-${index}`}
                        value={day.topics}
                        onChange={(e) => updateRoadmapDay(index, 'topics', e.target.value)}
                        placeholder="Topics covered on this day"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Video Upload *</Label>
                      <div>
                        <input
                          id={`video-${index}`}
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoUpload(e, index)}
                          disabled={uploadingVideoIndex === index}
                          className="hidden"
                        />
                        <label
                          htmlFor={`video-${index}`}
                          className={`inline-flex items-center px-4 py-2 border rounded-md ${
                            uploadingVideoIndex === index ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingVideoIndex === index ? 'Uploading...' : day.video ? 'Change Video' : 'Upload Video'}
                        </label>
                        {uploadingVideoIndex === index && <Loader2 className="animate-spin inline-block ml-2" />}
                      </div>

                      {uploadingVideoIndex === index && renderUploadProgress()}

                      {day.video && (
                        <video
                          src={day.video}
                          controls
                          className="w-full max-w-md h-48 object-cover rounded-md"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        Supported formats: MP4, WebM, etc.
                        {currentUpload && " Large files will be automatically split into chunks."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`transcript-${index}`}>Transcript (Optional)</Label>
                      <Textarea
                        id={`transcript-${index}`}
                        value={day.transcript || ''}
                        onChange={(e) => updateRoadmapDay(index, 'transcript', e.target.value)}
                        placeholder="Video transcript or additional notes"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`notes-${index}`}>Notes (Optional)</Label>
                      <Textarea
                        id={`notes-${index}`}
                        value={day.notes || ''}
                        onChange={(e) => updateRoadmapDay(index, 'notes', e.target.value)}
                        placeholder="Additional notes, resources, or instructions for this day"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Add any supplementary notes, resources, or special instructions for this day's content
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Code Content</Label>
                      <DayCodeEditor
                        dayNumber={day.day}
                        code={day.code || ''}
                        onSave={(newCode) => handleCodeSave(index, newCode)}
                      />
                    </div>
                    
                    <div className="mt-6">
                      <MCQForm 
                        mcqs={day.mcqs || []}
                        onChange={(mcqs) => handleMcqsUpdate(index, mcqs)}
                        dayNumber={day.day}
                      />
                    </div>
                  </div>
                ))}
                
                {courseData.roadmap.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No days added yet. Click the "Add Day" button to start building your course roadmap.</p>
                  </div>
                )}
              </CardContent>
              <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-2 p-4 sm:p-6 pt-0">
                <Button type="button" onClick={handleNextTab} className="w-full sm:w-auto">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="media">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Media & Resources</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Course Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={courseData.image}
                    onChange={(e) => {
                      const inputUrl = e.target.value.trim();
                      const convertedUrl = convertGoogleDriveLink(inputUrl);
                      setCourseData(prev => ({ ...prev, image: convertedUrl }));
                    }}
                    placeholder="Enter image URL (Google Drive or direct link)"
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      For Google Drive images:
                    </p>
                    <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                      <li>Upload image to Google Drive</li>
                      <li>Right-click the image → Share</li>
                      <li>Set access to "Anyone with the link"</li>
                      <li>Copy link and paste here</li>
                    </ol>
                    
                  </div>
                  {courseData.image && (
                    <div className="mt-2">
                      <div className="relative">
                        <img 
                          src={courseData.image} 
                          alt="Course thumbnail preview" 
                          className="w-full max-w-md h-48 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" preserveAspectRatio="none"%3E%3Crect width="300" height="200" fill="%23CCCCCC"%3E%3C/rect%3E%3Ctext x="150" y="100" fill="%23333333" font-size="14" font-family="Arial" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
                            toast({
                              title: "Image Error",
                              description: "Unable to load image. For best results, please use ImgBB to host your image.",
                              variant: "destructive",
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 sm:gap-2 p-4 sm:p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/instructor/courses')}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Update Course' : 'Create Course'}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default CourseForm;

