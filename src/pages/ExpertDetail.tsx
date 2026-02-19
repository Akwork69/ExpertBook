import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star, Clock, Briefcase, DollarSign } from "lucide-react";
import { fetchExpert } from "@/lib/api";
import type { TimeSlot } from "@/lib/api";
import Header from "@/components/Header";
import SlotPicker from "@/components/SlotPicker";
import BookingForm from "@/components/BookingForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ExpertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data: expert, isLoading, isError } = useQuery({
    queryKey: ["expert", id],
    queryFn: () => fetchExpert(id!),
    enabled: !!id,
  });

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot);
    setShowBookingForm(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Experts
        </Link>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-destructive font-medium">Failed to load expert details.</p>
          </div>
        )}

        {expert && (
          <div className="grid gap-8 lg:grid-cols-5 animate-fade-in">
            {/* Left: Expert Info */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 font-display text-2xl font-bold text-primary">
                    {expert.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h1 className="font-display text-2xl font-bold">{expert.name}</h1>
                    <Badge variant="secondary" className="mt-1">{expert.category}</Badge>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">{expert.bio}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                    <Star className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <p className="font-semibold">{expert.rating}/5.0</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Experience</p>
                      <p className="font-semibold">{expert.experience_years} years</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Session</p>
                      <p className="font-semibold">60 min</p>
                    </div>
                  </div>
                  {expert.hourly_rate && (
                    <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                      <DollarSign className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-xs text-muted-foreground">Rate</p>
                        <p className="font-semibold">${expert.hourly_rate}/hr</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Slots & Booking */}
            <div className="lg:col-span-3">
              <div className="rounded-xl border bg-card p-6">
                {showBookingForm && selectedSlot ? (
                  <>
                    <h2 className="mb-4 font-display text-xl font-semibold">Complete Your Booking</h2>
                    <BookingForm
                      expert={expert}
                      slot={selectedSlot}
                      onSuccess={() => {
                        setShowBookingForm(false);
                        setSelectedSlot(null);
                      }}
                      onCancel={() => setShowBookingForm(false)}
                    />
                  </>
                ) : (
                  <>
                    <h2 className="mb-4 font-display text-xl font-semibold">Available Time Slots</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Slots update in real-time. Select a slot to book.
                    </p>
                    <SlotPicker
                      expertId={expert.id}
                      selectedSlot={selectedSlot}
                      onSelectSlot={handleSlotSelect}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
