import { Image } from "../ui/image";
import Loader from "../ui/loader";

export default function MessageDisplay() {
  return (
    <div className="w-full min-h-full bg-transparent grid gap-3 pb-4">
      {/* USER INPUT */}
      <div className="w-full max-w-[90%] md:w-max md:max-w-xl h-max p-3 rounded-3xl bg-primary text-primary-foreground justify-self-end"></div>
      {/* AI RESPONSE */}
      <div className="w-full flex items-end gap-2">
        <Image src="/favicon.ico" alt="Tax Yasef" width={32} height={32} />
        <Loader />
        <article className="w-full h-max p-3 rounded-3xl bg-background text-foreground border border-border"></article>
      </div>
    </div>
  );
}
