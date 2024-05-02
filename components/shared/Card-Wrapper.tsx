"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import { ChromeIcon, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

interface IProps {
  children: React.ReactNode;
  header: string;
  headerDescription?: string;
  cardContentClassNames?: string;
}

export const CardWrapper = ({
  children,
  header,
  cardContentClassNames,
  headerDescription,
}: IProps) => {
  async function providerLogin(provider: "github" | "google") {
    signIn(provider, {
      callbackUrl: DEFAULT_LOGIN_REDIRECT,
    });
  }

  return (
    <Card className='bg-transparent w-full mx-auto max-w-[400px]'>
      <CardHeader>
        <CardTitle>{header}</CardTitle>
        {headerDescription && (
          <CardDescription>{headerDescription}</CardDescription>
        )}
      </CardHeader>
      <CardContent
        className={cn("space-y-2 bg-transparent", cardContentClassNames)}
      >
        {children}
      </CardContent>
      <CardFooter className='gap-2 flex flex-col'>
        <Button
          onClick={() => providerLogin("github")}
          className='w-full'
          variant='outline'
        >
          <Github className='mr-2 h-4 w-4' />
          Sign in with GitHub
        </Button>
        <Button
          onClick={() => providerLogin("google")}
          className='w-full'
          variant='outline'
        >
          <ChromeIcon className='mr-2 h-4 w-4' />
          Sign in with Google
        </Button>
      </CardFooter>
    </Card>
  );
};
