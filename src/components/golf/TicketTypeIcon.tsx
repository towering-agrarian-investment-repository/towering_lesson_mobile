import type { TicketType } from "@/types/member.type";
import BookOpen from "lucide-react-native/icons/book-open";
import LandPlot from "lucide-react-native/icons/land-plot";
import Lock from "lucide-react-native/icons/lock";
import MapPin from "lucide-react-native/icons/map-pin";
import Ticket from "lucide-react-native/icons/ticket";
import UserRound from "lucide-react-native/icons/user-round";
import UsersRound from "lucide-react-native/icons/users-round";

type Props = {
    type?: TicketType | string | null;
    size?: number;
    color: string;
    strokeWidth?: number;
};

export function TicketTypeIcon({ type, size = 19, color, strokeWidth = 2.2 }: Props) {
    switch (String(type ?? "").toUpperCase()) {
        case "BAY_USAGE":
            return <LandPlot size={size} color={color} strokeWidth={strokeWidth} />;
        case "PRIVATE_LESSON":
            return <UserRound size={size} color={color} strokeWidth={strokeWidth} />;
        case "GROUP_LESSON":
            return <UsersRound size={size} color={color} strokeWidth={strokeWidth} />;
        case "LESSON_PROGRAM":
            return <BookOpen size={size} color={color} strokeWidth={strokeWidth} />;
        case "LOCKER_SERVICE":
            return <Lock size={size} color={color} strokeWidth={strokeWidth} />;
        case "LOCATION":
            return <MapPin size={size} color={color} strokeWidth={strokeWidth} />;
        default:
            return <Ticket size={size} color={color} strokeWidth={strokeWidth} />;
    }
}
