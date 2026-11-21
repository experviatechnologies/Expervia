import { Section, SectionIntro, type Tone } from "@/components/site/ui";

/**
 * Marketing video section in the new look. Native <video> with
 * preload="none", so only the poster downloads until the visitor presses play
 * (keeps idle page views off the video host's bandwidth budget).
 */
export function VideoPanel({
  id,
  eyebrow,
  title,
  description,
  videoSrc,
  poster,
  ariaLabel,
  tone = "lavender",
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  videoSrc: string;
  poster: string;
  ariaLabel: string;
  tone?: Tone;
}) {
  return (
    <Section id={id} labelledBy={`${id}-heading`} tone={tone}>
      <SectionIntro
        id={`${id}-heading`}
        eyebrow={eyebrow}
        title={title}
        intro={description}
        center
        dark={tone === "indigo"}
      />
      <div className="border-brand-100 mx-auto mt-12 max-w-4xl rounded-[2rem] border bg-white p-2 shadow-[0_40px_80px_-40px_rgba(33,0,93,0.6)] md:p-3">
        <video
          className="aspect-video w-full rounded-3xl bg-black"
          controls
          preload="none"
          playsInline
          poster={poster}
          aria-label={ariaLabel}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support embedded video. You can{" "}
          <a href={videoSrc} className="text-brand-700 underline">
            download the video
          </a>{" "}
          instead.
        </video>
      </div>
    </Section>
  );
}

/** Public Supabase Storage URLs + poster paths for the CMO videos. */
export const CMO_VIDEOS = {
  joinNetwork: {
    src: "https://jidirlttkoxjwtfmmfuu.supabase.co/storage/v1/object/public/videos/cmo-join-the-network.mp4",
    poster: "/images/cmo-join-the-network-poster.jpg",
  },
  businessSolutions: {
    src: "https://jidirlttkoxjwtfmmfuu.supabase.co/storage/v1/object/public/videos/cmo-business-solutions.mp4",
    poster: "/images/cmo-business-solutions-poster.jpg",
  },
} as const;
