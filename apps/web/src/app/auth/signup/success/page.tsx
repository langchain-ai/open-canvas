"use client";

import { UserProvider } from "@/contexts/UserContext";
import { SignupSuccess } from "@/components/auth/signup/success";

export default function Page() {
  return (
    <UserProvider>
      <SignupSuccess />
    </UserProvider>
  );
}
