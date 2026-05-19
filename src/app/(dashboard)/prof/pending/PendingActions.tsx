"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { RefreshCw, LogOut } from "lucide-react";

export function PendingActions() {
  const router = useRouter();
  const supabase = createClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Next.js router.refresh() will re-run the server component logic
    router.refresh();
    // Artificial delay for feedback
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <Button 
        onClick={handleRefresh} 
        disabled={refreshing}
        className="w-full gap-2 py-6 text-base"
      >
        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        {refreshing ? "Checking status..." : "Refresh Application Status"}
      </Button>
      
      <button 
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 text-[#3a3a3a] hover:text-[#8a8a8a] transition-colors text-sm font-medium py-2 group"
      >
        <LogOut size={16} className="group-hover:translate-x-[-2px] transition-transform" />
        Sign Out &amp; Return Home
      </button>
    </div>
  );
}
