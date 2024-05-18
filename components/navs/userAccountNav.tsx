import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "../shared/Icons";
import { signOut } from "@/auth";
import { Gem } from "lucide-react";
import { getUserSubscriptionPlan } from "@/actions/stripe";

interface UserAccountNavProps {
  email: string | undefined;
  name: string;
  imageUrl: string;
}

const UserAccountNav = async ({
  email,
  imageUrl,
  name,
}: UserAccountNavProps) => {
  const subscriptionPlan = await getUserSubscriptionPlan();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className='overflow-visible'>
        <Button className='rounded-full h-8 w-8 aspect-square bg-slate-400'>
          <Avatar className='relative w-8 h-8'>
            {imageUrl ? (
              <div className='relative aspect-square h-full w-full'>
                <Image
                  fill
                  src={imageUrl}
                  alt='profile picture'
                  referrerPolicy='no-referrer'
                />
              </div>
            ) : (
              <AvatarFallback>
                <span className='sr-only'>{name}</span>
                <Icons.user className='h-4 w-4 text-zinc-900' />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='bg-white' align='end'>
        <div className='flex items-center justify-start gap-2 p-2'>
          <div className='flex flex-col space-y-0.5 leading-none'>
            {name && <p className='font-medium text-sm text-black'>{name}</p>}
            {email && (
              <p className='w-[200px] truncate text-xs text-zinc-700'>
                {email}
              </p>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href='/dashboard'>Dashboard</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          {subscriptionPlan?.isSubscribed ? (
            <Link href='/dashboard/billing'>Manage Subscription</Link>
          ) : (
            <Link href='/pricing'>
              Upgrade <Gem className='text-blue-600 h-4 w-4 ml-1.5' />
            </Link>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className='cursor-pointer'>
          <form
            className='w-full'
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <Button
              type='submit'
              variant='ghost'
              className='px-1 justify-start  w-full h-5'
            >
              Log out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountNav;
