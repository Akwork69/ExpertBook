import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Expert } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const categoryColors: Record<string, string> = {
  Technology: "bg-primary/10 text-primary",
  Business: "bg-accent/10 text-accent-foreground",
  Health: "bg-success/10 text-success",
  Education: "bg-primary/10 text-primary",
  Finance: "bg-warning/10 text-warning",
  Legal: "bg-muted text-muted-foreground",
  Marketing: "bg-destructive/10 text-destructive",
  Design: "bg-accent/10 text-accent-foreground",
};

export default function ExpertCard({ expert }: { expert: Expert }) {
  return (
    <Link to={`/experts/${expert.id}`}>
      <Card className="group cursor-pointer border transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-bold text-primary">
              {expert.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-lg font-semibold group-hover:text-primary transition-colors">
                {expert.name}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className={categoryColors[expert.category] || ""}>
                  {expert.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{expert.experience_years}y exp</span>
              </div>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{expert.bio}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-semibold">{expert.rating}</span>
            </div>
            {expert.hourly_rate && (
              <span className="text-sm font-semibold text-primary">${expert.hourly_rate}/hr</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
