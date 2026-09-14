const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

const target = `                   {/* Quick Action Buttons */}
                   <div className="flex items-center gap-2 shrink-0">


                     {event.googleMapUrl && (
                       <a
                         href={event.googleMapUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-xs font-bold text-adv-orange transition-all flex items-center gap-1.5 shadow-2xs"
                       >
                         <ExternalLink className="w-3.5 h-3.5" />
                         <span>{lang === 'lo' ? 'ເປີດໃນ Maps' : 'Google Maps'}</span>
                       </a>
                     )}
                   </div>`;

const target2 = `                   {/* Quick Action Buttons */}
                   <div className="flex items-center gap-2 shrink-0">

                     {event.googleMapUrl && (
                       <a
                         href={event.googleMapUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-xs font-bold text-adv-orange transition-all flex items-center gap-1.5 shadow-2xs"
                       >
                         <ExternalLink className="w-3.5 h-3.5" />
                         <span>{lang === 'lo' ? 'ເປີດໃນ Maps' : 'Google Maps'}</span>
                       </a>
                     )}
                   </div>`;

if (content.includes(target)) {
  content = content.replace(target, '');
  console.log("Replaced target 1");
} else if (content.includes(target2)) {
  content = content.replace(target2, '');
  console.log("Replaced target 2");
} else {
  // Regex approach
  const regex = /\s*\{\/\*\s*Quick Action Buttons\s*\*\/\}\s*<div className="flex items-center gap-2 shrink-0">[\s\S]*?<\/div>/;
  if (regex.test(content)) {
    content = content.replace(regex, '');
    console.log("Replaced via regex");
  } else {
    console.log("Could not find target to replace.");
  }
}

fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
