/**
 * Admin login form atom
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/ui/loader";

interface LoginFormProps {
  onLogin: (key: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function LoginForm({
  onLogin,
  loading = false,
  error,
}: LoginFormProps) {
  const [adminKey, setAdminKey] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim() || loading) return;
    await onLogin(adminKey);
    setAdminKey("");
  };

  return (
    <Card className="border border-border max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Admin Login Required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-key" className="text-sm font-medium">
              Admin Key
            </label>
            <Input
              id="admin-key"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              disabled={loading}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            disabled={!adminKey.trim() || loading}
            className="w-full"
          >
            {loading ? <Loader className="size-4" /> : "Login"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Your session will be stored in a secure HTTP-only cookie.
        </p>
      </CardContent>
    </Card>
  );
}
