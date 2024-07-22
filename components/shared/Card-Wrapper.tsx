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
        <Button asChild className='w-full' variant='outline'>
          <a className='' href='/auth/login/github'>
            <Github className='mr-2 h-4 w-4' />
            Sign in with GitHub
          </a>
        </Button>

        <Button asChild className='w-full' variant='outline'>
          <a className='' href='/auth/login/google'>
            <ChromeIcon className='mr-2 h-4 w-4' />
            Sign in with Google
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
