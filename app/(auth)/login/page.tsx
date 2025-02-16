"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import Form from "next/form";
import { login, ProviderLogin, type LoginActionState } from "../actions";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );
  const [providerstate, providerformAction] = useActionState<LoginActionState>(
    ProviderLogin,
    {
      status: "idle",
    }
  );

  useEffect(() => {
    if (state.status === "failed") {
      toast.error("Invalid credentials!");
    } else if (state.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state.status === "success") {
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state.status, router]);
  const handleSignIn = async () => {
    await providerformAction();
  };
  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="relative h-screen flex-col items-center justify-center">
      <div className="flex h-full items-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-12 sm:w-[350px]">
          <div className="flex flex-col space-y-8 text-center">
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
                  Sign in - 
                </span>
                <span className="relative inline-block ml-2">
                  <span className="absolute -inset-1 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-50 blur animate-pulse"></span>
                  <span className="relative text-white bg-black px-2 py-1 rounded-lg">
                    Invite only
                  </span>
                </span>
              </h1>
              <p className="text-sm text-muted-foreground animate-fade-in">
                Choose from the following providers
              </p>
            </div>

            <Form action={handleSignIn} className="mt-8">
              <SubmitButton isSuccessful={isSuccessful}>
                <FcGoogle className="w-full h-5 mr-2" />
                Sign in with Google
              </SubmitButton>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
