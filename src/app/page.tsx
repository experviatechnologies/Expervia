import { Hero } from "@/components/sections/hero";
import { TrustBar } from "@/components/sections/trust-bar";
import { WhoWeAre } from "@/components/sections/who-we-are";
import { Solutions } from "@/components/sections/solutions";
import { Industries } from "@/components/sections/industries";
import { WhyExpervia } from "@/components/sections/why-expervia";
import { Community } from "@/components/sections/community";
import { FinalCta } from "@/components/sections/final-cta";
import { VideoFeature, CMO_VIDEOS } from "@/components/shared/video-feature";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <WhoWeAre />
      <VideoFeature
        id="how-we-help"
        label="How We Help"
        title={
          <>
            Solving Real Problems for{" "}
            <span className="text-primary">African Enterprises</span>
          </>
        }
        description="Our Chief Marketing Officer walks through how Expervia partners with businesses to deliver AI, cloud, and security solutions that move the needle."
        videoSrc={CMO_VIDEOS.businessSolutions.src}
        poster={CMO_VIDEOS.businessSolutions.poster}
        ariaLabel="Expervia CMO on how Expervia solves business challenges"
      />
      <Solutions />
      <Industries />
      <WhyExpervia />
      <Community />
      <FinalCta />
    </>
  );
}
