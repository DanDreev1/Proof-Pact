import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RegisterForm />
          <p className="text-center text-sm text-slate-400">
            Already registered? <Link className="text-white underline" href="/login">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
