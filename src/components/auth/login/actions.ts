"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LoginWithEmailInput } from "./Login";

export async function login(input: LoginWithEmailInput) {
  const supabase = createClient();

  const data = {
    email: input.email,
    password: input.password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // TODO: Push a query param instead.
    throw new Error("Error logging in.");
    // redirect('/error')
  }

  revalidatePath("/", "layout");
  redirect("/");
}
