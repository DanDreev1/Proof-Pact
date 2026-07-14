import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LoginForm />
          <p className="text-center text-sm text-slate-400">
            No account? <Link className="text-white underline" href="/register">Register</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
