import { HuaweiHero } from "@/components/sections/community/huawei/huawei-hero";
import { Foundation } from "@/components/sections/community/huawei/foundation";
import { ProfessionalAdvantage } from "@/components/sections/community/huawei/professional-advantage";
import { WhoShouldJoin } from "@/components/sections/community/huawei/who-should-join";
import { SpecializationTracks } from "@/components/sections/community/huawei/specialization-tracks";
import { ApplicationForm } from "@/components/sections/community/huawei/application-form";
import { VideoPanel, CMO_VIDEOS } from "@/components/site/video-panel";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/community/huawei");

export default function HuaweiCommunityPage() {
  return (
    <>
      <HuaweiHero />
      <Foundation />
      <ProfessionalAdvantage />
      <WhoShouldJoin />
      <SpecializationTracks />
      <VideoPanel
        id="cmo-message"
        eyebrow="A Message From Our CMO"
        title={
          <>
            Is the Expervia Network{" "}
            <span className="text-brand-600">Right for You?</span>
          </>
        }
        description="Hear directly from our Chief Marketing Officer on who fits into the Expervia network, how to join, and the benefits waiting for you as a member."
        videoSrc={CMO_VIDEOS.joinNetwork.src}
        poster={CMO_VIDEOS.joinNetwork.poster}
        ariaLabel="Expervia CMO on who should join the network and how"
        tone="white"
      />
      <ApplicationForm />
    </>
  );
}
