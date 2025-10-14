// src/components/UserDropdown.tsx (or wherever you placed UserButton.tsx)

"use client";

import type { Session } from "next-auth"; // Import the Session type
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutUser } from "@/lib/actions/user.actions";

// Define the props this component will accept
interface UserDropdownProps {
  user: Session["user"];
}

export function UserDropdown({ user }: UserDropdownProps) {
  const firstInitial = user?.name?.charAt(0).toUpperCase() ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="relative w-8 h-8 rounded-full ml-2 flex items-center justify-center bg-gray-200"
          >
            {firstInitial}
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="text-sm font-medium leading-none">{user?.name}</div>
            <div className="text-sm text-muted-foreground leading-none">
              {user?.email}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="p-0 mb-1"
          // This is now valid because it's inside a Client Component
          onSelect={(event) => {
            event.preventDefault();
          }}
        >
          <form action={signOutUser} className="w-full">
            <Button
              variant="ghost"
              className="w-full justify-start py-4 px-2 h-4"
              type="submit"
            >
              Sign out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
