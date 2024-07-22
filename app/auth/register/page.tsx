"use client";

import { register } from "@/actions/auth";
import { CardWrapper } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { IRegister, RegisterSchema } from "@/schemas/register";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";

export default function Register() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<IRegister>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: IRegister) {
    startTransition(() => {
      register(data).then((response) => {
        if (response?.error) {
          return toast.error(response.error);
        }
      });
    });
  }

  return (
    <CardWrapper header='Register'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            {isPending ? "Please wait..." : "Register"}
          </Button>
        </form>
      </Form>

      <div className='flex text-sm flex-row items-center gap-1'>
        <p>Have an account?</p>
        <Link className='underline font-medium' href='/auth/login'>
          Log In
        </Link>
      </div>
    </CardWrapper>
  );
}
