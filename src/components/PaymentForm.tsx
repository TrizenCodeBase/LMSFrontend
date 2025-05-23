import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseDetails } from "@/services/courseService";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import axios from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

// Define form schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  mobile: z.string()
    .length(10, { message: "Mobile number must be exactly 10 digits" })
    .regex(/^[0-9]+$/, { message: "Mobile number can only contain digits" }),
  transactionId: z.string()
    .min(10, { message: "Transaction ID must be at least 10 characters" })
    .max(30, { message: "Transaction ID can't be longer than 30 characters" })
    .regex(/^[a-zA-Z0-9]+$/, { message: "Transaction ID can only contain letters and numbers" }),
  transactionScreenshot: z.instanceof(FileList).refine(
    (files) => files.length === 1,
    "Please upload a transaction screenshot"
  ),
});

type FormValues = z.infer<typeof formSchema>;

const PaymentForm = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { data: course, isLoading: courseLoading } = useCourseDetails(courseId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
      mobile: "",
      transactionId: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!courseId || !course) return;

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("mobile", data.mobile);
      formData.append("transactionId", data.transactionId);
      formData.append("courseName", course.title);
      formData.append("courseId", courseId);
      formData.append("transactionScreenshot", data.transactionScreenshot[0]);
      
      await axios.post("/api/enrollment-requests", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      toast({
        title: "Enrollment request submitted",
        description: "We will review your payment details and activate your course access soon.",
      });
      
      navigate("/my-courses");
    } catch (error: any) {
      console.error("Error submitting enrollment request:", error);
      const errorMessage = error.response?.data?.message || "There was a problem submitting your enrollment request. Please try again.";
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (courseLoading) {
    return <LoadingSpinner />;
  }

  if (!course) {
    return <div className="text-center py-10">Course not found</div>;
  }

  return (
    <div className="w-full max-w-lg mx-auto p-0">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl">Payment Details</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Complete your enrollment for <span className="font-semibold">{course.title}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6 border p-3 sm:p-4 rounded-md bg-slate-50">
            <h3 className="text-sm sm:text-base font-medium mb-2">Scan QR code to make payment</h3>
            <div className="flex justify-center w-full">
              <img 
                src="/Payment QR Cropped.jpg"
                alt="Payment QR Code" 
                className="w-full max-w-[250px] sm:max-w-[300px]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/placeholder.svg';
                }}
              />
            </div>
            <p className="text-base sm:text-lg text-center font-semibold text-black mt-3">
              Payment details: ₹399
            </p>
            <p className="text-xs sm:text-sm text-center text-muted-foreground mt-1">
              After payment, fill the form below with your payment details
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Email</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={!!user?.email}
                        className="h-9 sm:h-10" 
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Mobile Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter your mobile number" 
                        type="tel"
                        className="h-9 sm:h-10"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Transaction ID</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter transaction ID"
                        className="h-9 sm:h-10"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="transactionScreenshot"
                render={({ field: { onChange, value, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Transaction Screenshot</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...fieldProps}
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            onChange(e.target.files);
                            handleImageChange(e);
                          }}
                          className="h-9 sm:h-10 cursor-pointer
                            file:mr-4 file:py-2 file:px-4 file:ml-0
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-primary file:text-primary-foreground
                            hover:file:bg-primary/90
                            file:cursor-pointer
                            mb-2"
                        />
                      </div>
                    </FormControl>
                    {imagePreview && (
                      <div className="mt-3 border rounded-md overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Transaction Screenshot Preview" 
                          className="max-h-40 w-full object-contain" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    )}
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full h-9 sm:h-10 mt-4"
              >
                {isSubmitting ? (
                  <LoadingSpinner className="w-5 h-5" />
                ) : (
                  "Submit Payment Details"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-xs sm:text-sm text-muted-foreground p-4 sm:p-6">
          <p>• Please ensure all details are correct before submitting</p>
          <p>• Your course access will be activated after payment verification</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentForm;
