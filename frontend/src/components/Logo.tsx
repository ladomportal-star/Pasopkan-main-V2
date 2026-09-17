import React from 'react';

export default function Logo({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Minimal P Logo for Travel */}
      <circle cx="20" cy="20" r="18" className="fill-adv-orange/10" />
      <path 
        d="M14 10v20h4v-8h6c4.4 0 8-3.6 8-8s-3.6-8-8-8h-10zm4 4h6c2.2 0 4 1.8 4 4s-1.8 4-4 4h-6v-8z" 
        fill="currentColor"
      />
    </svg>
  );
}
