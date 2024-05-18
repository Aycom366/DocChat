/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import Dropzone from "react-dropzone";
import { Cloud, File, Loader2 } from "lucide-react";
import { Progress } from "../ui/progress";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";

const UploadDropZone: React.FC<{ isSubscribed: boolean; userId: string }> = ({
  isSubscribed,
  userId,
}) => {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadThingKey, setUploadThingKey] = useState<string | undefined>(
    undefined
  );

  const { startUpload } = useUploadThing(
    isSubscribed ? "proPlanPdfUploader" : "freePlanPdfUploader"
  );

  useEffect(() => {
    if (uploadThingKey) {
      getRecursionFile();
    }

    async function getRecursionFile() {
      const res = await fetch(
        `/api/file?userId=${userId}&key=${uploadThingKey}`,
        {
          method: "GET",
        }
      );
      if (res.status === 400) return toast.error("Invalid request");
      if (res.status === 404) return getRecursionFile();
      if (res.status === 200) {
        const file = await res.json();
        router.push(`/dashboard/${file.id}`);
      }
    }
  }, [uploadThingKey, userId]);

  /**
   *
   * @returns {number} interval
   * @description Start a simulated progress bar
   */
  const startSimulatedProgress = () => {
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 5;
      });
    }, 500);

    return interval;
  };

  return (
    <Dropzone
      onDrop={async (acceptedFile) => {
        setIsUploading(true);
        const progressInterval = startSimulatedProgress();

        //check to see if the file has not been uploaded already by the user
        const fileName = acceptedFile[0].name;
        const checkFile = await fetch(
          `/api/file?userId=${userId}&name=${fileName}`,
          {
            method: "GET",
          }
        );
        if (checkFile.status === 200) {
          const file = await checkFile.json();
          clearInterval(progressInterval);
          setIsUploading(false);
          router.push(`/dashboard/${file.id}`);
          return;
        }

        //Immediately make a request to the server to start the upload
        const res = await startUpload(acceptedFile);

        //If the request fails, show an error message
        if (!res) {
          setIsUploading(false);
          return toast.error("Error uploading file");
        }

        //If the request is successful, get the response
        const [fileResponse] = res;

        const key = fileResponse?.key;
        if (!key) return toast("Something went wrong getting upload key");

        clearInterval(progressInterval);
        setIsUploading(false);

        /**
         * @description Poll the server to check if the pdf is loaded successfully
         * after the upload is complete
         * redirect to the pdf page
         */
        setUploadThingKey(key);
      }}
      multiple={false}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          {...getRootProps()}
          className='border h-64 m-4 border-dashed border-gray-300 rounded-lg'
        >
          <div className='flex items-center justify-center h-full w-full'>
            <label
              htmlFor='dropzone-file'
              className='flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'
            >
              <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                <Cloud className='h-6 w-6 text-zinc-500 mb-2' />
                <p className='mb-2 text-sm text-zinc-700'>
                  <span className='font-semibold'>Click to upload</span> or drag
                  and drop
                </p>
                <p className='text-xs text-zinc-500'>
                  PDF (up to {isSubscribed ? "16" : "4"}MB)
                </p>
              </div>

              {acceptedFiles && acceptedFiles[0] ? (
                <div className='max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200'>
                  <div className='px-3 py-2 h-full grid place-items-center'>
                    <File className='h-4 w-4 text-blue-500' />
                  </div>
                  <div className='px-3 py-2 h-full text-sm truncate'>
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}

              {isUploading && (
                <div className='w-full mt-4 max-w-xs mx-auto'>
                  <Progress
                    color={uploadProgress === 100 ? "green" : ""}
                    value={uploadProgress}
                    className='h-1 w-full bg-zinc-200'
                  />
                  {uploadProgress === 100 ? (
                    <div className='flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2'>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      Redirecting...
                    </div>
                  ) : null}
                </div>
              )}
            </label>
          </div>
          <input
            {...getInputProps()}
            type='file'
            aria-hidden='true'
            id='dropzone-file'
            className='hidden'
          />
        </div>
      )}
    </Dropzone>
  );
};

export const UploadButton: React.FC<{
  userId: string;
  isSubscribed: boolean;
}> = ({ userId, isSubscribed }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v);
        }
      }}
    >
      <DialogTrigger onClick={() => setIsOpen(true)} asChild>
        <Button>Upload PDF</Button>
      </DialogTrigger>

      <DialogContent>
        <UploadDropZone userId={userId} isSubscribed={isSubscribed} />
      </DialogContent>
    </Dialog>
  );
};
