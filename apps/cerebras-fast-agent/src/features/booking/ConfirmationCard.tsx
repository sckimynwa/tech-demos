import { CalendarCheck, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BookingResult } from "@/shared/protocol";

export function ConfirmationCard({ booked }: { booked: BookingResult }) {
  return (
    <Card className="border-0 bg-emerald-400/8 ring-1 ring-emerald-400/25">
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[11px] tracking-[0.18em] text-emerald-300 uppercase">
            reserved
          </p>
          <Badge variant="outline" className="font-mono">
            {booked.confirmationId}
          </Badge>
        </div>
        <h3 className="font-heading text-lg">{booked.restaurantName}</h3>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarCheck className="size-3.5" />
            {booked.dateLabel} · {booked.time}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {booked.partySize} guests
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {booked.neighborhood} · {booked.price} · {booked.rating.toFixed(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
