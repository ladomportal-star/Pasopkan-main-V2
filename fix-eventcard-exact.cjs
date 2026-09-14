const fs = require('fs');

let content = fs.readFileSync('Frontend/src/components/EventCard.tsx', 'utf-8');

// Replace the classes on the main motion.div
content = content.replace(
  'className="group relative flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 hover:border-adv-orange/50 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer h-full"',
  'className="group relative flex flex-col commerce-card w-full h-full overflow-hidden cursor-pointer rounded-2xl sm:rounded-[2rem]"'
);

// Replace the content body
const oldBody = `      {/* Content Body */}
      <div className="p-3 flex flex-col flex-1 min-w-0">
        {/* Event Title */}
        <h3 className="text-xs sm:text-sm md:text-base font-bold text-adv-slate leading-snug line-clamp-2 h-8 sm:h-10 md:h-12 group-hover:text-adv-orange transition-colors">
          {event.title}
        </h3>
        
        {/* Date Details */}
        <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-1 mb-2 flex items-center gap-1 truncate">
          <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </div>
        
        {/* Footer Action Bar */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[9px] font-bold uppercase text-gray-400 tracking-wider leading-none mb-0.5">{t.startingFrom}</span>
            <span className="text-xs sm:text-sm font-black text-adv-slate truncate">{getPriceRange()}</span>
          </div>
            
          <button 
            className={\`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all cursor-pointer shrink-0 \${
              isPast 
                ? 'text-adv-slate group-hover:underline' 
                : 'text-adv-orange group-hover:underline'
            }\`}
          >
            <span>{isPast ? t.viewEvent : t.buyTickets}</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>`;

const newBody = `      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="text-sm sm:text-base md:text-lg font-bold text-adv-slate leading-snug line-clamp-2 mb-2 h-10 sm:h-11 md:h-14 group-hover:text-adv-orange transition-colors">
          {event.title}
        </h3>

        {/* Footer */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.startingFrom}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base md:text-lg font-bold text-adv-orange leading-tight">{getPriceRange()}</span>
            </div>
          </div>
            
          <button className="text-[11px] sm:text-xs font-bold text-adv-orange group-hover:underline flex items-center gap-1 shrink-0">
             {isPast ? t.viewEvent : t.buyTickets}
             <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>`;

content = content.replace(oldBody, newBody);

fs.writeFileSync('Frontend/src/components/EventCard.tsx', content);
