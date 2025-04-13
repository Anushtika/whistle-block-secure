import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  CheckCircle, 
  Calendar, 
  MessageSquare, 
  Clock, 
  MapPin,
  Shield,
  FileDigit
} from "lucide-react";

export default function Dashboard() {
  // Fetch user reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['/api/reports']
  });
  
  // Fetch unread messages
  const { data: messageData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/messages/unread/count']
  });
  
  // Statistics
  const totalReports = reports?.length || 0;
  const underInvestigation = reports?.filter(r => r.status === 'Under Investigation').length || 0;
  const unreadMessages = messageData?.count || 0;
  
  // Recent activity - would come from a combination of report status changes and messages
  const recentActivities = reports?.slice(0, 3).map(report => ({
    id: report.id,
    reportId: report.reportId,
    title: `Report ${report.reportId} ${report.status === 'New' ? 'submitted' : 'status changed to "' + report.status + '"'}`,
    timestamp: new Date(report.submittedAt),
    type: report.status === 'New' ? 'submission' : 'status-change',
    details: report.subject
  })) || [];
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Reports */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Reports
                      </dt>
                      <dd>
                        {isLoadingReports ? (
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
            
            {/* Reports Under Investigation */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Reports Being Investigated
                      </dt>
                      <dd>
                        {isLoadingReports ? (
                          <Skeleton className="h-7 w-16" />
                        ) : (
                          <div className="text-lg font-medium text-gray-900">
                            {underInvestigation}
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Unread Messages */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-secondary-100 rounded-md p-3">
                    <MessageSquare className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Unread Messages
                      </dt>
                      <dd>
                        {isLoadingMessages ? (
                          <Skeleton className="h-7 w-16" />
                        ) : (
                          <div className="text-lg font-medium text-gray-900">
                            {unreadMessages}
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Activity Feed */}
          <div className="mt-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h2>
            <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
              {isLoadingReports ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : recentActivities.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentActivities.map((activity) => (
                    <li key={activity.id}>
                      <Link href={`/whistleblower/reports/${activity.id}`}>
                        <a className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="mr-4 flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                  {activity.type === 'submission' ? (
                                    <FileDigit className="h-5 w-5 text-primary-600" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-primary-600" />
                                  )}
                                </div>
                                <p className="text-sm font-medium text-primary-600 truncate">
                                  {activity.title}
                                </p>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {activity.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                  {activity.timestamp.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
