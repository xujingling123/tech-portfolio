type SiteLogoProps = {
  className?: string;
  /** 图标像素尺寸（宽高相等） */
  size?: number;
};

/** 品牌小猫图标，在 logo-badge 渐变底上使用 currentColor */
export function SiteLogo({ className, size = 22 }: SiteLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <g fill="currentColor">
        <path d="M8 14.5 6.2 6.5 12.2 12.2 10.5 14.2Z" />
        <path d="M24 14.5 25.8 6.5 19.8 12.2 21.5 14.2Z" />
        <ellipse cx="16" cy="19.5" rx="9" ry="8" />
        <path d="M16 20.8 14.7 22.5h2.6L16 20.8Z" opacity="0.9" />
      </g>
      <circle cx="12.5" cy="18.2" r="1.6" className="logo-cat-eye" />
      <circle cx="19.5" cy="18.2" r="1.6" className="logo-cat-eye" />
    </svg>
  );
}

type SiteLogoBadgeProps = {
  /** sm：页脚；md：顶栏；lg：关于页 */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const badgeSizes = {
  sm: { box: "logo-badge logo-badge--sm", icon: 16 },
  md: { box: "logo-badge", icon: 22 },
  lg: { box: "logo-badge logo-badge--lg", icon: 36 },
} as const;

export function SiteLogoBadge({ size = "md", className }: SiteLogoBadgeProps) {
  const { box, icon } = badgeSizes[size];
  return (
    <span className={className ? `${box} ${className}` : box}>
      <SiteLogo size={icon} className="logo-cat-icon" />
    </span>
  );
}
