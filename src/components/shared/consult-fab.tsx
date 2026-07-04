import { MessageCircle } from "lucide-react";

export function ConsultFab() {
  return (
    <div className="fixed right-6 bottom-6 z-50 md:right-10 md:bottom-10">
      <a
        href="https://wa.me/2349072241432"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="group bg-brand relative flex size-16 items-center justify-center rounded-full text-white shadow-2xl transition-transform active:scale-90"
      >
        <MessageCircle className="size-6" />
        <span className="bg-surface-container-high text-on-surface absolute right-full mr-4 hidden rounded-lg border border-white/10 px-3 py-1 text-sm font-bold whitespace-nowrap opacity-0 shadow-xl transition-opacity group-hover:opacity-100 md:block">
          Chat with us on WhatsApp
        </span>
      </a>
    </div>
  );
}
