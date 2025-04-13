import { Switch, Route, useLocation } from "wouter";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/investigator/Dashboard";
import ReportQueue from "@/pages/investigator/ReportQueue";
import Investigations from "@/pages/investigator/Investigations";
import Messages from "@/pages/investigator/Messages";
import BlockchainVerification from "@/pages/investigator/BlockchainVerification";
import ReportDetail from "@/pages/investigator/ReportDetail";
import { 
  Home, 
  FileText, 
  Search, 
  MessageSquare, 
  Shield,
  Copy
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface InvestigatorLayoutProps {
  params: {
    rest: string;
  };
}

export default function InvestigatorLayout({ params }: InvestigatorLayoutProps) {
  const [location] = useLocation();
  
  // Get unread message count
  const { data: messageData } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    refetchInterval: 30000
  });
  
  const unreadCount = messageData?.count || 0;
  
  // Get new reports count
  const { data: reportsData } = useQuery({
    queryKey: ['/api/reports', { status: 'New' }],
    refetchInterval: 60000
  });
  
  const newReportsCount = reportsData?.length || 0;
  
  const sidebarItems = [
    {
      href: "/investigator/dashboard",
      icon: <Home />,
      label: "Dashboard",
      isCurrent: location === "/investigator/dashboard"
    },
    {
      href: "/investigator/report-queue",
      icon: <Copy />,
      label: "Report Queue",
      count: newReportsCount,
      isCurrent: location === "/investigator/report-queue"
    },
    {
      href: "/investigator/investigations",
      icon: <Search />,
      label: "Active Investigations",
      isCurrent: location === "/investigator/investigations"
    },
    {
      href: "/investigator/messages",
      icon: <MessageSquare />,
      label: "Secure Communications",
      count: unreadCount,
      isCurrent: location === "/investigator/messages"
    },
    {
      href: "/investigator/blockchain",
      icon: <Shield />,
      label: "Blockchain Verification",
      isCurrent: location === "/investigator/blockchain"
    }
  ];
  
  return (
    <Layout 
      title="Investigator Portal" 
      icon={<Search className="h-8 w-8 text-white" />}
      sidebarItems={sidebarItems}
      userLabel="I"
      sidebarColor="bg-secondary-600"
    >
      <Switch>
        <Route path="/investigator/dashboard" component={Dashboard} />
        <Route path="/investigator/report-queue" component={ReportQueue} />
        <Route path="/investigator/investigations" component={Investigations} />
        <Route path="/investigator/messages" component={Messages} />
        <Route path="/investigator/blockchain" component={BlockchainVerification} />
        <Route path="/investigator/reports/:id">
          {(params) => <ReportDetail id={params.id} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}
