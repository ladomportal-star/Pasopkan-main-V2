const fs = require('fs');

const path = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ປະເພດກິດຈະກຳ' : 'Event Type'}</div>
                          <div className="text-xs font-black text-adv-slate capitalize">{selectedEvent.eventType || 'Offline'}</div>
                        </div>`;

const extraOnline = `                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ປະເພດກິດຈະກຳ' : 'Event Type'}</div>
                          <div className="text-xs font-black text-adv-slate capitalize">{selectedEvent.eventType || 'Offline'}</div>
                        </div>
                        {selectedEvent.eventType === 'online' && (
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 col-span-2 md:col-span-3">
                            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-2">{lang === 'lo' ? 'ຂໍ້ມູນອອນລາຍ' : 'Online Event Details'}</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div>
                                <span className="block text-[10px] font-bold text-gray-400">Platform</span>
                                <span className="text-xs font-black text-adv-slate capitalize">{selectedEvent.onlinePlatform}</span>
                              </div>
                              <div className="md:col-span-2">
                                <span className="block text-[10px] font-bold text-gray-400">Link</span>
                                <span className="text-xs font-medium text-blue-600 break-all">{selectedEvent.onlineMeetingUrl}</span>
                              </div>
                            </div>
                            {selectedEvent.onlinePasscode && (
                              <div className="mt-2 pt-2 border-t border-blue-100">
                                <span className="block text-[10px] font-bold text-gray-400">Passcode</span>
                                <span className="text-xs font-medium text-adv-slate">{selectedEvent.onlinePasscode}</span>
                              </div>
                            )}
                            {selectedEvent.onlineInstructions && (
                              <div className="mt-2 pt-2 border-t border-blue-100">
                                <span className="block text-[10px] font-bold text-gray-400">Instructions</span>
                                <span className="text-xs font-medium text-adv-slate">{selectedEvent.onlineInstructions}</span>
                              </div>
                            )}
                          </div>
                        )}`;

content = content.replace(target, extraOnline);

fs.writeFileSync(path, content);
console.log('Successfully updated AdminDashboard.tsx 4');
