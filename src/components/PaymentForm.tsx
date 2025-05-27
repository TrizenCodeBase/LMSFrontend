import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseDetails } from "@/services/courseService";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import axios from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  mobile: z
    .string()
    .length(10, { message: "Mobile number must be exactly 10 digits" })
    .regex(/^[0-9]+$/, {
      message: "Mobile number can only contain digits",
    }),
  transactionId: z
    .string()
    .min(10, { message: "Transaction ID must be at least 10 characters" })
    .max(30, { message: "Transaction ID can't be longer than 30 characters" })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Transaction ID can only contain letters and numbers",
    }),
  transactionScreenshot: z
    .instanceof(FileList)
    .refine((files) => files.length === 1, "Please upload a transaction screenshot"),
  referralBy: z.enum(["Dinesh Karthik", "Adarsh", "Nukaraju Neradabilli"], {
    required_error: "Please select who referred you",
  }),
  joinedGroup: z.boolean().refine((value) => value === true, {
    message: "You must join the WhatsApp group to continue",
  }),
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
      referralBy: undefined,
      joinedGroup: false,
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
      formData.append("referralBy", data.referralBy);
      formData.append("transactionScreenshot", data.transactionScreenshot[0]);
      formData.append("joinedGroup", String(data.joinedGroup));

      await axios.post("/api/enrollment-requests", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Success! 🎉",
        description: "Your enrollment request has been submitted. We'll activate your course access soon.",
        variant: "default",
      });

      navigate("/my-courses");
    } catch (error: any) {
      console.error("Error submitting enrollment request:", error);
      const errorMessage =
        error.response?.data?.message ||
        "There was a problem submitting your enrollment request. Please try again.";
      toast({
        title: "Oops! Something went wrong",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-lg font-medium text-gray-600">
        Course not found
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto p-4"
    >
      <Card className="shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-2 p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Payment Details
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Complete your enrollment for{" "}
            <span className="font-semibold text-primary">{course.title}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your email" className="h-10 sm:h-11" />
                        </FormControl>
                        <FormMessage />
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
                          <Input {...field} placeholder="Enter your mobile number" type="tel" className="h-10 sm:h-11" />
                        </FormControl>
                        <FormMessage />
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
                          <Input {...field} placeholder="Enter transaction ID" className="h-10 sm:h-11" />
                        </FormControl>
                        <FormMessage />
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
                              className="h-10 sm:h-11 cursor-pointer file:mr-4 file:py-2 file:px-4 file:ml-0 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                            />
                          </div>
                        </FormControl>
                        {imagePreview && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-4 border-2 rounded-lg overflow-hidden bg-white p-2"
                          >
                            <img src={imagePreview} alt="Transaction Screenshot Preview" className="max-h-48 w-full object-contain rounded" />
                          </motion.div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referralBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Referral By</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 sm:h-11">
                              <SelectValue placeholder="Select who referred you" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dinesh Karthik">Dinesh Karthik</SelectItem>
                            <SelectItem value="Adarsh">Adarsh</SelectItem>
                            <SelectItem value="Nukaraju Neradabilli">Nukaraju Neradabilli</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="joinedGroup"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              form.trigger("joinedGroup");
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm sm:text-base">
                            I confirm that I have joined the <a href="https://chat.whatsapp.com/BTZ6BaHzcpC5QsexZw4Mqc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">30 days web development boot camp (click to join)</a> for course updates, doubts and support
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !form.watch("joinedGroup")} 
                    className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold mt-6 transition-all duration-200 hover:scale-[1.02]"
                  >
                    {isSubmitting ? <LoadingSpinner className="w-5 sm:w-6 h-5 sm:h-6" /> : "Submit Payment Details"}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="flex-1 border-2 border-dashed p-4 sm:p-6 rounded-lg bg-slate-50/50 backdrop-blur mt-8 lg:mt-0">
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-center">Scan QR Code to Pay</h3>
              <div className="flex justify-center w-full">
                <motion.img
                  whileHover={{ scale: 1.02 }}
                  src="/Payment QR Cropped.jpg"
                  alt="Payment QR Code"
                  className="w-full max-w-[250px] sm:max-w-[300px] rounded-lg shadow-md transition-transform duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
              <p className="text-xl sm:text-2xl text-center font-bold text-primary mt-4">
                ₹399
              </p>
              <p className="text-xs sm:text-sm text-center text-muted-foreground mt-2">
                Please fill the form after completing your payment
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex flex-col items-center">
                  <p className="text-sm sm:text-base font-medium text-gray-700 mb-3 text-center">
                    Join our 30 days web development boot camp group
                  </p>
                  <a
                    href="https://chat.whatsapp.com/BTZ6BaHzcpC5QsexZw4Mqc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.4 3.6C18.2 1.4 15.2 0 12 0 5.4 0 0 5.4 0 12c0 2.1.5 4.2 1.4 6L0 24l6.2-1.4c1.8.9 3.8 1.4 5.8 1.4 6.6 0 12-5.4 12-12 0-3.2-1.4-6.2-3.6-8.4zM12 22c-1.8 0-3.6-.5-5.2-1.4l-.4-.2-3.8.8.8-3.8-.2-.4C2.5 15.6 2 13.8 2 12 2 6.5 6.5 2 12 2c2.6 0 5 1 6.8 2.8C20.6 6.6 21.6 9 21.6 12c0 5.5-4.5 10-9.6 10zm5.2-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6 0-.3-.2-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.6 0-.2-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5-.2 0-.4 0-.6 0-.2 0-.5.2-.8.5C6.9 8.2 6.2 9.7 6.2 11.2c0 1.5 1.1 3 1.2 3.2.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/>
                    </svg>
                    <span className="font-medium">Join WhatsApp Group</span>
                  </a>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
                    Get course updates, support & clear your doubts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 text-xs sm:text-sm p-4 sm:p-6 bg-slate-50/50">
          <p className="flex items-center gap-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Please verify all details before submitting
          </p>
          <p className="flex items-center gap-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Course access will be activated after payment verification
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PaymentForm;
