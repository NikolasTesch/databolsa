import { cn } from '@/components/ui/cn';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function BrandLogo({ className, showText = true, textClassName }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* Brand Icon SVG with cropped A4 whitespace via tight viewBox */}
      <svg
        viewBox="600 4000 25400 13200"
        className={cn('h-7 w-auto flex-shrink-0', className)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fill="#1E3466"
          d="M8347.93 17151.47l-7656.2 0c-61.94,-1915.88 266.43,-3748.94 1299.48,-5432.54l6949.75 3425.46c-374.9,559.36 -593.67,1232.15 -593.67,1956.11 0,17.04 0.41,33.99 0.64,50.97z"
        />
        <path
          fill="#2756A4"
          d="M8940.96 15144.4l-5905.33 -2910.68c870.08,-1424.42 2014.18,-2573.24 3466.95,-3414.98l3722 5169.26c-514.02,273.43 -961.09,675.16 -1283.62,1156.4z"
        />
        <path
          fill="#4EC3E4"
          d="M10224.58 13988l-3858.25 -5358.49c2282.21,-1153.9 4806.52,-1616.45 7724.73,-1005.99l-1140.45 6129.79c-341.85,-110.77 -706.52,-170.86 -1085.27,-170.86 -592.61,0 -1150.85,146.75 -1640.76,405.55z"
        />
        <path
          fill="#87C6E9"
          d="M13951.27 14267.52l6990.36 -7662.06c-1875.47,-1521.15 -3957.55,-2364.22 -6150.46,-2742.67l-1841.22 9890.31c362.9,117.57 700.73,292.85 1001.32,514.42z"
        />
        <path
          fill="#C0E4F0"
          d="M13951.27 14267.52l9322.95 -10218.81c2709.99,2028.64 4517.23,4723.6 5740.21,7849.81l-13774.41 4205.56c-219.62,-744.76 -678.89,-1386.75 -1288.75,-1836.56z"
        />
      </svg>

      {/* Brand Text */}
      {showText && (
        <span
          className={cn(
            'font-sans text-xl font-bold tracking-tight text-primary',
            textClassName
          )}
        >
          databolsa
        </span>
      )}
    </div>
  );
}
