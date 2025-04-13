import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { blockchainService } from "@/lib/web3";
import { 
  FileText, 
  MapPin, 
  Calendar, 
  Shield, 
  Search, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  ArrowUpDown
} from "lucide-react";

export default function Investigations() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  
  // Get assigned reports
  const { data: assignedReports, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['/api/reports', { assigned: 'true' }]
  });
  
  // Current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me']
  });
  
  // Filter and sort reports
  const filteredReports = assignedReports?.filter((report) => {
    return searchTerm === "" || 
      report.reportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];
  
  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
    if (sortBy === "priority") {
      // Priority sorting logic (New > Under Investigation > Assigned > Closed)
      const priorityOrder = {
        New: 3,
        "Under Investigation": 2,
        Assigned: 1,
        Closed: 0,
      };
      return priorityOrder[b.status] - priorityOrder[a.status];
    }
    if (sortBy === "reportId") {
      return a.reportId.localeCompare(b.reportId);
    }
    return 0;
  });
  
  // Group reports by status
  const reportsByStatus = {
    'Under Investigation': sortedReports.filter(r => r.status === 'Under Investigation'),
    'Assigned': sortedReports.filter(r => r.status === 'Assigned'),
    'Closed': sortedReports.filter(r => r.status === 'Closed')
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
  
  // Update report status
  const updateReportStatus = async () => {
    if (!selectedReportId || !newStatus) return;
    
    setStatusUpdateLoading(true);
    
    try {
      // Update report status
      await apiRequest('PATCH', `/api/reports/${selectedReportId}/status`, {
        status: newStatus
      });
      
      // Record status change on blockchain
      await blockchainService.recordStatusChange(
        selectedReportId.toString(),
        newStatus
      );
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      
      toast({
        title: "Status updated",
        description: `Report status changed to "${newStatus}"`,
      });
      
      // Close dialog
      setSelectedReportId(null);
      setNewStatus("");
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Active Investigations</h1>
        <p className="mt-1 text-sm text-gray-500">Manage and track your assigned whistleblower reports.</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
        {/* Search and Sort */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative rounded-md w-full sm:w-1/3">
                <Input
                  type="text"
                  placeholder="Search investigations"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest first)</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="reportId">Report ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for different statuses */}
        <Tabs defaultValue="investigating" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="investigating">
              Under Investigation ({reportsByStatus['Under Investigation']?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="assigned">
              Assigned ({reportsByStatus['Assigned']?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed ({reportsByStatus['Closed']?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          {Object.entries(reportsByStatus).map(([status, reports]) => (
            <TabsContent 
              key={status} 
              value={status === 'Under Investigation' ? 'investigating' : status.toLowerCase()}
            >
              <Card>
                {isLoadingAssigned ? (
                  <CardContent className="p-4 space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                ) : reports.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {reports.map((report) => (
                      <li key={report.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <Link href={`/investigator/reports/${report.id}`}>
                                  <a className="text-sm font-medium text-secondary-600 truncate">
                                    Report #{report.reportId}
                                  </a>
                                </Link>
                                <Badge className="ml-2" variant={
                                  status === 'Under Investigation' ? 'success' : 
                                  status === 'Assigned' ? 'outline' :
                                  'secondary'
                                }>
                                  {status}
                                </Badge>
                              </div>
                              <div className="mt-1">
                                <p className="text-sm text-gray-900">{report.subject}</p>
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedReportId(report.id);
                                      setNewStatus("");
                                    }}
                                  >
                                    Update Status
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Update Report Status</DialogTitle>
                                    <DialogDescription>
                                      Change the status of report #{report.reportId}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <Select
                                      value={newStatus}
                                      onValueChange={setNewStatus}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select new status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Assigned">Assigned</SelectItem>
                                        <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    
                                    <div className="mt-4 space-y-2">
                                      <p className="text-sm font-medium text-gray-700">Current Progress</p>
                                      <Progress value={getProgressPercentage(report.status)} className="h-2" />
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>Assigned</span>
                                        <span>Under Investigation</span>
                                        <span>Closed</span>
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedReportId(null);
                                        setNewStatus("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={updateReportStatus}
                                      disabled={!newStatus || statusUpdateLoading}
                                    >
                                      {statusUpdateLoading ? "Updating..." : "Update Status"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              <Link href={`/investigator/reports/${report.id}`}>
                                <Button
                                  size="sm"
                                  className="ml-2"
                                >
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                          
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                {report.department}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                {report.location}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              <p>
                                Submitted {new Date(report.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Assigned</span>
                              <span>Investigation</span>
                              <span>Closed</span>
                            </div>
                            <Progress value={getProgressPercentage(report.status)} className="h-2" />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <CardContent className="p-6 text-center">
                    {status === 'Under Investigation' && (
                      <>
                        <Search className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No reports under investigation</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You don't have any reports currently under investigation.
                        </p>
                      </>
                    )}
                    
                    {status === 'Assigned' && (
                      <>
                        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned reports</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You don't have any reports assigned that need to be investigated.
                        </p>
                      </>
                    )}
                    
                    {status === 'Closed' && (
                      <>
                        <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No closed reports</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You haven't closed any investigations yet.
                        </p>
                      </>
                    )}
                    
                    <div className="mt-6">
                      <Link href="/investigator/report-queue">
                        <Button>
                          Check Report Queue
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Investigation Tips */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Investigation Guidelines</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Search className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Thorough Review</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Carefully examine all evidence and documentation before reaching conclusions.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Maintain Confidentiality</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Protect whistleblower identities and handle all information securely.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-secondary-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Regular Updates</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Keep the system updated with your progress and findings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
