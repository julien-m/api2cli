"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RefreshReadmeButton({ skillName }: { skillName: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleRefresh = async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/skills/${skillName}/refresh-readme`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to refresh");
      setStatus("success");
      window.location.reload();
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={loading}
        className="text-xs"
      >
        {loading ? "Refreshing..." : "Refresh from GitHub"}
      </Button>
      {status === "success" && (
        <span className="text-xs text-green-600">Updated!</span>
      )}
      {status === "error" && (
        <span className="text-xs text-destructive">Failed to refresh</span>
      )}
    </div>
  );
}
