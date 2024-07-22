import { validateRequest } from "@/auth";
import { Dashboard } from "@/components/dashboard";
import { redirect } from "next/navigation";

export default async function Page() {
  const { user } = await validateRequest();
  if (!user) {
    return redirect("/auth/login");
  }

  return <Dashboard user={user} />;
}
