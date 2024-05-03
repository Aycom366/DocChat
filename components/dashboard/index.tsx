import { User } from "next-auth";
import { UploadButton } from "../shared";
import { Files } from "./Files";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";

interface IProps {
  user: User;
}

export const Dashboard = async ({ user }: IProps) => {
  return (
    <main className='mx-auto max-w-7xl px-4 md:p-10'>
      <header className='mt-8 flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0'>
        <h1 className='mb-3 font-bold text-5xl text-gray-900'>My Files</h1>
        <UploadButton userId={user.id!} />
      </header>
      <Suspense fallback={<Skeleton height={100} className='my-2' count={3} />}>
        <Files userId={user.id!} />
      </Suspense>
    </main>
  );
};
