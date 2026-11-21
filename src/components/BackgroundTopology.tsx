interface BackgroundTopologyProps {
  subtle?: boolean;
}

export function BackgroundTopology({subtle = false}: BackgroundTopologyProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Clean airy light-mode backdrop */}
      <div
        className={`absolute inset-0 dark:hidden ${
          subtle
            ? 'bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC] to-[#F1F5F9]'
            : 'bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.06),transparent_60%),linear-gradient(to_bottom,#F8FAFC,#F1F5F9)]'
        }`}
      />

      {/* Dark-mode glowing candlestick backdrop */}
      <img
        src="/assets/aistudio/image_2f4bf932.png"
        alt=""
        decoding="async"
        className={`hidden dark:block h-full w-full object-cover object-center transition-opacity duration-500 ${
          subtle ? 'opacity-[0.22]' : 'opacity-[0.46]'
        }`}
      />

      {/* Dark-mode atmospheric scrim preserving typography contrast */}
      <div
        className={`hidden dark:block absolute inset-0 ${
          subtle
            ? 'bg-gradient-to-b from-[#070B14]/82 via-[#070B14]/74 to-[#070B14]/88'
            : 'bg-gradient-to-b from-[#070B14]/50 via-[#070B14]/35 to-[#070B14]/80'
        }`}
      />
    </div>
  );
}
