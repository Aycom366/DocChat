import { Container } from "@/components/shared";
import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
