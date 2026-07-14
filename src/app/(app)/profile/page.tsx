import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { NotificationPermissionButton } from "@/features/notifications/components/NotificationPermissionButton";
import { ProfileForm } from "@/features/profiles/components/ProfileForm";
import { getProfile } from "@/features/profiles/queries/get-profile";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-slate-400">Profile</p>
        <h1 className="text-2xl font-bold">{profile?.display_name ?? "Your profile"}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <p>{user.email}</p>
          <p className="text-slate-500">Profile ID: {user.id}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm displayName={profile?.display_name ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPermissionButton />
        </CardContent>
      </Card>

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
