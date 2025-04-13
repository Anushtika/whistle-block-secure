import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Shield, 
  User, 
  CheckCircle, 
  MessageSquare, 
  Paperclip,
  Download,
  AlertCircle,
  Link as LinkIcon,
  X,
  ArrowLeft,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cryptoService } from "@/lib/crypto";
import { blockchainService } from "@/lib/web3";
import { ipfsService } from "@/lib/ipfs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ReportDetailProps {
  id: string;
}

export default function ReportDetail({ id }: ReportDetailProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [confirmStatus, setConfirmStatus] = useState("");
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  
  // Get report details
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: [`/api/reports/${id}`]
  });
  
  // Get report attachments
  const { data: attachments, isLoading: isLoadingAttachments } = useQuery({
    queryKey: [`/api/reports/${id}/attachments`],
    enabled: !!report
  });
  
  // Get blockchain events
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: [`/api/reports/${id}/events`],
    enabled: !!report
  });
  
  // Get messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: [`/api/reports/${id}/messages`],
    enabled: !!report && report.allowCommunication,
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
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me']
  });
  
  // Verify report on blockchain
  useEffect(() => {
    if (report && report.blockchainHash) {
      const verifyReport = async () => {
        try {
          // In a real implementation, this would verify the hash on the blockchain
          const isValid = await blockchainService.verifyReportHash(report.reportId, report.blockchainHash);
          if (!isValid) {
            toast({
              title: "Blockchain verification failed",
              description: "The report may have been tampered with",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Blockchain verification error:", error);
        }
      };
      
      verifyReport();
    }
  }, [report, toast]);
  
  // Update report status
  const updateReportStatus = async () => {
    if (!confirmStatus || !report) return;
    
    setIsStatusUpdating(true);
    
    try {
      // Update report status
      await apiRequest('PATCH', `/api/reports/${id}/status`, {
        status: confirmStatus
      });
      
      // Record status change on blockchain
      await blockchainService.recordStatusChange(
        report.reportId,
        confirmStatus
      );
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      
      toast({
        title: "Status updated",
        description: `Report status changed to "${confirmStatus}"`,
      });
      
      // Reset state
      setConfirmStatus("");
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };
  
  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !report) return;
    
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
        reportId: report.id,
        encryptedContent,
        encryptionKey
      });
      
      // Reset form
      setNewMessage("");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}/messages`] });
      
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
  
  // Download attachment
  const downloadAttachment = async (attachment) => {
    try {
      toast({
        title: "Downloading file...",
        description: "Retrieving from secure storage",
      });
      
      // In a real implementation, this would download from IPFS and decrypt
      const file = await ipfsService.downloadFile(attachment.ipfsHash, attachment.encryptedKey);
      
      // Create a download link
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "File downloaded",
        description: `${attachment.fileName} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
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
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <Badge variant="secondary">New</Badge>;
      case 'Assigned':
        return <Badge variant="outline">Assigned</Badge>;
      case 'Under Investigation':
        return <Badge variant="success">Under Investigation</Badge>;
      case 'Closed':
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get progress percentage
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'New':
        return 10;
      case 'Assigned':
        return 30;
      case 'Under Investigation':
        return 70;
      case 'Closed':
        return 100;
      default:
        return 0;
    }
  };
  
  if (isLoadingReport) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl mb-6" />
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Report Not Found</h2>
              <p className="text-gray-500 mb-4">The report you're looking for doesn't exist or you don't have permission to view it.</p>
              <Link href="/investigator/report-queue">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Report #{report.reportId}</h1>
            <p className="mt-1 text-sm text-gray-500">{report.subject}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(report.status)}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Report Status</DialogTitle>
                  <DialogDescription>
                    Change the current status of this whistleblower report.
                    This action will be recorded on the blockchain.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Current Status: {report.status}</p>
                    <Progress value={getProgressPercentage(report.status)} className="h-2" />
                  </div>
                  
                  <Select
                    value={confirmStatus}
                    onValueChange={setConfirmStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmStatus("")}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={confirmStatus === "Closed" ? "destructive" : "default"}
                    onClick={updateReportStatus}
                    disabled={!confirmStatus || isStatusUpdating}
                  >
                    {isStatusUpdating ? "Updating..." : `Update to ${confirmStatus}`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="details">Report Details</TabsTrigger>
            {report.allowCommunication && (
              <TabsTrigger value="messages">Communications</TabsTrigger>
            )}
            <TabsTrigger value="files">Evidence Files</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain Verification</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Report Information</CardTitle>
                <CardDescription>Details of the whistleblower report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Type</h3>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{report.type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Department/Organization</h3>
                    <p className="mt-1 text-sm text-gray-900">{report.department}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {report.location}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Submitted Date</h3>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {new Date(report.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Submission Type</h3>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      {report.isAnonymous ? 'Anonymous' : 'Identified'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Communication</h3>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1 text-gray-400" />
                      {report.allowCommunication ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {/* In a real implementation, this would be decrypted */}
                      {report.description}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Investigation Status</h3>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1 text-xs text-gray-500">
                      <span>Assigned</span>
                      <span>Under Investigation</span>
                      <span>Closed</span>
                    </div>
                    <Progress value={getProgressPercentage(report.status)} className="h-2" />
                    <div className="flex justify-center mt-2">
                      <Badge variant={
                        report.status === "New" ? "secondary" :
                        report.status === "Assigned" ? "outline" :
                        report.status === "Under Investigation" ? "success" :
                        "destructive"
                      }>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {report.status === "Under Investigation" && (
                  <div className="bg-secondary-50 border border-secondary-200 rounded-md p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-secondary-500 mr-2 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-secondary-800">Investigation Guidelines</h3>
                        <p className="mt-1 text-sm text-secondary-700">
                          Ensure thorough examination of all evidence. Maintain confidentiality 
                          of the whistleblower at all times. Document all findings securely 
                          in the system.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {report.status === "Closed" && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-green-800">Investigation Complete</h3>
                        <p className="mt-1 text-sm text-green-700">
                          This investigation has been closed. All evidence and communications have been
                          permanently secured on the blockchain for future reference.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-green-700">Blockchain Verified</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Hash: <code className="bg-gray-100 p-1 rounded text-xs">{report.blockchainHash?.substring(0, 16)}...</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {report.allowCommunication && (
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Secure Communications</CardTitle>
                  <CardDescription>End-to-end encrypted messages with the whistleblower</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
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
                                  <AvatarFallback className={isCurrentUser ? 'bg-secondary-100' : 'bg-primary-100'}>
                                    <span className={isCurrentUser ? 'text-secondary-700' : 'text-primary-700'}>
                                      {isCurrentUser ? 'I' : 'W'}
                                    </span>
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className={`flex-1 ${isCurrentUser ? 'bg-secondary-50 text-secondary-900' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2 sm:px-6 sm:py-4 leading-relaxed`}>
                                <div className="flex justify-between items-center mb-1">
                                  <strong>{isCurrentUser ? 'You (Investigator)' : 'Whistleblower (Anonymous)'}</strong>
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
                      <div className="text-center py-8">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Start the conversation with the whistleblower</p>
                      </div>
                    )}
                    
                    {report.status !== "Closed" && (
                      <>
                        <Separator />
                        
                        <div>
                          <div className="flex items-start space-x-4">
                            <div className="min-w-0 flex-1">
                              <div className="relative">
                                <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden focus-within:border-secondary-500 focus-within:ring-1 focus-within:ring-secondary-500">
                                  <Textarea
                                    rows={3}
                                    className="block w-full py-3 border-0 resize-none focus:ring-0 sm:text-sm"
                                    placeholder="Type your message here..."
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
                    )}
                    
                    {report.status === "Closed" && (
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                        <X className="mx-auto h-5 w-5 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          This report is closed. Communication is no longer available.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Files</CardTitle>
                <CardDescription>Files and evidence related to this report</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAttachments ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : attachments && attachments.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {attachments.map((attachment) => (
                      <li key={attachment.id} className="py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-4 flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded on {new Date(attachment.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                          onClick={() => downloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No attachments</h3>
                    <p className="mt-1 text-sm text-gray-500">No files or evidence were attached to this report</p>
                  </div>
                )}
                
                <div className="mt-6 bg-gray-50 p-4 rounded-md">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-secondary-500 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Files are securely stored</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        All evidence files are encrypted and stored on IPFS, with references on the blockchain 
                        for integrity verification. Only authorized investigators can access these files.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="blockchain">
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Verification</CardTitle>
                <CardDescription>Immutable audit trail of all report activities</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : events && events.length > 0 ? (
                  <div>
                    <ul className="space-y-4">
                      {events.map((event, index) => (
                        <li key={index} className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {event.eventType.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <LinkIcon className="h-4 w-4 mr-1" />
                            <span>Transaction: </span>
                            <code className="ml-1 bg-gray-100 p-1 rounded">
                              {event.transactionHash.substring(0, 16)}...
                            </code>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Block: <span className="font-medium">{event.blockNumber}</span>
                          </div>
                          
                          {event.eventType === "StatusChanged" && event.data?.status && (
                            <div className="mt-2 flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-secondary-500" />
                              <span className="text-xs text-secondary-700">
                                Status changed to: <strong>{event.data.status}</strong>
                              </span>
                            </div>
                          )}
                          
                          {event.eventType === "InvestigatorAssigned" && event.data?.investigatorId && (
                            <div className="mt-2 flex items-center">
                              <User className="h-4 w-4 mr-1 text-secondary-500" />
                              <span className="text-xs text-secondary-700">
                                Investigator ID: <strong>{event.data.investigatorId}</strong>
                              </span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-green-700">All events verified on blockchain</span>
                      </div>
                      <Button variant="link" size="sm">
                        View on Block Explorer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No blockchain events</h3>
                    <p className="mt-1 text-sm text-gray-500">No blockchain activity has been recorded yet</p>
                  </div>
                )}
                
                <div className="mt-6 bg-secondary-50 border border-secondary-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-secondary-500 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-secondary-800">Legal Evidence</h3>
                      <p className="mt-1 text-sm text-secondary-700">
                        All blockchain records can serve as legal evidence due to their immutable nature. 
                        This ensures a tamper-proof chain of custody for all evidence and communications.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between">
          <Link href="/investigator/report-queue">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
          </Link>
          
          <div className="space-x-2">
            {report.status === "New" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Assign to Me</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Investigation</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to take responsibility for investigating this report?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-900">Report Details</h4>
                      <p className="mt-1 text-sm text-gray-500">#{report.reportId}: {report.subject}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {report.department} - {report.location}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmStatus("")}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setConfirmStatus("Under Investigation");
                        updateReportStatus();
                      }}
                      disabled={isStatusUpdating}
                    >
                      {isStatusUpdating ? "Assigning..." : "Assign to Me"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            {report.allowCommunication && (
              <Button 
                variant="outline"
                onClick={() => setActiveTab("messages")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Whistleblower
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
