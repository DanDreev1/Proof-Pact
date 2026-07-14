import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export default async function SettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-slate-400">Settings</p>
        <h1 className="text-2xl font-bold">App settings</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
