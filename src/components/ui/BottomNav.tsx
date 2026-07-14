import Link from "next/link";
import { CalendarDays, Home, PlusCircle, User, Users } from "lucide-react";

const links = [
  { href: "/", label: "Today", icon: Home },
  { href: "/pair", label: "Pair", icon: Users },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-white/10 bg-slate-950/95 px-2 py-2 backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white">
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
