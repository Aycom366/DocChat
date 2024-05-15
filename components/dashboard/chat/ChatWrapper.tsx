"use client";
import { useEffect, useState } from "react";
import { ChatInput } from "./ChatInput";
import { Messages } from "./Messages";
import { ChevronLeft, Loader2, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ChatProvider } from "./ChatContext";

export const ChatWrapper: React.FC<{
  fileId: string;
  isSubscribed: boolean;
}> = ({ fileId, isSubscribed }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [fileStatus, setFileStatus] = useState<
    undefined | "PROCESSING" | "FAILED"
  >();

  /**
   * We wanna get the file status here
   * Therefore we poll the server until we get the status
   */
  useEffect(() => {
    getFileStatusUpload();

    async function getFileStatusUpload() {
      const res = await fetch(`/api/file/file-status?fileId=${fileId}`, {
        method: "GET",
      });
      if (res.ok) {
        const { status } = await res.json();
        setFileStatus(status);
        if (status === "FAILED" || status === "SUCCESS") {
          setIsLoading(false);
        } else {
          getFileStatusUpload();
        }
      }
    }
  }, [fileId]);

  if (isLoading)
    return (
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2'>
            <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
            <h3 className='font-semibold text-xl'>Loading...</h3>
            <p className='text-zinc-500 text-sm'>
              We&apos;re preparing your PDF.
            </p>
          </div>
        </div>
        <ChatInput isDisabled />
      </div>
    );

  if (fileStatus === "PROCESSING")
    return (
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2'>
            <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
            <h3 className='font-semibold text-xl'>Processing PDF...</h3>
            <p className='text-zinc-500 text-sm'>This won&apos;t take long.</p>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    );

  if (fileStatus === "FAILED")
    return (
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2'>
            <XCircle className='h-8 w-8 text-red-500' />
            <h3 className='font-semibold text-xl'>Too many pages in PDF</h3>
            {/* <p className='text-zinc-500 text-sm'>
              Your{" "}
              <span className='font-medium'>
                {isSubscribed ? "Pro" : "Free"}
              </span>{" "}
              plan supports up to{" "}
              {isSubscribed
                ? PLANS.find((p) => p.name === "Pro")?.pagesPerPdf
                : PLANS.find((p) => p.name === "Free")?.pagesPerPdf}{" "}
              pages per PDF.
            </p> */}
            <Link
              href='/dashboard'
              className={buttonVariants({
                variant: "secondary",
                className: "mt-4",
              })}
            >
              <ChevronLeft className='h-3 w-3 mr-1.5' />
              Back
            </Link>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    );

  return (
    <ChatProvider fileId={fileId}>
      <section className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 justify-between flex flex-col mb-28'>
          <Messages fileId={fileId} />
        </div>

        <ChatInput />
      </section>
    </ChatProvider>
  );
};
