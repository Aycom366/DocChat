import { auth } from "@/auth";
import { Dashboard } from "@/components/dashboard";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (!session?.user) {
    return redirect("/auth/login");
  }

  return <Dashboard user={session?.user} />;
}
