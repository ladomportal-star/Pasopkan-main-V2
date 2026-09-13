const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Dashboard.tsx', 'utf-8');

// 1. Move Category and Status Badges to top of image
// 2. Move Date and Time to bottom of image

const replacement = `                      {/* Image Section */}
                      <div className="aspect-[4/5] relative shrink-0 overflow-hidden">
                        <img 
                          src={ticket.event.image} 
                          alt={ticket.event.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />
                        
                        {/* Top Overlay Badges */}
                        <div className="absolute top-2 left-2 right-2 flex flex-wrap items-start justify-between gap-2 z-10">
                            <span className="px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md bg-white/95 text-adv-slate shadow-sm backdrop-blur-md">
                              {ticket.event.category}
                            </span>
                            <div className="flex flex-col items-end gap-1">
                              {isTicketRefunded(ticket) && (
                                <span className="px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-500/95 text-white shadow-sm flex items-center gap-1 backdrop-blur-md">
                                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                                  <span>{t.refundSuccessBadge}</span>
                                </span>
                              )}
                              {!isTicketPastStatus && !isTicketRefunded(ticket) && (ticket.scanned || allCheckins.some(c => (c.ticketId || c.id || '').toLowerCase().includes(ticket.id.toLowerCase()))) && (
                                <span className="px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-500/95 text-white shadow-sm flex items-center gap-1 backdrop-blur-md">
                                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                                  <span>{lang === 'lo' ? 'ສະແກນແລ້ວ' : 'Scanned'}</span>
                                </span>
                              )}
                            </div>
                        </div>

                        {/* Bottom Overlay Date/Time */}
                        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-2 z-10">
                            <div className="flex items-center gap-1.5 text-white text-[10px] sm:text-[11px] font-bold bg-black/40 px-2 py-1 rounded-md backdrop-blur-md border border-white/20 shadow-sm">
                              <Calendar className="w-3 h-3 text-white shrink-0" />
                              <span>
                                {formatTicketEventDate(ticket.selectedDate || ticket.event?.date, ticket.event?.date || '')}
                              </span>
                            </div>
                            {formatTicketStartTime(ticket) && (
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black text-white bg-adv-orange/90 px-2 py-1 rounded-md backdrop-blur-md border border-white/20 shadow-sm">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{formatTicketStartTime(ticket)}</span>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2.5">
                        <div>
                          <h3 className={\`text-sm sm:text-base font-bold line-clamp-2 group-hover:text-adv-orange transition-colors mb-1.5 \${
                            theme === 'dark' ? 'text-zinc-100' : 'text-adv-slate'
                          }\`}>`;

const regex = /\{\/\* Image Section \*\/\}\s*<div className="aspect-\[4\/5\] relative shrink-0 overflow-hidden">[\s\S]*?<h3 className=\{\`text-sm sm:text-base font-bold line-clamp-2 group-hover:text-adv-orange transition-colors \$\{/g;
content = content.replace(regex, replacement);

fs.writeFileSync('Frontend/src/pages/Dashboard.tsx', content);
