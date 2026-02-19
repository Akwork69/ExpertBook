import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import type { TimeSlot, Expert } from "@/lib/api";
import { createBooking } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

const bookingSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(100),
  customer_email: z.string().trim().email("Invalid email").max(255),
  customer_phone: z.string().trim().min(7, "Phone must be at least 7 digits").max(20),
  notes: z.string().max(500).optional(),
});

interface Props {
  expert: Expert;
  slot: TimeSlot;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BookingForm({ expert, slot, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createBooking({
        expert_id: expert.id,
        time_slot_id: slot.id,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        notes: form.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      setSuccess(true);
      toast.success("Booking confirmed!");
    },
    onError: (err: Error) => {
      if (err.message.includes("already booked")) {
        toast.error("This slot was just booked by someone else!");
      } else {
        toast.error(err.message || "Booking failed");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = bookingSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    mutation.mutate();
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center animate-fade-in">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h3 className="font-display text-2xl font-bold">Booking Confirmed!</h3>
        <p className="text-muted-foreground">
          Your session with <strong>{expert.name}</strong> on{" "}
          <strong>{format(parseISO(slot.slot_date), "MMM d, yyyy")}</strong> at{" "}
          <strong>{slot.start_time.slice(0, 5)}</strong> has been booked.
        </p>
        <p className="text-sm text-muted-foreground">
          Check your bookings using your email: <strong>{form.customer_email}</strong>
        </p>
        <Button onClick={onSuccess} className="mt-2">Back to Expert</Button>
      </div>
    );
  }

  const field = (name: keyof typeof form, label: string, type = "text", required = true) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}{required && " *"}</Label>
      {name === "notes" ? (
        <Textarea
          id={name}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder="Any special requirements..."
          rows={3}
        />
      ) : (
        <Input
          id={name}
          type={type}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className={errors[name] ? "border-destructive" : ""}
        />
      )}
      {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div className="rounded-lg border bg-secondary/50 p-3">
        <p className="text-sm font-medium">
          {format(parseISO(slot.slot_date), "EEEE, MMM d")} at {slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}
        </p>
        <p className="text-xs text-muted-foreground">with {expert.name}</p>
      </div>
      {field("customer_name", "Full Name")}
      {field("customer_email", "Email", "email")}
      {field("customer_phone", "Phone", "tel")}
      <div className="space-y-1.5">
        <Label htmlFor="booking-date">Date *</Label>
        <Input
          id="booking-date"
          value={format(parseISO(slot.slot_date), "yyyy-MM-dd")}
          readOnly
          disabled
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="booking-time-slot">Time Slot *</Label>
        <Input
          id="booking-time-slot"
          value={`${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`}
          readOnly
          disabled
        />
      </div>
      {field("notes", "Notes", "text", false)}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="flex-1">
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm Booking
        </Button>
      </div>
    </form>
  );
}
