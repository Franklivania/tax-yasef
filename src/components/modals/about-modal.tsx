import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export default function AboutModal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About</DialogTitle>
          <DialogDescription>
            Tax Yasef is a Nigerian tax assistant with a built-in calculator.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-2">
          <p className="text-sm text-muted-foreground font-nunito">
            Use the calculator for quick estimates and the chat to ask questions
            about Nigerian tax rules and concepts.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
