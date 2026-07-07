'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { format, toZonedTime } from 'date-fns-tz';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { Database } from '@/lib/database.types';

interface EventCardProps {
  event: Database['public']['Tables']['Events']['Row'];
  onShare: (eventId: string) => void;
  onDelete: (eventId: number) => void;
  isDeleting?: boolean;
}

export default function EventCard({ event, onShare, onDelete, isDeleting = false }: EventCardProps) {
  const router = useRouter();

  const eventTimeZone = event.time_zone || 'America/Los_Angeles';
  const zonedStart = toZonedTime(event.start_date, eventTimeZone);
  const formattedStart = format(zonedStart, 'MMM d, yyyy', {
    timeZone: eventTimeZone,
  });
  const formattedTime = format(zonedStart, 'h:mm aaaa', {
    timeZone: eventTimeZone,
  });

  return (
    <div className="flex w-full max-w-[320px] flex-col rounded-xl border border-border bg-white p-6 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:w-[320px]">
      {/* Mono eyebrow row: label / theme */}
      <div className="flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.18em] uppercase">
        <span className="whitespace-nowrap text-primary">EVENT</span>
        {event.theme && (
          <span className="truncate rounded-md bg-primary/10 px-2 py-1 tracking-wide text-primary">
            {event.theme}
          </span>
        )}
      </div>

      {/* Event name */}
      <h2 className="mt-3 line-clamp-2 min-h-[3.5rem] text-xl font-semibold tracking-tight text-foreground">
        {event.name}
      </h2>

      {/* Event details */}
      <div className="mt-4 flex-1 space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarIcon className="mr-2.5 h-4 w-4 flex-shrink-0 text-primary" />
          <span>{formattedStart}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <ClockIcon className="mr-2.5 h-4 w-4 flex-shrink-0 text-primary" />
          <span>{formattedTime}</span>
        </div>
        {event.location && (
          <div className="flex items-start text-sm text-muted-foreground">
            <MapPinIcon className="mr-2.5 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span className="line-clamp-3 overflow-hidden">{event.location}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex gap-2 border-t border-border pt-4">
        <Button
          onClick={() => router.push(`/event/${event.id}`)}
          className="flex-1"
        >
          <UsersIcon className="mr-2 h-4 w-4" />
          Manage
        </Button>
        <Button
          onClick={() => onShare(event.id.toString())}
          variant="outline"
          className="flex-1"
        >
          Share
        </Button>
        <Button
          onClick={() => onDelete(event.id)}
          variant="outline"
          disabled={isDeleting}
          className="px-3 text-red-600 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <TrashIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
