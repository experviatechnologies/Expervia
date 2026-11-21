import { MicrosoftHero } from "@/components/sections/community/microsoft/microsoft-hero";
import { CommunityStats } from "@/components/sections/community/microsoft/community-stats";
import { WhatIsEmpc } from "@/components/sections/community/microsoft/what-is-empc";
import { WhoShouldJoin } from "@/components/sections/community/microsoft/who-should-join";
import { ProfessionalAdvantages } from "@/components/sections/community/microsoft/professional-advantages";
import { FocusInitiatives } from "@/components/sections/community/microsoft/focus-initiatives";
import { CommunityPrinciples } from "@/components/sections/community/microsoft/community-principles";
import { ApplicationForm } from "@/components/sections/community/microsoft/application-form";
import { VideoPanel, CMO_VIDEOS } from "@/components/site/video-panel";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/community/microsoft");

export default function MicrosoftCommunityPage() {
  return (
    <>
      <MicrosoftHero />
      <CommunityStats />
      <WhatIsEmpc />
      <WhoShouldJoin />
      <ProfessionalAdvantages />
      <FocusInitiatives />
      <CommunityPrinciples />
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
