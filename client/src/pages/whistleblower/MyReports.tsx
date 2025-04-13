import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MapPin, 
  Calendar, 
  Shield, 
  MessageSquare, 
  Paperclip, 
  ChevronRight 
} from "lucide-react";

export default function MyReports() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['/api/reports']
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <Badge variant="outline">Submitted</Badge>;
      case 'Assigned':
        return <Badge variant="secondary">Assigned</Badge>;
      case 'Under Investigation':
        return <Badge variant="success">Under Investigation</Badge>;
      case 'Closed':
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Track the status of your submitted reports.</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : reports && reports.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {reports.map((report) => (
                <li key={report.id}>
                  <Link href={`/whistleblower/reports/${report.id}`}>
                    <a className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-primary-600 truncate">
                              Report #{report.reportId}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              {getStatusBadge(report.status)}
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <ChevronRight className="h-5 w-5 text-gray-400" />
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
                              Submitted on{" "}
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
                            
                            {/* This would be populated with actual attachment count */}
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <Paperclip className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              Attachments
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
              <p className="text-gray-500">No reports found</p>
              <Link href="/whistleblower/new-report">
                <a className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
                  Submit a Report
                </a>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
