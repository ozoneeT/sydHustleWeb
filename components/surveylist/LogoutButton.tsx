import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action="/surveylist/logout" method="post">
      <Button type="submit" variant="secondary" size="sm">
        Log out
      </Button>
    </form>
  );
}
