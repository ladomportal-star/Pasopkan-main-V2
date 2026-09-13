const fs = require('fs');
let content = fs.readFileSync('Frontend/src/components/LandscapeEventCard.tsx', 'utf-8');

const regex = /      \{\/\* Visual Header \*\/\}\n      <div className="relative aspect-\[4\/5\] overflow-hidden bg-gray-100">\n        <img [\s\S]*?        \/>\n      <\/div>\n\n      <div className="p-3 sm:p-4 flex flex-col flex-1">\n        <div className="flex items-center justify-between gap-1\.5 text-\[11px\] sm:text-xs text-adv-slate\/50 mb-1\.5">\n          <div className="flex items-center gap-1 truncate">\n            <MapPin className="w-3 h-3 sm:w-3\.5 sm:h-3\.5 text-adv-orange\/70 shrink-0" \/>\n            <span className="truncate">\{event\.location\}<\/span>\n          <\/div>\n          \{getDistanceString\(\) && \(\n            <span className="shrink-0 text-\[9px\] sm:text-\[10px\] font-bold text-adv-orange bg-orange-50 px-1\.5 py-0\.5 rounded-md border border-orange-100\/30 whitespace-nowrap">\n              \{getDistanceString\(\)\}\n            <\/span>\n          \)\}\n        <\/div>\n\n        <h3 className="text-sm sm:text-base md:text-lg font-bold text-adv-slate leading-snug line-clamp-2 mb-2 h-9 sm:h-11 md:h-12">/g;

const replacement = `      {/* Visual Header */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img 
          src={event.image.includes('unsplash.com') ? event.image.replace(/w=\\d+/, 'w=600') : event.image} 
          srcSet={
            event.image.includes('unsplash.com') 
            ? \`\${event.image.replace(/w=\\d+/, 'w=400')} 400w, \${event.image.replace(/w=\\d+/, 'w=800')} 800w\`
            : undefined
          }
          sizes="(max-width: 640px) 250px, 400px"
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
        
        {/* Top Badges */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10">
          {getDistanceString() && (
            <span className="shrink-0 text-[9px] sm:text-[10px] font-black text-adv-slate bg-white/95 backdrop-blur-md px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
              {getDistanceString()}
            </span>
          )}
        </div>

        {/* Bottom Overlay Info */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-white bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/20 w-fit max-w-full">
          <MapPin className="w-3 h-3 text-white shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="text-sm sm:text-base md:text-lg font-bold text-adv-slate leading-snug line-clamp-2 mb-2 h-10 sm:h-11 md:h-14">`;

if (content.includes('MapPin')) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('Frontend/src/components/LandscapeEventCard.tsx', content);
  console.log("Updated LandscapeEventCard.tsx");
} else {
  console.log("Failed to find regex match in LandscapeEventCard.tsx");
}
