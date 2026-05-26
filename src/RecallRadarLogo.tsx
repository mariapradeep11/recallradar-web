type RecallRadarLogoProps = {
  compact?: boolean;
  className?: string;
  title?: string;
};

export default function RecallRadarLogo({ compact = false, className = "rr-mark", title }: RecallRadarLogoProps) {
  return (
    <svg className={className} viewBox="0 0 1544 640" fill="none" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <filter id="horizonSoftGlow" x="-20%" y="-120%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="horizonLineGlow" x="-20%" y="-80%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="flareSoftGlow" x="-360%" y="-360%" width="820%" height="820%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter id="letterGlow" x="-16%" y="-30%" width="132%" height="160%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <linearGradient id="horizonArc" x1="206" y1="226" x2="1338" y2="226">
          <stop stopColor="#ff332b" stopOpacity="0" />
          <stop offset=".22" stopColor="#ff332b" stopOpacity=".42" />
          <stop offset=".5" stopColor="#ff554c" />
          <stop offset=".78" stopColor="#ff332b" stopOpacity=".42" />
          <stop offset="1" stopColor="#ff332b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g>
        <path d="M215 270 C460 112 1084 112 1329 270" stroke="#ff211c" strokeWidth="54" strokeLinecap="round" opacity=".11" filter="url(#horizonSoftGlow)" />
        <path d="M230 268 C474 139 1070 139 1314 268" stroke="#ff2a24" strokeWidth="24" strokeLinecap="round" opacity=".16" filter="url(#horizonSoftGlow)" />
        <path d="M238 267 C482 153 1062 153 1306 267" stroke="#ff3a31" strokeWidth="8" strokeLinecap="round" opacity=".42" filter="url(#horizonLineGlow)" />
        <path d="M240 267 C484 158 1060 158 1304 267" stroke="url(#horizonArc)" strokeWidth="4.2" strokeLinecap="round" />
        <path d="M772 160V6" stroke="#ff332b" strokeWidth="6" strokeLinecap="round" opacity=".18" filter="url(#flareSoftGlow)" />
        <path d="M772 160V7" stroke="#f5f7f8" strokeWidth="2.5" strokeLinecap="round" opacity=".9" />
        <path d="M725 160H819" stroke="#ff3b32" strokeWidth="3.2" strokeLinecap="round" opacity=".86" />
        <circle cx="772" cy="160" r="68" fill="#ff2c27" opacity=".22" filter="url(#flareSoftGlow)" />
        <circle cx="772" cy="160" r="26" fill="#ff332b" opacity=".46" filter="url(#flareSoftGlow)" />
        <circle cx="772" cy="160" r="14" fill="#ff453d" />
        <circle cx="772" cy="160" r="5.2" fill="#fff" />
      </g>
      {!compact && (
        <g>
          <text x="76" y="433" fill="#f7f7f4" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="118" fontWeight="200" letterSpacing="54" opacity=".26" filter="url(#letterGlow)">RECALL</text>
          <text x="880" y="433" fill="#ff3b32" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="118" fontWeight="200" letterSpacing="54" opacity=".24" filter="url(#letterGlow)">RADAR</text>
          <text x="76" y="433" fill="#f7f7f4" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="118" fontWeight="200" letterSpacing="54">RECALL</text>
          <text x="880" y="433" fill="#ff3b32" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="118" fontWeight="200" letterSpacing="54">RADAR</text>
          <rect x="687" y="542" width="170" height="8" fill="#d22924" opacity=".34" filter="url(#letterGlow)" />
          <rect x="687" y="542" width="170" height="8" fill="#d22924" />
        </g>
      )}
    </svg>
  );
}
