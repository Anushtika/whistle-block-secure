import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cryptoService } from "@/lib/crypto";
import { Shield, Paperclip } from "lucide-react";

export default function Messages() {
  const { toast } = useToast();
  const [currentReportId, setCurrentReportId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Get reports with communications enabled
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['/api/reports'],
    select: (data) => data.filter((report) => report.allowCommunication)
  });
  
  // Get messages for the current report
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: [`/api/reports/${currentReportId}/messages`],
    enabled: !!currentReportId,
    onSuccess: (data) => {
      // Mark messages as read
      data.forEach(async (message) => {
        if (!message.isRead && message.senderId !== currentUser?.id) {
          await apiRequest('PATCH', `/api/messages/${message.id}/read`);
        }
      });
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
    }
  });
  
  // Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/auth/me']
  });
  
  // Select a report to view messages
  const selectReport = (reportId: number) => {
    setCurrentReportId(reportId);
  };
  
  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentReportId) return;
    
    try {
      // Generate encryption key
      const encryptionKey = await cryptoService.generateSymmetricKey();
      
      // Encrypt message
      const encryptedContent = await cryptoService.encryptWithSymmetricKey(
        newMessage,
        encryptionKey
      );
      
      // Send message
      await apiRequest('POST', '/api/messages', {
        reportId: currentReportId,
        encryptedContent,
        encryptionKey
      });
      
      // Reset form
      setNewMessage("");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${currentReportId}/messages`] });
      
      toast({
        title: "Message sent",
        description: "Your message has been encrypted and sent securely",
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };
  
  // Format message time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + 
           date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Secure Messages</h1>
        <p className="mt-1 text-sm text-gray-500">End-to-end encrypted communication with investigators.</p>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
        <Card>
          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="messages" className="space-y-4">
              <div className="flex h-[600px]">
                {/* Report list */}
                <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                  <div className="p-4">
                    <h2 className="text-lg font-medium text-gray-900">Reports</h2>
                  </div>
                  <Separator />
                  
                  {isLoadingReports ? (
                    <div className="p-4 space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : reports && reports.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {reports.map((report) => (
                        <li 
                          key={report.id}
                          className={`cursor-pointer hover:bg-gray-50 ${currentReportId === report.id ? 'bg-primary-50' : ''}`}
                          onClick={() => selectReport(report.id)}
                        >
                          <div className="px-4 py-3">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                #{report.reportId}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(report.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 truncate">
                              {report.subject}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-gray-500">No reports with communications enabled</p>
                    </div>
                  )}
                </div>
                
                {/* Message content */}
                <div className="w-2/3 flex flex-col">
                  {currentReportId ? (
                    <>
                      <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                          Report #{reports?.find(r => r.id === currentReportId)?.reportId}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {reports?.find(r => r.id === currentReportId)?.subject}
                        </p>
                      </div>
                      
                      <div className="flex-1 p-4 overflow-y-auto">
                        {isLoadingMessages ? (
                          <div className="space-y-4">
                            <Skeleton className="h-16 w-3/4" />
                            <Skeleton className="h-16 w-3/4 ml-auto" />
                            <Skeleton className="h-16 w-3/4" />
                          </div>
                        ) : messages && messages.length > 0 ? (
                          <div className="space-y-6">
                            {messages.map((message) => {
                              const isCurrentUser = message.senderId === currentUser?.id;
                              return (
                                <div key={message.id} className={`flex ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                  <div className={`flex-shrink-0 ${isCurrentUser ? 'ml-3' : 'mr-3'}`}>
                                    <Avatar>
                                      <AvatarFallback className={isCurrentUser ? 'bg-primary-100' : 'bg-secondary-100'}>
                                        <span className={isCurrentUser ? 'text-primary-700' : 'text-secondary-700'}>
                                          {isCurrentUser ? 'W' : 'I'}
                                        </span>
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className={`flex-1 ${isCurrentUser ? 'bg-primary-50 text-primary-900' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2 sm:px-6 sm:py-4 leading-relaxed`}>
                                    <div className="flex justify-between items-center mb-1">
                                      <strong>{isCurrentUser ? 'You (Anonymous)' : 'Investigator'}</strong>
                                      <span className="text-xs text-gray-500">{formatMessageTime(message.sentAt)}</span>
                                    </div>
                                    <p className="text-sm">
                                      {message.encryptedContent}
                                    </p>
                                    <div className="mt-2 flex items-center">
                                      <Shield className="h-4 w-4 text-green-500 mr-1" />
                                      <span className="text-xs text-green-700">End-to-end encrypted</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-gray-500">No messages yet</p>
                            <p className="text-gray-500 text-sm mt-1">Start the conversation by sending a message</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 border-t border-gray-200">
                        <div className="flex items-start space-x-4">
                          <div className="min-w-0 flex-1">
                            <div className="relative">
                              <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                                <textarea
                                  rows={3}
                                  className="block w-full py-3 border-0 resize-none focus:ring-0 sm:text-sm"
                                  placeholder="Add your message..."
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                />
                              </div>
                              
                              <div className="absolute bottom-0 inset-x-0 pl-3 pr-2 py-2 flex justify-between">
                                <div className="flex items-center space-x-5">
                                  <div className="flex items-center">
                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-600">
                                      <Paperclip className="h-5 w-5" />
                                      <span className="sr-only">Attach a file</span>
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()}>
                                    Send
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-gray-500">Select a report to view messages</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reports">
              <CardContent>
                <div className="p-4">
                  <h2 className="text-lg font-medium text-gray-900">Reports with Communication Enabled</h2>
                  
                  {isLoadingReports ? (
                    <div className="mt-4 space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : reports && reports.length > 0 ? (
                    <ul className="mt-4 divide-y divide-gray-200">
                      {reports.map((report) => (
                        <li key={report.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">#{report.reportId}</h3>
                              <p className="mt-1 text-sm text-gray-500">{report.subject}</p>
                              <p className="mt-1 text-xs text-gray-400">
                                Submitted on {new Date(report.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => selectReport(report.id)}
                            >
                              View Messages
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-4 text-center p-6 bg-gray-50 rounded-md">
                      <p className="text-gray-500">No reports with communications enabled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
