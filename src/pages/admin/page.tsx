import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loader";
import { ThemeSwitcher } from "@/components/layout/chat-header";
import LoginForm from "@/components/admin/atoms/login-form";
import StatsCards from "@/components/admin/components/stats-cards";
import StatsCardsSkeleton from "@/components/admin/components/stats-cards-skeleton";
import UserTable from "@/components/admin/components/user-table";
import UserTableSkeleton from "@/components/admin/components/user-table-skeleton";
import UserDialog from "@/components/admin/components/user-dialog";
import type { AdminUsageResponse, AdminUserUsage } from "@/lib/types/admin";
import type { ModelID } from "@/lib/types/models";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<AdminUsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserUsage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isLoggingOutRef = useRef(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth", {
        credentials: "include",
      });
      const data = (await res.json()) as { authenticated: boolean };
      setAuthenticated(data.authenticated);
      if (data.authenticated) {
        fetchUsage();
      }
    } catch {
      setAuthenticated(false);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle tab visibility change - logout when tab is hidden
  useEffect(() => {
    if (!authenticated) return;

    const handleVisibilityChange = () => {
      if (document.hidden && authenticated && !isLoggingOutRef.current) {
        // Tab is hidden, logout automatically
        performLogout();
      }
    };

    const handleBeforeUnload = () => {
      if (authenticated && !isLoggingOutRef.current) {
        // Page is being unloaded, logout
        performLogout();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [authenticated]);

  const handleLogin = async (adminKey: string) => {
    setLoggingIn(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ key: adminKey }),
      });
      if (!res.ok) {
        let errorMessage = "Authentication failed";
        try {
          const errorData = (await res.json()) as {
            message?: string;
            error?: string;
          };
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data.success && data.authenticated) {
        setAuthenticated(true);
        await fetchUsage();
      } else {
        throw new Error("Authentication failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to authenticate");
      setAuthenticated(false);
    } finally {
      setLoggingIn(false);
    }
  };

  const fetchUsage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/usage", {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(await res.text());
      }
      const data = (await res.json()) as AdminUsageResponse;
      setUsage(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load usage information"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (
    user: AdminUserUsage,
    model: ModelID,
    blocked: boolean
  ) => {
    setBlocking(true);
    try {
      const res = await fetch("/api/admin/usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId: user.userId, model, blocked }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(await res.text());
      }
      await fetchUsage();
      // Update selected user if dialog is open
      if (selectedUser && selectedUser.userId === user.userId) {
        const updatedUser = usage?.users.find((u) => u.userId === user.userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update block status"
      );
    } finally {
      setBlocking(false);
    }
  };

  const handleUserClick = (user: AdminUserUsage) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const performLogout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      // Call logout endpoint to invalidate session on server
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // Continue with logout even if API call fails
      console.error("Logout API error:", err);
    } finally {
      // Clear client-side state
      setAuthenticated(false);
      setUsage(null);
      setSelectedUser(null);
      setDialogOpen(false);
      setError(null);

      // Clear cookie client-side as fallback
      document.cookie =
        "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      isLoggingOutRef.current = false;
    }
  };

  const handleLogout = () => {
    performLogout();
  };

  return (
    <main className="relative w-full min-h-screen bg-background overflow-hidden">
      <section className="w-full max-w-[95vw] xl:max-w-[1400px] px-4 md:px-8 lg:px-10 py-10 mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Monitor token usage across models and manage user access.
            </p>
          </div>
          {authenticated ? (
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <Button onClick={fetchUsage} disabled={loading}>
                {loading ? <Loader className="size-4" /> : "Refresh"}
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : null}
        </header>

        {authenticated === false ? (
          <LoginForm onLogin={handleLogin} loading={loggingIn} error={error} />
        ) : authenticated === null ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="size-6" />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* Show skeleton while loading, or actual content when loaded */}
        {authenticated && loading && !usage ? (
          <>
            <StatsCardsSkeleton />
            <UserTableSkeleton />
          </>
        ) : (
          <>
            {usage && usage.stats.length > 0 ? (
              <StatsCards stats={usage.stats} users={usage.users} />
            ) : null}

            {usage ? (
              <UserTable
                users={usage.users}
                loading={loading}
                onUserClick={handleUserClick}
                onToggleBlock={toggleBlock}
                blocking={blocking}
              />
            ) : null}
          </>
        )}

        <UserDialog
          user={selectedUser}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onToggleBlock={toggleBlock}
          blocking={blocking}
        />
      </section>
    </main>
  );
}
