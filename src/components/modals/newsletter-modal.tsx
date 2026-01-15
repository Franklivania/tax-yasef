import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function NewsletterModal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Newsletter</DialogTitle>
          <DialogDescription>
            Get product updates, tax tips, and new features in your inbox.
          </DialogDescription>
        </DialogHeader>
        <form className="pt-2 space-y-3">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="Email address"
          />
          <Button type="button" className="w-full">
            Subscribe
          </Button>
          <p className="text-xs text-muted-foreground font-nunito">
            By subscribing, you agree to receive emails from Tax Yasef.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
