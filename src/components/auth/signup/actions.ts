"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SignupWithEmailInput } from "./Signup";

export async function signup(input: SignupWithEmailInput) {
  const supabase = createClient();

  const data = {
    email: input.email,
    password: input.password,
    // Not possible to set this when signing up with OAuth, so for now we'll omit.
    // data: {
    //   is_open_canvas: true,
    // },
    options: {
      emailRedirectTo:
        process.env.EMAIL_REDIRECT_URL || "http://localhost:3000/auth/confirm",
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    // TODO: Push a query param instead.
    throw new Error("Error signing up.");
    // redirect('/error')
  }
  console.log("SUCCESSFULLY SIGNED UP. REDIRECTING TO CONFIRM EMAIL PAGE");
  // Users still need to confirm their email address.
  // This page will show a message to check their email.
  redirect("/auth/signup/success");
}
