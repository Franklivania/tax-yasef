import { useEffect } from "react";
import { parseMarkdown } from "@/lib/markdown-renderer";
import privacyPolicyMarkdown from "@/lib/docs/privacy.md?raw";

export default function PrivacyPolicy() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.slice(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  return (
    <main className="relative w-full h-screen bg-background overflow-x-hidden fancy-scrollbar">
      <section className="w-full max-w-2xl h-max mx-auto my-20 px-4 md:px-0">
        {/* <h1 className="text-5xl font-bold">Privacy Policy</h1> */}
        <article className="w-full prose prose-sm md:prose-base max-w-none">
          {parseMarkdown(privacyPolicyMarkdown)}
        </article>
      </section>
    </main>
  );
}
