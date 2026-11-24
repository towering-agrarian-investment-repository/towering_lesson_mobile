import type { TicketType } from "@/types/member.type";
import { BookOpen, LandPlot, Lock, MapPin, Ticket, UserRound, UsersRound } from "lucide-react-native";

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
