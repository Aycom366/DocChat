import { validateRequest } from "@/auth";
import { Container } from "@/components/shared";
import { Toaster } from "@/components/ui/sonner";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session } = await validateRequest();
  if (session) redirect(DEFAULT_LOGIN_REDIRECT);

  return (
    <Container
      as='main'
      className='flex items-center min-h-screen justify-center '
    >
      {children}
      <Toaster />
    </Container>
  );
}
