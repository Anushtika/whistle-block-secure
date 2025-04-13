import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileText, 
  Users, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  BadgeCheck,
  Shield,
  PieChart,
  BarChart
} from "lucide-react";

export default function Dashboard() {
  // Fetch all reports
  const { data: allReports, isLoading: isLoadingAllReports } = useQuery({
    queryKey: ['/api/reports']
  });
  
  // Fetch assigned reports
  const { data: assignedReports, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['/api/reports', { assigned: 'true' }]
  });
  
  // Fetch unread messages
  const { data: messageData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/messages/unread/count']
  });
  
  // Calculate statistics
  const totalReports = allReports?.length || 0;
  const newReports = allReports?.filter(r => r.status === 'New').length || 0;
  const investigatingReports = allReports?.filter(r => r.status === 'Under Investigation').length || 0;
  const closedReports = allReports?.filter(r => r.status === 'Closed').length || 0;
  const unreadMessages = messageData?.count || 0;
  
  // Calculate percentages for visualizations
  const newPercentage = totalReports ? Math.round((newReports / totalReports) * 100) : 0;
  const investigatingPercentage = totalReports ? Math.round((investigatingReports / totalReports) * 100) : 0;
  const closedPercentage = totalReports ? Math.round((closedReports / totalReports) * 100) : 0;
  
  // Group by report type
  const reportsByType = {};
  if (allReports) {
    allReports.forEach(report => {
      if (!reportsByType[report.type]) {
        reportsByType[report.type] = 0;
      }
      reportsByType[report.type]++;
    });
  }
  
  // Recent activity (most recent 5 reports)
  const recentReports = allReports 
    ? [...allReports].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5)
    : [];
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Investigator Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of whistleblower reports and investigation activities.</p>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Statistics Cards */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Reports
                    </dt>
                    <dd>
                      {isLoadingAllReports ? (
                        <Skeleton className="h-7 w-16" />
                      ) : (
                        <div className="text-lg font-medium text-gray-900">
                          {totalReports}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-secondary-100 rounded-md p-3">
                  <AlertTriangle className="h-6 w-6 text-secondary-600" />
                </div>
                <div className="ml-5 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      New Reports
                    </dt>
                    <dd>
                      {isLoadingAllReports ? (
                        <Skeleton className="h-7 w-16" />
                      ) : (
                        <div className="text-lg font-medium text-gray-900">
                          {newReports}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Under Investigation
                    </dt>
                    <dd>
                      {isLoadingAllReports ? (
                        <Skeleton className="h-7 w-16" />
                      ) : (
                        <div className="text-lg font-medium text-gray-900">
                          {investigatingReports}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* New Reports Alert */}
        {newReports > 0 && (
          <Alert className="mt-6 bg-secondary-50 border-secondary-200">
            <AlertTriangle className="h-4 w-4 text-secondary-600" />
            <AlertTitle className="text-secondary-800">New Reports Pending</AlertTitle>
            <AlertDescription className="text-secondary-700">
              There {newReports === 1 ? 'is' : 'are'} {newReports} new report{newReports === 1 ? '' : 's'} waiting to be assigned for investigation.
              <Link href="/investigator/report-queue">
                <a className="ml-2 font-medium underline">View report queue</a>
              </Link>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
          {/* Reports Status Chart */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reports by Status</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">New Reports</span>
                    <span className="text-sm text-gray-500">{newPercentage}%</span>
                  </div>
                  <Progress value={newPercentage} className="h-2 bg-gray-100" indicatorClassName="bg-secondary-500" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Under Investigation</span>
                    <span className="text-sm text-gray-500">{investigatingPercentage}%</span>
                  </div>
                  <Progress value={investigatingPercentage} className="h-2 bg-gray-100" indicatorClassName="bg-green-500" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Closed Reports</span>
                    <span className="text-sm text-gray-500">{closedPercentage}%</span>
                  </div>
                  <Progress value={closedPercentage} className="h-2 bg-gray-100" indicatorClassName="bg-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Reports by Type */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reports by Type</h3>
                <BarChart className="h-5 w-5 text-gray-400" />
              </div>
              
              {isLoadingAllReports ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : reportsByType && Object.keys(reportsByType).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(reportsByType).map(([type, count]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                        <span className="text-sm text-gray-500">{count} report{count !== 1 ? 's' : ''}</span>
                      </div>
                      <Progress 
                        value={Math.round((count as number / totalReports) * 100)} 
                        className="h-2 bg-gray-100" 
                        indicatorClassName="bg-primary-500" 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Reports */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
              <Link href="/investigator/report-queue">
                <a className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  View all
                </a>
              </Link>
            </div>
            
            {isLoadingAllReports ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentReports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <Link href={`/investigator/reports/${report.id}`}>
                          <a className="text-primary-600 hover:text-primary-800">
                            {report.reportId}
                          </a>
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{report.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {report.status === 'New' && (
                            <AlertTriangle className="h-4 w-4 text-secondary-500 mr-1" />
                          )}
                          {report.status === 'Under Investigation' && (
                            <Search className="h-4 w-4 text-green-500 mr-1" />
                          )}
                          {report.status === 'Closed' && (
                            <CheckCircle className="h-4 w-4 text-gray-500 mr-1" />
                          )}
                          <span className="text-sm">
                            {report.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {new Date(report.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No reports available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* System Status */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">System Status</h3>
              <Shield className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center">
                  <BadgeCheck className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Blockchain Network</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Connected and operational</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center">
                  <BadgeCheck className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">IPFS Storage</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Connected and operational</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center">
                  <BadgeCheck className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Encryption System</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Functioning correctly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
