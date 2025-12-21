import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export default function InfoModal({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About Tax Yasef</DialogTitle>
          <DialogDescription>
            Information about the application will be displayed here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground font-nunito">
            This section will be populated with detailed information about Tax
            Yasef.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
