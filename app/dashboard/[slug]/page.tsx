import { validateRequest } from "@/auth";
import { PdfRenderer } from "@/components/dashboard/PdfRenderer";
import { ChatWrapper } from "@/components/dashboard/chat/ChatWrapper";
import { getFile } from "@/lib/file";
import { notFound, redirect } from "next/navigation";

interface IProps {
  params: {
    slug: string;
  };
}

const Page = async ({ params }: IProps) => {
  const { slug } = params;
  const session = await validateRequest();
  if (!session?.user) {
    return redirect("/auth/login");
  }

  const file = await getFile(session.user.id!, slug);
  if (!file) return notFound();

  return (
    <main className='flex-1 justify-between flex flex-col h-[calc(100dvh-3.5rem)]'>
      <section className='mx-auto w-full max-w-8xl grow lg:flex xl:px-2'>
        {/* Left sidebar & main wrapper */}
        <section className='flex-1 xl:flex'>
          <div className='px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6'>
            <PdfRenderer url={file.url} />
          </div>
        </section>

        <section className='shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0'>
          <ChatWrapper isSubscribed fileId={file.id} />
        </section>
      </section>
    </main>
  );
};
export default Page;
