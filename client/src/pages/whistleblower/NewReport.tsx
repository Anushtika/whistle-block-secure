import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cryptoService } from "@/lib/crypto";
import { ipfsService } from "@/lib/ipfs";
import { Info, Upload, Shield } from "lucide-react";

const reportSchema = z.object({
  type: z.string().min(1, { message: "Report type is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  isAnonymous: z.boolean().default(true),
  allowCommunication: z.boolean().default(false),
});

export default function NewReport() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: "",
      department: "",
      location: "",
      subject: "",
      description: "",
      isAnonymous: true,
      allowCommunication: false,
    },
  });
  
  // Submit report mutation
  const submitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reportSchema>) => {
      // Generate encryption key for the report
      const encryptionKey = await cryptoService.generateSymmetricKey();
      
      // Create encrypted report
      const encryptedDescription = await cryptoService.encryptWithSymmetricKey(
        data.description,
        encryptionKey
      );
      
      // Submit report
      const response = await apiRequest("POST", "/api/reports", {
        ...data,
        description: encryptedDescription,
        encryptionKey,
      });
      
      const report = await response.json();
      
      // Upload attachments if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          // Upload to IPFS
          const ipfsHash = await ipfsService.uploadFile(file, encryptionKey);
          
          // Register attachment
          await apiRequest("POST", "/api/attachments", {
            reportId: report.id,
            fileName: file.name,
            fileType: file.type,
            ipfsHash,
            encryptedKey: encryptionKey,
          });
        }
      }
      
      return report;
    },
    onSuccess: () => {
      // Invalidate reports query
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      toast({
        title: "Report submitted successfully",
        description: "Your report has been encrypted and stored on the blockchain",
      });
      
      // Redirect to my reports
      setLocation("/whistleblower/my-reports");
    },
    onError: (error) => {
      toast({
        title: "Error submitting report",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof reportSchema>) => {
    submitMutation.mutate(data);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setSelectedFiles(fileArray);
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Submit New Report</h1>
        <p className="mt-1 text-sm text-gray-500">
          All information is encrypted and stored securely on the blockchain.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
        <Card>
          <CardContent className="p-6">
            <div className="border-b border-gray-200 pb-3 mb-5">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-secondary-500 mr-2" />
                <span className="text-sm text-gray-700">
                  Your identity is protected. All reports are encrypted and anonymous by default.
                </span>
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="corruption">Corruption</SelectItem>
                          <SelectItem value="fraud">Fraud</SelectItem>
                          <SelectItem value="misappropriation">Misappropriation of Funds</SelectItem>
                          <SelectItem value="ethical">Ethical Violation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department/Organization</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Government department or organization name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City, district or specific location"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of the issue"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed account of the incident or issue"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include relevant dates, names, locations, and any other specific details that may help in the investigation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Evidence Upload</FormLabel>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Documents, images, or audio up to 10MB per file
                      </p>
                      {selectedFiles.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">{selectedFiles.length} files selected</p>
                          <ul className="mt-1 text-xs text-gray-500">
                            {selectedFiles.map((file, i) => (
                              <li key={i}>{file.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex items-center justify-center text-xs text-gray-500 mt-2">
                        <Shield className="h-4 w-4 text-green-500 mr-1" />
                        All files are encrypted before storage
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <FormField
                    control={form.control}
                    name="isAnonymous"
                    render={({ field }) => (
                      <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <div className="ml-3 text-sm">
                          <FormLabel className="font-medium text-gray-700">Submit Anonymously</FormLabel>
                          <FormDescription className="text-gray-500">
                            Your identity will be completely hidden from investigators. This is the default and recommended option.
                          </FormDescription>
                        </div>
                      </div>
                    )}
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <FormField
                    control={form.control}
                    name="allowCommunication"
                    render={({ field }) => (
                      <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <div className="ml-3 text-sm">
                          <FormLabel className="font-medium text-gray-700">Allow Secure Communications</FormLabel>
                          <FormDescription className="text-gray-500">
                            Investigators may need to contact you for additional information. All communication is encrypted.
                          </FormDescription>
                        </div>
                      </div>
                    )}
                  />
                </div>
                
                <Alert className="bg-secondary-50 border-secondary-200">
                  <Shield className="h-4 w-4 text-secondary-500" />
                  <AlertTitle className="text-secondary-800">Blockchain Security</AlertTitle>
                  <AlertDescription className="text-secondary-700">
                    Your report will be securely stored on a blockchain with end-to-end encryption. 
                    Once submitted, you'll receive a unique tracking code to monitor its status.
                  </AlertDescription>
                </Alert>
                
                <div className="mt-8 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-3"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
