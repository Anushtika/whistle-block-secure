import { ReactNode } from "react";
import { Link } from "wouter";
import { blockchainService } from "@/lib/web3";
import { useState, useEffect } from "react";

interface SidebarProps {
  items: {
    href: string;
    icon: ReactNode;
    label: string;
    count?: number;
    isCurrent: boolean;
  }[];
  color: string;
}

export default function Sidebar({ items, color }: SidebarProps) {
  const [blockchainStatus, setBlockchainStatus] = useState(false);
  const [storagePercent, setStoragePercent] = useState(0);
  
  // Check blockchain connection status
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await blockchainService.getConnectionStatus();
      setBlockchainStatus(isConnected);
      
      // Simulate storage usage
      setStoragePercent(Math.floor(Math.random() * 90) + 10);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-white w-64 flex flex-col border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="w-full py-3 bg-primary-50 rounded-md px-3 flex items-center">
            <div className={`mr-3 h-2 w-2 rounded-full ${blockchainStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-primary-700 font-medium">Secure Connection</span>
          </div>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
                ${item.isCurrent 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-50'}
              `}
            >
              <span className={`mr-3 h-5 w-5 ${item.isCurrent ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                {item.icon}
              </span>
              {item.label}
              {item.count !== undefined && (
                <span className="ml-auto bg-primary-100 text-primary-600 py-0.5 px-2 rounded-full text-xs">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="w-full">
          <div className="flex items-center mb-2">
            <div className={`mr-2 h-3 w-3 rounded-full ${blockchainStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">Blockchain Connected</span>
          </div>
          <div className="bg-gray-100 h-1.5 w-full rounded-full overflow-hidden">
            <div 
              className={`${color.replace('bg-', '')} h-1.5 rounded-full`} 
              style={{ width: `${storagePercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Storage: {storagePercent}%</span>
            <span className="text-xs text-gray-500">{(storagePercent * 0.03).toFixed(1)}GB/3GB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
