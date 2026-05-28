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
    <div className="flex flex-col gap-8 w-full">
      <Button 
        onClick={handleRefresh} 
        disabled={refreshing}
        className="w-full gap-2 py-6 text-base"
      >
        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        {refreshing ? "Checking status..." : "Refresh Application Status"}
      </Button>
      
      <Button 
        onClick={handleSignOut}
        variant="ghost"
        className="w-full gap-2 text-slate-500 hover:border-[rgba(255,80,80,0.4)] hover:text-[#ff6b6b]"
      >
        <LogOut size={16} className="group-hover:translate-x-[-2px] transition-transform" style={{ marginRight: "0.25rem" }} />
        Sign Out &amp; Return Home
      </Button>
    </div>
  );
}
