import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { TimeSlot } from "@/lib/api";
import { fetchTimeSlots, subscribeToSlotChanges } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  expertId: string;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

export default function SlotPicker({ expertId, selectedSlot, onSelectSlot }: Props) {
  const { data: slots, isLoading, isError } = useQuery({
    queryKey: ["timeSlots", expertId],
    queryFn: () => fetchTimeSlots(expertId),
  });

  const [liveSlots, setLiveSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (slots) setLiveSlots(slots);
  }, [slots]);

  useEffect(() => {
    const unsub = subscribeToSlotChanges(expertId, (updated) => {
      setLiveSlots((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    });
    return unsub;
  }, [expertId]);

  const grouped = useMemo(() => {
    const map: Record<string, TimeSlot[]> = {};
    for (const slot of liveSlots) {
      const key = slot.slot_date;
      if (!map[key]) map[key] = [];
      map[key].push(slot);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [liveSlots]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => <Skeleton key={j} className="h-10 w-24" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load slots.</p>;
  }

  if (grouped.length === 0) {
    return <p className="text-sm text-muted-foreground">No available slots.</p>;
  }

  return (
    <div className="space-y-5">
      {grouped.map(([date, dateSlots]) => (
        <div key={date}>
          <h4 className="mb-2 text-sm font-semibold text-foreground">
            {format(parseISO(date), "EEEE, MMM d")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {dateSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <button
                  key={slot.id}
                  disabled={slot.is_booked}
                  onClick={() => onSelectSlot(slot)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    slot.is_booked
                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-50"
                      : isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {slot.start_time.slice(0, 5)}
                  {slot.is_booked && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">Booked</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
