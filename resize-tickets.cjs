const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Dashboard.tsx', 'utf-8');

// Update the container
content = content.replace(/className="flex flex-wrap justify-center gap-4 sm:gap-6"/g, 'className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"');

// Update the card width and corners
const cardRegex = /className=\{\`group rounded-\[2rem\] border transition-all duration-300 overflow-hidden flex flex-col w-\[280px\] sm:w-\[300px\] shrink-0 mx-auto/g;
content = content.replace(cardRegex, 'className={`group rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col w-full');

// Make title text slightly smaller on mobile to fit the narrow cards
const titleRegex = /<h3 className=\{\`text-base font-bold line-clamp-1 group-hover:text-adv-orange transition-colors \$\{/g;
content = content.replace(titleRegex, '<h3 className={`text-sm sm:text-base font-bold line-clamp-2 group-hover:text-adv-orange transition-colors ${');

// Allow max-w on the venue to shrink correctly
const venueRegex = /<span className="truncate max-w-\[180px\] sm:max-w-none">\{ticket\.event\.venue\}<\/span>/g;
content = content.replace(venueRegex, '<span className="truncate max-w-[100px] sm:max-w-[180px]">{ticket.event.venue}</span>');

fs.writeFileSync('Frontend/src/pages/Dashboard.tsx', content);
