const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Dashboard.tsx', 'utf-8');

// 1. Change grid container back to list
content = content.replace(/className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"/g, 'className="space-y-3 sm:space-y-4"');

// 2. Change card flex-col to flex-row
content = content.replace(/className=\{\`group rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col w-full/g, 'className={`group rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden flex flex-row w-full');

// 3. Replace Image and Info sections entirely to rebuild the layout
const cardContentRegex = /\{\/\* Image Section \*\/\}\s*<div className="aspect-\[4\/5\] relative shrink-0 overflow-hidden">[\s\S]*?className=\{\`pt-2\.5 border-t \$\{theme === 'dark' \? 'border-zinc-800\/80' : 'border-gray-100'\}\`\}>/g;

const replacement = `{/* Image Section */}
                      <div className="w-28 sm:w-40 md:w-48 relative shrink-0 overflow-hidden">
                        <img 
                          src={ticket.event.image} 
                          alt={ticket.event.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 pointer-events-none" />
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2.5 min-w-0">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={\`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border \${
                              theme === 'dark' 
                                ? 'bg-orange-950/40 text-orange-400 border-orange-900/30' 
                                : 'bg-orange-50 text-adv-orange border-orange-100/60'
                            }\`}>
                              {ticket.event.category}
                            </span>
                            {isTicketRefunded(ticket) && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                                <span>{t.refundSuccessBadge}</span>
                              </span>
                            )}
                            {!isTicketPastStatus && !isTicketRefunded(ticket) && (ticket.scanned || allCheckins.some(c => (c.ticketId || c.id || '').toLowerCase().includes(ticket.id.toLowerCase()))) && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                                <span>{lang === 'lo' ? 'ສະແກນແລ້ວ' : 'Scanned'}</span>
                              </span>
                            )}
                          </div>

                          <h3 className={\`text-sm sm:text-base font-bold line-clamp-2 group-hover:text-adv-orange transition-colors mb-2 \${
                            theme === 'dark' ? 'text-zinc-100' : 'text-adv-slate'
                          }\`}>
                            {ticket.event.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-semibold mb-1">
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Calendar className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                              <span>
                                {formatTicketEventDate(ticket.selectedDate || ticket.event?.date, ticket.event?.date || '')}
                              </span>
                            </div>
                            {formatTicketStartTime(ticket) && (
                              <div className="flex items-center gap-1 text-adv-orange font-mono pl-3 border-l border-gray-200 dark:border-zinc-750">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>{formatTicketStartTime(ticket)}</span>
                              </div>
                            )}
                          </div>

                          <div className={\`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium \${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}\`}>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-adv-orange/70 shrink-0" />
                              <span className="truncate max-w-[120px] sm:max-w-[200px]">{ticket.event.venue}</span>
                            </div>
                            <span className="hidden sm:inline text-gray-200 dark:text-zinc-800">•</span>
                            <div className="flex items-center gap-1">
                              <Ticket className="w-3.5 h-3.5 text-gray-400/70 shrink-0" />
                              <span>{ticket.quantity}x {ticket.tier.name}</span>
                            </div>
                          </div>
                        </div>

                        {!isTicketRefunded(ticket) && (
                          <div className={\`pt-2.5 mt-2 border-t \${theme === 'dark' ? 'border-zinc-800/80' : 'border-gray-100'}\`}>`;

if (content.includes('Top Overlay Badges')) {
  content = content.replace(cardContentRegex, replacement);
  fs.writeFileSync('Frontend/src/pages/Dashboard.tsx', content);
  console.log("Updated Dashboard successfully.");
} else {
  console.log("Could not find regex match.");
}

