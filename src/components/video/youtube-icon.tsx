import type { SVGProps } from "react";

export interface YouTubeIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
  showRedBadge?: boolean;
}

/**
 * Official YouTube Play Icon.
 * Renders the iconic red curved rectangle with a centered white play triangle.
 */
export function YouTubeIcon({
  className = "h-4 w-4",
  showRedBadge = true,
  ...props
}: YouTubeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        fill={showRedBadge ? "#FF0000" : "currentColor"}
      />
      <polygon points="9.545,8.432 15.818,12 9.545,15.568" fill="#FFFFFF" />
    </svg>
  );
}
