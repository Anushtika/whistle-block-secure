import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { blockchainService } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Search, 
  CheckCircle, 
  Database, 
  File, 
  Lock, 
  AlertTriangle,
  X,
  ArrowRight,
  Clock,
  RefreshCw
} from "lucide-react";

export default function BlockchainVerification() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    report?: any;
    events?: any[];
    hash?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Get recent reports for verification history
  const { data: reports, isLoading } = useQuery({
    queryKey: ['/api/reports'],
    select: (data) => data.slice(0, 5)
  });
  
  // Verify a report on the blockchain
  const verifyReport = async () => {
    if (!searchTerm) return;
    
    setIsVerifying(true);
    
    try {
      // Try to match the search term to a report ID
      const response = await fetch(`/api/reports`);
      const allReports = await response.json();
      
      const report = allReports.find(
        (r) => r.reportId.toLowerCase() === searchTerm.toLowerCase() || 
               r.reportId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (!report) {
        toast({
          title: "Report not found",
          description: "No report matches the provided ID",
          variant: "destructive",
        });
        setVerificationResult(null);
        return;
      }
      
      // Get events for this report
      const eventsResponse = await fetch(`/api/reports/${report.id}/events`);
      const events = await eventsResponse.json();
      
      // Verify on blockchain
      const isValid = await blockchainService.verifyReportHash(report.reportId, report.blockchainHash);
      
      setVerificationResult({
        verified: isValid,
        report,
        events,
        hash: report.blockchainHash
      });
      
      toast({
        title: isValid ? "Verification Successful" : "Verification Failed",
        description: isValid 
          ? "The report has been verified on the blockchain" 
          : "The report integrity could not be verified",
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "An error occurred during verification",
        variant: "destructive",
      });
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Blockchain Verification</h1>
        <p className="mt-1 text-sm text-gray-500">
          Verify the integrity and authenticity of reports using blockchain technology.
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative rounded-md w-full">
                <Input
                  type="text"
                  placeholder="Enter Report ID (e.g., TN-2023-001)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <Button
                onClick={verifyReport}
                disabled={!searchTerm || isVerifying}
                className="sm:w-auto w-full"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify on Blockchain
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Verification Result */}
        {verificationResult && (
          <Card className="mb-6 border border-2 border-secondary-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {verificationResult.verified ? (
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                    <h2 className="text-lg font-medium">Verification Successful</h2>
                  </div>
                ) : (
                  <div className="flex items-center text-red-700">
                    <X className="h-6 w-6 text-red-500 mr-2" />
                    <h2 className="text-lg font-medium">Verification Failed</h2>
                  </div>
                )}
              </div>
              
              <div className="rounded-md bg-gray-50 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Report ID</p>
                    <p className="mt-1 text-sm text-gray-900">{verificationResult.report.reportId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Subject</p>
                    <p className="mt-1 text-sm text-gray-900">{verificationResult.report.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Submitted Date</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(verificationResult.report.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Status</p>
                    <p className="mt-1 text-sm text-gray-900">{verificationResult.report.status}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Blockchain Hash</p>
                <div className="mt-1 bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto">
                  {verificationResult.hash}
                </div>
              </div>
              
              {verificationResult.events && verificationResult.events.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Blockchain Events</h3>
                  <div className="bg-gray-50 rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Type</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Transaction Hash</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verificationResult.events.map((event, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium capitalize">
                              {event.eventType.replace(/([A-Z])/g, ' $1').trim()}
                            </TableCell>
                            <TableCell>
                              {new Date(event.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs truncate max-w-xs">
                              {event.transactionHash}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <Link href={`/investigator/reports/${verificationResult.report.id}`}>
                  <Button variant="outline" size="sm">
                    View Full Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="history" className="mb-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="history">Recent Verifications</TabsTrigger>
            <TabsTrigger value="info">Blockchain Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Verify these reports on the blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : reports && reports.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {reports.map((report) => (
                      <li key={report.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center">
                              <Shield className="h-5 w-5 text-green-500 mr-2" />
                              <h3 className="text-sm font-medium text-gray-900">
                                Report #{report.reportId}
                              </h3>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">{report.subject}</p>
                            <div className="mt-1 flex items-center text-xs text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(report.submittedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchTerm(report.reportId);
                              verifyReport();
                            }}
                          >
                            Verify
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-gray-500">No reports available for verification</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Integration</CardTitle>
                <CardDescription>How blockchain technology ensures data integrity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <Database className="h-5 w-5 text-secondary-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Immutable Storage</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      All report data is stored in an immutable blockchain ledger that cannot be altered once written.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <File className="h-5 w-5 text-secondary-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Audit Trail</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      Every action related to a report is recorded as a blockchain event, creating a complete audit trail.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <Lock className="h-5 w-5 text-secondary-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Cryptographic Security</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      Advanced cryptography ensures that all stored data is tamper-proof and verifiable.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Verification Process</h3>
                  <ol className="space-y-4">
                    <li className="bg-gray-50 p-4 rounded-md">
                      <div className="flex">
                        <span className="flex-shrink-0 h-6 w-6 bg-secondary-100 text-secondary-700 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">Report Submission</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            When a report is submitted, a cryptographic hash of its contents is created and stored on the blockchain.
                          </p>
                        </div>
                      </div>
                    </li>
                    
                    <li className="bg-gray-50 p-4 rounded-md">
                      <div className="flex">
                        <span className="flex-shrink-0 h-6 w-6 bg-secondary-100 text-secondary-700 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">Status Changes</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Any change to the report's status triggers a new blockchain transaction, creating an immutable record.
                          </p>
                        </div>
                      </div>
                    </li>
                    
                    <li className="bg-gray-50 p-4 rounded-md">
                      <div className="flex">
                        <span className="flex-shrink-0 h-6 w-6 bg-secondary-100 text-secondary-700 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">Verification</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            The verification process recalculates the hash of the report and compares it with the stored hash on the blockchain.
                          </p>
                        </div>
                      </div>
                    </li>
                  </ol>
                </div>
                
                <Alert className="bg-secondary-50 border-secondary-200">
                  <AlertTriangle className="h-4 w-4 text-secondary-500" />
                  <AlertTitle>Important Note</AlertTitle>
                  <AlertDescription>
                    All verification results are cryptographically secure and can be used as evidence in legal proceedings if required.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
