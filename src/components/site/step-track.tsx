/**
 * Numbered steps joined by a line (vertical on mobile, horizontal on desktop),
 * from the Join ETEN "How to Join" design.
 */
export function StepTrack({
  steps,
}: {
  steps: readonly { title: string; body: string }[];
}) {
  return (
    <ol className="relative mt-16 grid gap-6 lg:grid-cols-4">
      <span
        aria-hidden
        className="from-brand-300 via-brand-200 absolute top-7 bottom-7 left-[1.75rem] w-px bg-gradient-to-b to-transparent lg:right-[12.5%] lg:bottom-auto lg:left-[12.5%] lg:h-px lg:w-auto lg:bg-gradient-to-r"
      />
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center"
        >
          <span className="font-jakarta bg-brand-700 relative z-10 inline-flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-[0_10px_25px_-8px_rgba(100,38,220,0.7)] ring-8 ring-white">
            <span className="sr-only">Step </span>
            {i + 1}
          </span>
          <div className="pb-2 lg:pt-6">
            <h3 className="font-jakarta text-brand-950 text-lg font-bold">
              {s.title}
            </h3>
            <p className="text-ink/75 mt-2 leading-relaxed">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
