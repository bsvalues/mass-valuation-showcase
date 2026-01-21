import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PresenceIndicatorProps {
  connectedUsers: number;
  isConnected: boolean;
}

export function PresenceIndicator({ connectedUsers, isConnected }: PresenceIndicatorProps) {
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-gray-500" />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Users className="w-4 h-4 text-[#00FFEE]" />
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>
      <Badge variant="outline" className="border-[#00FFEE]/30 text-[#00FFEE]">
        {connectedUsers} {connectedUsers === 1 ? 'user' : 'users'} online
      </Badge>
    </div>
  );
}
