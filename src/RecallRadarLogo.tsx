type RecallRadarLogoProps = {
  compact?: boolean;
  className?: string;
  title?: string;
  idPrefix?: string;
};

export default function RecallRadarLogo({ compact = false, className = "rr-mark", title, idPrefix = "rr" }: RecallRadarLogoProps) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <svg className={className} viewBox="0 0 1544 640" fill="none" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <filter id={id("horizonSoftGlow")} x="-20%" y="-120%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id={id("horizonLineGlow")} x="-20%" y="-80%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id={id("flareSoftGlow")} x="-360%" y="-360%" width="820%" height="820%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter id={id("letterGlow")} x="-16%" y="-30%" width="132%" height="160%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <linearGradient id={id("horizonArc")} x1="206" y1="226" x2="1338" y2="226">
          <stop stopColor="#c65b45" stopOpacity="0" />
          <stop offset=".22" stopColor="#c65b45" stopOpacity=".42" />
          <stop offset=".5" stopColor="#d97a62" />
          <stop offset=".78" stopColor="#c65b45" stopOpacity=".42" />
          <stop offset="1" stopColor="#c65b45" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g>
        <path d="M215 270 C460 112 1084 112 1329 270" stroke="#c65b45" strokeWidth="54" strokeLinecap="round" opacity=".11" filter={`url(#${id("horizonSoftGlow")})`} />
        <path d="M230 268 C474 139 1070 139 1314 268" stroke="#c65b45" strokeWidth="24" strokeLinecap="round" opacity=".16" filter={`url(#${id("horizonSoftGlow")})`} />
        <path d="M238 267 C482 153 1062 153 1306 267" stroke="#c65b45" strokeWidth="8" strokeLinecap="round" opacity=".42" filter={`url(#${id("horizonLineGlow")})`} />
        <path d="M240 267 C484 158 1060 158 1304 267" stroke={`url(#${id("horizonArc")})`} strokeWidth="4.2" strokeLinecap="round" />
        <path d="M772 160V6" stroke="#c65b45" strokeWidth="6" strokeLinecap="round" opacity=".18" filter={`url(#${id("flareSoftGlow")})`} />
        <path d="M772 160V7" stroke="#f7f3ee" strokeWidth="2.5" strokeLinecap="round" opacity=".9" />
        <path d="M725 160H819" stroke="#c65b45" strokeWidth="3.2" strokeLinecap="round" opacity=".86" />
        <circle cx="772" cy="160" r="68" fill="#c65b45" opacity=".22" filter={`url(#${id("flareSoftGlow")})`} />
        <circle cx="772" cy="160" r="26" fill="#c65b45" opacity=".46" filter={`url(#${id("flareSoftGlow")})`} />
        <circle cx="772" cy="160" r="14" fill="#e4a396" />
        <circle cx="772" cy="160" r="5.2" fill="#fff" />
      </g>
      {!compact && (
        <g>
          <text x="76" y="433" fill="#f7f3ee" fontFamily="'Josefin Sans', 'Futura', system-ui, sans-serif" fontSize="118" fontWeight="200" letterSpacing="54" opacity=".26" filter={`url(#${id("letterGlow")})`}>RECALL</text>
          <text x="880" y="433" fill="#c65b45" fontFamily="'Josefin Sans', 'Futura', system-ui, sans-serif" fontSize="118" fontWeight="200" letterSpacing="54" opacity=".24" filter={`url(#${id("letterGlow")})`}>RADAR</text>
          <text x="76" y="433" fill="#f7f3ee" fontFamily="'Josefin Sans', 'Futura', system-ui, sans-serif" fontSize="118" fontWeight="200" letterSpacing="54">RECALL</text>
          <text x="880" y="433" fill="#c65b45" fontFamily="'Josefin Sans', 'Futura', system-ui, sans-serif" fontSize="118" fontWeight="200" letterSpacing="54">RADAR</text>
          <rect x="687" y="542" width="170" height="8" fill="#a8462f" opacity=".34" filter={`url(#${id("letterGlow")})`} />
          <rect x="687" y="542" width="170" height="8" fill="#a8462f" />
        </g>
      )}
    </svg>
  );
}
