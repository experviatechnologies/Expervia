import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

type VideoFeatureProps = {
  /** Optional anchor id for in-page navigation. */
  id?: string;
  /** Small uppercase eyebrow above the heading. */
  label: string;
  /** Section heading. */
  title: React.ReactNode;
  /** Optional supporting copy under the heading. */
  description?: string;
  /** Public URL of the MP4 (e.g. a Supabase Storage public URL). */
  videoSrc: string;
  /** Poster image shown before playback — the only asset that loads at rest. */
  poster: string;
  /** Accessible label for the video player. */
  ariaLabel: string;
  className?: string;
};

/**
 * Centered marketing video section. Uses a native <video> with `preload="none"`
 * so nothing but the poster downloads until the visitor presses play — this
 * keeps idle page views from consuming the video host's bandwidth budget.
 */
export function VideoFeature({
  id,
  label,
  title,
  description,
  videoSrc,
  poster,
  ariaLabel,
  className,
}: VideoFeatureProps) {
  return (
    <section id={id} className={cn("bg-surface pt-12 pb-section", className)}>
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <SectionLabel className="mb-4">{label}</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg md:text-display-lg mb-4 font-bold">
            {title}
          </h2>
          {description && (
            <p className="text-body-lg text-on-surface-variant mx-auto mb-10 max-w-2xl">
              {description}
            </p>
          )}
          <div className="glass-panel relative overflow-hidden rounded-3xl p-2 shadow-2xl md:p-3">
            <video
              className="aspect-video w-full rounded-2xl"
              controls
              preload="none"
              playsInline
              poster={poster}
              aria-label={ariaLabel}
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support embedded video. You can{" "}
              <a href={videoSrc} className="text-primary underline">
                download the video
              </a>{" "}
              instead.
            </video>
          </div>
        </div>
      </Container>
    </section>
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
