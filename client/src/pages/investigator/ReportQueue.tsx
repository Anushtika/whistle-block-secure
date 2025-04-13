import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { blockchainService } from "@/lib/web3";
import { 
  FileText, 
  MapPin, 
  Calendar, 
  Shield, 
  MessageSquare, 
  Paperclip, 
  ChevronRight,
  AlertTriangle,
  Search
} from "lucide-react";

export default function ReportQueue() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [isAssigningReport, setIsAssigningReport] = useState(false);
  
  // Get all reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ['/api/reports']
  });
  
  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me']
  });
  
  // Apply filters and search
  const filteredReports = reports?.filter((report) => {
    const matchesSearch = searchTerm === "" || 
      report.reportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];
  
  // Pagination
  const reportsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / reportsPerPage));
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );
  
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
  
  // Handle assignment of report to self
  const assignReportToSelf = async () => {
    if (!selectedReportId || !currentUser) return;
    
    setIsAssigningReport(true);
    
    try {
      // Assign the report to the current investigator
      await apiRequest('PATCH', `/api/reports/${selectedReportId}/assign`, {
        investigatorId: currentUser.id
      });
      
      // Record assignment on blockchain
      await blockchainService.assignInvestigator(
        selectedReportId.toString(),
        currentUser.id
      );
      
      // Change status to "Under Investigation"
      await apiRequest('PATCH', `/api/reports/${selectedReportId}/status`, {
        status: 'Under Investigation'
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      
      toast({
        title: "Report assigned",
        description: "The report has been assigned to you for investigation",
      });
      
      // Close dialog
      setSelectedReportId(null);
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Failed to assign report",
        variant: "destructive",
      });
    } finally {
      setIsAssigningReport(false);
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Report Queue</h1>
        <p className="mt-1 text-sm text-gray-500">Process and assign incoming whistleblower reports.</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="w-full sm:w-1/3">
                <div className="relative rounded-md shadow-sm">
                  <Input
                    type="text"
                    placeholder="Search reports"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="corruption">Corruption</SelectItem>
                      <SelectItem value="fraud">Fraud</SelectItem>
                      <SelectItem value="misappropriation">Misappropriation</SelectItem>
                      <SelectItem value="ethical">Ethical Violation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Report List */}
        <Card>
          {isLoading ? (
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          ) : paginatedReports.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {paginatedReports.map((report) => (
                <li key={report.id}>
                  <div className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Link href={`/investigator/reports/${report.id}`}>
                            <a className="text-sm font-medium text-secondary-600 truncate">
                              Report #{report.reportId}
                            </a>
                          </Link>
                          <div className="ml-2 flex-shrink-0 flex">
                            {getStatusBadge(report.status)}
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          {report.status === 'New' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedReportId(report.id)}
                                >
                                  Assign Investigation
                                </Button>
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
                                    onClick={() => setSelectedReportId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={assignReportToSelf}
                                    disabled={isAssigningReport}
                                  >
                                    {isAssigningReport ? "Assigning..." : "Assign to Me"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {report.status !== 'New' && (
                            <Link href={`/investigator/reports/${report.id}`}>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            {report.subject}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            {report.location}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>
                            Received on{" "}
                            <time dateTime={new Date(report.submittedAt).toISOString()}>
                              {new Date(report.submittedAt).toLocaleDateString()}
                            </time>
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-green-700">
                            <Shield className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-500" />
                            Blockchain Verified
                          </p>
                          
                          {report.allowCommunication && (
                            <p className="mt-2 flex items-center text-sm text-secondary-700 sm:mt-0 sm:ml-6">
                              <MessageSquare className="flex-shrink-0 mr-1.5 h-5 w-5 text-secondary-500" />
                              Communications Enabled
                            </p>
                          )}
                          
                          {/* Attachments indicator */}
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <Paperclip className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            Attachments
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <CardContent className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'There are no reports in the queue at this time'}
              </p>
            </CardContent>
          )}
          
          {/* Pagination */}
          {filteredReports.length > reportsPerPage && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * reportsPerPage + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * reportsPerPage, filteredReports.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredReports.length}</span> reports
                  </p>
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        isActive={currentPage > 1}
                      />
                    </PaginationItem>
                    
                    {/* First page */}
                    {currentPage > 2 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {/* Ellipsis if needed */}
                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Previous page if not first */}
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(currentPage - 1)}>
                          {currentPage - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {/* Current page */}
                    <PaginationItem>
                      <PaginationLink isActive>{currentPage}</PaginationLink>
                    </PaginationItem>
                    
                    {/* Next page if not last */}
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(currentPage + 1)}>
                          {currentPage + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {/* Ellipsis if needed */}
                    {currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Last page if not current or next */}
                    {currentPage < totalPages - 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        isActive={currentPage < totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
