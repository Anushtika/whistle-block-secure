import { Switch, Route, useLocation } from "wouter";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/whistleblower/Dashboard";
import NewReport from "@/pages/whistleblower/NewReport";
import MyReports from "@/pages/whistleblower/MyReports";
import Messages from "@/pages/whistleblower/Messages";
import ReportDetail from "@/pages/whistleblower/ReportDetail";
import { 
  Home, 
  FileText, 
  FilePlus, 
  MessageSquare, 
  Lock 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface WhistleblowerLayoutProps {
  params: {
    rest: string;
  };
}

export default function WhistleblowerLayout({ params }: WhistleblowerLayoutProps) {
  const [location] = useLocation();
  
  // Get unread message count
  const { data: messageData } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    refetchInterval: 30000
  });
  
  const unreadCount = messageData?.count || 0;
  
  const sidebarItems = [
    {
      href: "/whistleblower/dashboard",
      icon: <Home />,
      label: "Dashboard",
      isCurrent: location === "/whistleblower/dashboard"
    },
    {
      href: "/whistleblower/new-report",
      icon: <FilePlus />,
      label: "New Report",
      isCurrent: location === "/whistleblower/new-report"
    },
    {
      href: "/whistleblower/my-reports",
      icon: <FileText />,
      label: "My Reports",
      isCurrent: location === "/whistleblower/my-reports"
    },
    {
      href: "/whistleblower/messages",
      icon: <MessageSquare />,
      label: "Secure Messages",
      count: unreadCount,
      isCurrent: location === "/whistleblower/messages"
    }
  ];
  
  return (
    <Layout 
      title="Whistleblower Portal" 
      icon={<Lock className="h-8 w-8 text-white" />}
      sidebarItems={sidebarItems}
      userLabel="W"
      sidebarColor="bg-primary-600"
    >
      <Switch>
        <Route path="/whistleblower/dashboard" component={Dashboard} />
        <Route path="/whistleblower/new-report" component={NewReport} />
        <Route path="/whistleblower/my-reports" component={MyReports} />
        <Route path="/whistleblower/messages" component={Messages} />
        <Route path="/whistleblower/reports/:id">
          {(params) => <ReportDetail id={params.id} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}
