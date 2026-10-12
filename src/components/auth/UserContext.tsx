"use client";
import { createContext, useContext, useState } from "react";
import type { PublicUser } from "@/lib/auth";
type UserContextType = { currentUser: PublicUser | null; setCurrentUser: (user: PublicUser | null) => void; isAdmin: boolean; users: PublicUser[] };
const UserContext = createContext<UserContextType>({ currentUser: null, setCurrentUser: () => {}, isAdmin: false, users: [] });
export function UserProvider({ children, initialUsers, initialCurrentUser }: { children: React.ReactNode; initialUsers: PublicUser[]; initialCurrentUser: PublicUser | null }) {
  const [selected, setSelected] = useState<PublicUser | null | undefined>(undefined);
  const currentUser = selected === undefined ? initialCurrentUser : selected;
  return <UserContext.Provider value={{ currentUser, setCurrentUser: setSelected, isAdmin: currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER", users: initialUsers }}>{children}</UserContext.Provider>;
}
export function useUserContext() { return useContext(UserContext); }
