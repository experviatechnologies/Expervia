/**
 * The constellation "network" illustration from the Join ETEN design. Used in
 * the hero (full) and as faint decoration in dark CTA panels. Gradient ids are
 * prefixed so several copies can sit on one page.
 */
export function NetworkGraphic({
  idPrefix = "net",
  className,
}: {
  idPrefix?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 520 470"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${idPrefix}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C9B5FF" stopOpacity="0.9"></stop>
          <stop offset="100%" stopColor="#6426DC" stopOpacity="0"></stop>
        </radialGradient>
        <linearGradient id={`${idPrefix}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B89BFF" stopOpacity="0.55"></stop>
          <stop offset="100%" stopColor="#7C4DFF" stopOpacity="0.15"></stop>
        </linearGradient>
      </defs>
      <g stroke={`url(#${idPrefix}-edge)`} strokeWidth="1.25">
        <line x1="60" y1="70" x2="170" y2="40"></line>
        <line x1="170" y1="40" x2="280" y2="95"></line>
        <line x1="280" y1="95" x2="400" y2="50"></line>
        <line x1="400" y1="50" x2="470" y2="150"></line>
        <line x1="60" y1="70" x2="90" y2="190"></line>
        <line x1="170" y1="40" x2="210" y2="175"></line>
        <line x1="280" y1="95" x2="210" y2="175"></line>
        <line x1="280" y1="95" x2="340" y2="215"></line>
        <line x1="470" y1="150" x2="340" y2="215"></line>
        <line x1="470" y1="150" x2="450" y2="270"></line>
        <line x1="90" y1="190" x2="210" y2="175"></line>
        <line x1="210" y1="175" x2="340" y2="215"></line>
        <line x1="340" y1="215" x2="450" y2="270"></line>
        <line x1="90" y1="190" x2="130" y2="300"></line>
        <line x1="210" y1="175" x2="250" y2="320"></line>
        <line x1="130" y1="300" x2="250" y2="320"></line>
        <line x1="250" y1="320" x2="370" y2="360"></line>
        <line x1="340" y1="215" x2="370" y2="360"></line>
        <line x1="450" y1="270" x2="370" y2="360"></line>
        <line x1="130" y1="300" x2="60" y2="400"></line>
        <line x1="60" y1="400" x2="200" y2="430"></line>
        <line x1="250" y1="320" x2="200" y2="430"></line>
        <line x1="200" y1="430" x2="370" y2="360"></line>
        <line x1="370" y1="360" x2="470" y2="420"></line>
        <line x1="450" y1="270" x2="470" y2="420"></line>
        <line x1="210" y1="175" x2="130" y2="300"></line>
      </g>
      <g
        className="motion-safe:animate-[pulse-node_5s_ease-in-out_infinite]"
        style={{ animationDelay: "0.0s" }}
      >
        <circle
          cx="60"
          cy="70"
          r="16"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="60" cy="70" r="5" fill="#D9CCFF"></circle>
      </g>
      <g style={{ animationDelay: "0.4s" }}>
        <circle
          cx="170"
          cy="40"
          r="12.8"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="170" cy="40" r="4" fill="#D9CCFF"></circle>
      </g>
      <g style={{ animationDelay: "0.8s" }}>
        <circle
          cx="280"
          cy="95"
          r="22.400000000000002"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="280" cy="95" r="7" fill="#D9CCFF"></circle>
      </g>
      <g
        className="motion-safe:animate-[pulse-node_5s_ease-in-out_infinite]"
        style={{ animationDelay: "1.2s" }}
      >
        <circle
          cx="400"
          cy="50"
          r="12.8"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="400" cy="50" r="4" fill="#D9CCFF"></circle>
      </g>
      <g style={{ animationDelay: "1.6s" }}>
        <circle
          cx="470"
          cy="150"
          r="16"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="470" cy="150" r="5" fill="#D9CCFF"></circle>
      </g>
      <g style={{ animationDelay: "2.0s" }}>
        <circle
          cx="90"
          cy="190"
          r="12.8"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="90" cy="190" r="4" fill="#D9CCFF"></circle>
      </g>
      <g
        className="motion-safe:animate-[pulse-node_5s_ease-in-out_infinite]"
        style={{ animationDelay: "2.4s" }}
      >
        <circle
          cx="210"
          cy="175"
          r="28.8"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="210" cy="175" r="9" fill="#FFFFFF"></circle>
      </g>
      <g style={{ animationDelay: "2.8s" }}>
        <circle
          cx="340"
          cy="215"
          r="16"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="340" cy="215" r="5" fill="#D9CCFF"></circle>
      </g>
      <g style={{ animationDelay: "3.2s" }}>
        <circle
          cx="450"
          cy="270"
          r="19.200000000000003"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="450" cy="270" r="6" fill="#D9CCFF"></circle>
      </g>
      <g
        className="motion-safe:animate-[pulse-node_5s_ease-in-out_infinite]"
        style={{ animationDelay: "3.6s" }}
      >
        <circle
          cx="130"
          cy="300"
          r="19.200000000000003"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="130" cy="300" r="6" fill="#D9CCFF"></circle>
      </g>
      <g style={{ animationDelay: "4.0s" }}>
        <circle
          cx="250"
          cy="320"
          r="12.8"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="250" cy="320" r="4" fill="#D9CCFF"></circle>
      </g>
      <g style={{ animationDelay: "4.4s" }}>
        <circle
          cx="370"
          cy="360"
          r="16"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="370" cy="360" r="5" fill="#D9CCFF"></circle>
      </g>
      <g
        className="motion-safe:animate-[pulse-node_5s_ease-in-out_infinite]"
        style={{ animationDelay: "4.8s" }}
      >
        <circle
          cx="60"
          cy="400"
          r="12.8"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="60" cy="400" r="4" fill="#D9CCFF"></circle>
      </g>
      <g style={{ animationDelay: "5.2s" }}>
        <circle
          cx="200"
          cy="430"
          r="16"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="200" cy="430" r="5" fill="#D9CCFF"></circle>
      </g>
      <g style={{ animationDelay: "5.6s" }}>
        <circle
          cx="470"
          cy="420"
          r="12.8"
          fill={`url(#${idPrefix}-glow)`}
          opacity="0.5"
        ></circle>
        <circle cx="470" cy="420" r="4" fill="#D9CCFF"></circle>
      </g>
    </svg>
  );
}
