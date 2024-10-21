"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Icons } from "../../ui/icons";
import { Label } from "../../ui/label";
import { LoginWithEmailInput } from "./Login";
import { useState } from "react";
import { PasswordInput } from "../../ui/password-input";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onLoginWithEmail: (input: LoginWithEmailInput) => Promise<void>;
  onLoginWithOauth: (provider: "google" | "github") => Promise<void>;
}

export function UserAuthForm({
  className,
  onLoginWithEmail,
  onLoginWithOauth,
  ...props
}: UserAuthFormProps) {
  const [isEmailPasswordLoading, setEmailPasswordIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleIsLoading] = useState(false);
  const [isGithubLoading, setGithubIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);

  const isLoading =
    isEmailPasswordLoading || isGoogleLoading || isGithubLoading;

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setEmailPasswordIsLoading(true);

    await onLoginWithEmail({ email, password });
    setEmailPasswordIsLoading(false);
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <div className="pt-1 pb-[2px] px-1">
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!showPasswordField) {
                    setShowPasswordField(true);
                  }
                }}
              />
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out pt-[2px] pb-1 px-1",
                showPasswordField ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <Label className="sr-only" htmlFor="password">
                Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                autoCorrect="off"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Login with Email
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        onClick={async () => {
          setGoogleIsLoading(true);
          await onLoginWithOauth("google");
          setGoogleIsLoading(false);
        }}
        variant="outline"
        type="button"
        disabled={isLoading}
      >
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}{" "}
        Google
      </Button>
      <Button
        onClick={async () => {
          setGithubIsLoading(true);
          await onLoginWithOauth("google");
          setGithubIsLoading(false);
        }}
        variant="outline"
        type="button"
        disabled={isLoading}
      >
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.gitHub className="mr-2 h-4 w-4" />
        )}{" "}
        GitHub
      </Button>
    </div>
  );
}
