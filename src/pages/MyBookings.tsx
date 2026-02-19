import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Search, Calendar, Clock, User, Loader2 } from "lucide-react";
import { fetchBookingsByEmail, updateBookingStatus } from "@/lib/api";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
};

const nextStatus: Record<string, { label: string; value: "confirmed" | "completed" }> = {
  pending: { label: "Confirm", value: "confirmed" },
  confirmed: { label: "Mark Completed", value: "completed" },
};

export default function MyBookingsPage() {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ["bookings", searchEmail],
    queryFn: () => fetchBookingsByEmail(searchEmail),
    enabled: !!searchEmail,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "confirmed" | "completed" }) =>
      updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", searchEmail] });
      toast.success("Booking status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSearchEmail(email.trim());
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="mt-1 text-muted-foreground">Look up your bookings by email address</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8 flex max-w-md gap-2 animate-fade-in">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-destructive font-medium">Failed to load bookings.</p>
          </div>
        )}

        {bookings && bookings.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">No bookings found for this email.</p>
          </div>
        )}

        {bookings && bookings.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            {bookings.map((booking) => {
              const next = nextStatus[booking.status];
              return (
                <Card key={booking.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-display font-semibold">
                            {booking.experts?.name ?? "Unknown Expert"}
                          </span>
                          <Badge className={statusStyles[booking.status] || ""}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {booking.time_slots
                              ? format(parseISO(booking.time_slots.slot_date), "MMM d, yyyy")
                              : "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {booking.time_slots
                              ? `${booking.time_slots.start_time.slice(0, 5)} — ${booking.time_slots.end_time.slice(0, 5)}`
                              : "N/A"}
                          </span>
                        </div>
                        {booking.notes && (
                          <p className="text-xs text-muted-foreground italic">"{booking.notes}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {next && (
                          <Button
                            size="sm"
                            variant={next.value === "completed" ? "outline" : "default"}
                            disabled={statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ id: booking.id, status: next.value })}
                          >
                            {statusMutation.isPending && statusMutation.variables?.id === booking.id && (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            )}
                            {next.label}
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(parseISO(booking.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!searchEmail && (
          <div className="py-16 text-center animate-fade-in">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <p className="mt-4 text-lg text-muted-foreground">Enter your email to view your bookings</p>
          </div>
        )}
      </main>
    </div>
  );
}
