'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { format, toZonedTime } from 'date-fns-tz';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type { Database } from '@/lib/database.types';

interface EventCardProps {
  event: Database['public']['Tables']['Events']['Row'];
  onShare: (eventId: string) => void;
}

export default function EventCard({ event, onShare }: EventCardProps) {
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
    <div className="group bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-purple-800/30 transition-all duration-300 overflow-hidden hover:-translate-y-1 h-[400px] w-[320px] flex flex-col flex-shrink-0">
      {/* Event Header with gradient */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative">
          <h2 className="text-xl font-bold mb-2 line-clamp-2 min-h-[3.5rem]">
            {event.name}
          </h2>
          <div className="flex items-center text-purple-100">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {event.theme}
            </span>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div className="flex items-center text-gray-300">
            <CalendarIcon className="w-5 h-5 mr-3 text-purple-300 flex-shrink-0" />
            <span className="font-medium">{formattedStart}</span>
          </div>
          <div className="flex items-center text-gray-300">
            <ClockIcon className="w-5 h-5 mr-3 text-purple-300 flex-shrink-0" />
            <span>{formattedTime}</span>
          </div>
          {event.location && (
            <div className="flex items-start text-gray-300">
              <MapPinIcon className="w-5 h-5 mr-3 mt-0.5 text-purple-300 flex-shrink-0" />
              <span className="text-sm line-clamp-3 overflow-hidden">
                {event.location}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700 flex-shrink-0">
          <Button
            onClick={() => router.push(`/event/${event.id}`)}
            className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            Manage
          </Button>
          <Button
            onClick={() => onShare(event.id.toString())}
            variant="outline"
            className="flex-1 bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-green-900/30 hover:border-green-500 hover:text-green-400 shadow-md transition-all duration-200"
          >
            Share Link
          </Button>
        </div>
      </div>
    </div>
  );
}
