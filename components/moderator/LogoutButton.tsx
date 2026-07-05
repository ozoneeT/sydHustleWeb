import { logoutModerator } from "@/lib/moderator/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutModerator}>
      <Button type="submit" variant="secondary" size="sm">
        Log out
      </Button>
    </form>
  );
}
