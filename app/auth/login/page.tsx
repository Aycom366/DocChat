"use client";

import { login } from "@/actions/auth";
import { CardWrapper } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ILogin, LoginSchema } from "@/schemas/login";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function Login() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ILogin>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: ILogin) {
    startTransition(() => {
      login(data).then((response) => {
        if (response?.error) {
          toast.error(response?.error);
        }
      });
    });
  }

  return (
    <CardWrapper header='Login'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isPending} type='submit' className='w-full'>
            {isPending ? "Please wait..." : "Login"}
          </Button>
        </form>
      </Form>
      <div className='flex flex-row text-sm items-center gap-1'>
        <p>Don&apos;t have an account?</p>
        <Link className='underline font-medium' href='/auth/register'>
          Register
        </Link>
      </div>
    </CardWrapper>
  );
}
