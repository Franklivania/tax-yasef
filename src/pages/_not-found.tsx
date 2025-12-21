import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };
  return (
    <main className="relative w-full min-h-screen bg-background overflow-hidden">
      <section className="w-full max-w-2xl px-4 md:px-8 lg:pd-0 h-max flex flex-col gap-6 items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute">
        <Image
          src="/404.webp"
          alt="404"
          className="w-auto h-auto object-cover"
        />
        <section className="space-y-2 text-center my-3">
          <h1 className="font-nunito text-2xl md:text-4xl font-bold">
            E be like say you don miss road 👀
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Oya, hanlele, make we return
          </p>
        </section>

        <Button
          variant="secondary"
          onClick={handleGoBack}
          className="py-8 px-12!"
        >
          <ArrowLeft className="size-6" />
          <span className="text-base md:text-lg font-nunito font-medium">
            Go back
          </span>
        </Button>
      </section>
    </main>
  );
}
