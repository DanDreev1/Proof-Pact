import { Button } from "@/components/ui/Button";
import { logoutAction } from "../actions/logout";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button className="w-full" variant="secondary">
        Log out
      </Button>
    </form>
  );
}
