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
    // <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
    //   <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
    //     <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
    //       <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
    //       <p className="text-sm text-gray-500 dark:text-zinc-400">
    //         Use your email and password to sign in
    //       </p>
    //     </div>
    //     <Form action={handleSignIn}>
    //       <SubmitButton isSuccessful={isSuccessful}>
    //         <>
    //           <FcGoogle className="w-5 h-5 mr-2" />
    //         </>
    //       </SubmitButton>
    //     </Form>

    //     {/* <AuthForm action={handleSubmit} defaultEmail={email}>
    //       <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
    //       <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
    //         {"Don't have an account? "}
    //         <Link
    //           href="/register"
    //           className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
    //         >
    //           Sign up
    //         </Link>
    //         {" for free."}
    //       </p>
    //     </AuthForm> */}
    //   </div>
    // </div>

    <div className="relative h-screen flex-col items-center justify-center">
      <div className="flex h-full items-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Choose from the following providers
            </p>

            <Form action={handleSignIn}>
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
