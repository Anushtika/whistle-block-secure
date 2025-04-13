import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Lock, Shield } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["whistleblower", "investigator"], { required_error: "Please select a role" }),
  anonymous: z.boolean().optional()
});

export default function LoginPage() {
  const [_, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "whistleblower",
      anonymous: false
    }
  });
  
  const isSubmitting = form.formState.isSubmitting;
  
  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      const user = await apiRequest("POST", "/api/auth/login", {
        username: data.username,
        password: data.password,
        role: data.role
      });
      
      const userData = await user.json();
      
      toast({
        title: "Login successful",
        description: `Welcome, ${userData.username}!`,
      });
      
      // Redirect based on role
      if (data.role === "whistleblower") {
        setLocation("/whistleblower/dashboard");
      } else {
        setLocation("/investigator/dashboard");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Whistleblower Protection</h2>
              <p className="mt-2 text-sm text-gray-500">Tamil Nadu Blockchain Initiative</p>
            </div>
            
            <div className="flex justify-center mb-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary-100">
                  <Lock className="h-12 w-12 text-primary-600" />
                </AvatarFallback>
              </Avatar>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I am a:</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="whistleblower">Whistleblower</SelectItem>
                          <SelectItem value="investigator">Investigator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Key</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your secure access key" 
                            {...field} 
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="anonymous"
                      render={({ field }) => (
                        <div className="flex items-center">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="anonymous"
                            />
                          </FormControl>
                          <label
                            htmlFor="anonymous"
                            className="ml-2 block text-sm text-gray-700"
                          >
                            Anonymous Access
                          </label>
                        </div>
                      )}
                    />
                    <div className="text-sm">
                      <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                        Need help?
                      </a>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Anonymous access provides enhanced privacy but limits some functionality.
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : "Secure Login"}
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    First time user? <a href="#" className="font-medium text-primary-600 hover:text-primary-500">Read our guide</a>
                  </p>
                  
                  <div className="mt-6 flex items-center justify-center">
                    <span className="text-xs text-gray-400 flex items-center">
                      <Shield className="h-4 w-4 mr-1 text-green-600" />
                      Secured with Blockchain Technology
                    </span>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
