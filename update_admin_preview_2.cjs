const fs = require('fs');

const path = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const insertionPoint = `                    {/* Organizer Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">`;

const settingsBlock = `                    {/* Event Settings & Policies */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                      <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                        <Settings className="w-5 h-5 text-adv-orange" />
                        {lang === 'lo' ? 'ການຕັ້ງຄ່າກິດຈະກຳ ແລະ ນະໂຍບາຍ' : 'Event Settings & Policies'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ຄວາມເປັນສ່ວນຕົວ' : 'Event Privacy'}</div>
                          <div className="text-xs font-black text-adv-slate capitalize">{selectedEvent.eventPrivacy || 'Public'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ປະເພດກິດຈະກຳ' : 'Event Type'}</div>
                          <div className="text-xs font-black text-adv-slate capitalize">{selectedEvent.eventType || 'Offline'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ປະເພດວັນທີ' : 'Date Type'}</div>
                          <div className="text-xs font-black text-adv-slate capitalize">{selectedEvent.dateType || 'Fixed'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ອະນຸຍາດໃຫ້ຄືນເງິນ' : 'Allow Refunds'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.allowRefunds ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ອະນຸຍາດໃຫ້ຣີວິວ' : 'Allow Reviews'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.allowReviews !== false ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ສະແດງຈຳນວນປີ້' : 'Show Remaining Tickets'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.showRemainingTickets !== false ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ບັງຄັບໃຫ້ໃສ່ຂໍ້ມູນທຸກປີ້' : 'Require Every Ticket Info'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.requireEveryTicketInfo !== false ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ເປີດໃຊ້ນັບຖອຍຫຼັງ' : 'Enable Countdown'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.enableCountdown !== false ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ຈຳກັດຈຳນວນປີ້ຕໍ່ການຊື້' : 'Max Tickets per Transaction'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.maxTickets || '4'}</div>
                        </div>
                      </div>
                      
                      {selectedEvent.cancellationPolicy && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl mt-4">
                          <div className="text-[10px] text-adv-orange font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ນະໂຍບາຍການຍົກເລີກ' : 'Cancellation Policy'}</div>
                          <div className="text-sm font-medium text-adv-slate">{selectedEvent.cancellationPolicy}</div>
                        </div>
                      )}
                      {selectedEvent.attendeeMessage && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mt-4">
                          <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ຂໍ້ຄວາມເຖິງຜູ້ເຂົ້າຮ່ວມ' : 'Attendee Message'}</div>
                          <div className="text-sm font-medium text-emerald-900">{selectedEvent.attendeeMessage}</div>
                        </div>
                      )}
                    </div>

`;

content = content.replace(insertionPoint, settingsBlock + insertionPoint);

const docsInsertion = `                    {selectedEvent.status === 'pending' && selectedEvent.paymentInfo && (`;

const docsBlock = `                    {/* Admin Verification Documents (Only for Admin Dashboard) */}
                    {selectedEvent.status === 'pending' && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                              <Shield className="w-5 h-5 text-adv-orange" />
                              {lang === 'lo' ? 'ເອກະສານຢືນຢັນ' : 'Organizer Verification (KYC)'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{lang === 'lo' ? 'ບັດປະຈຳຕົວ' : 'ID Card / Passport'}</div>
                                {(selectedEvent.organizerInfo?.idCardUrl || selectedEvent.idCardFile || selectedEvent.idCardUrl) ? (
                                  <div 
                                    className="relative group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 shadow-sm aspect-video"
                                    onClick={() => setViewingIdCardUrl(selectedEvent.organizerInfo?.idCardUrl || selectedEvent.idCardFile || selectedEvent.idCardUrl)}
                                  >
                                    <img src={selectedEvent.organizerInfo?.idCardUrl || selectedEvent.idCardFile || selectedEvent.idCardUrl} alt="ID Card" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-adv-orange/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ExternalLink className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                   <div className="aspect-video rounded-2xl bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest border border-dashed border-gray-200">No document provided</div>
                                )}
                              </div>
                              
                              <div>
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{lang === 'lo' ? 'ໃບທະບຽນວິສາຫະກິດ' : 'Business Registration'}</div>
                                {(selectedEvent.organizerInfo?.businessRegUrl || selectedEvent.businessRegFile || selectedEvent.businessRegUrl) ? (
                                  <div 
                                    className="relative group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 shadow-sm aspect-video"
                                    onClick={() => setViewingIdCardUrl(selectedEvent.organizerInfo?.businessRegUrl || selectedEvent.businessRegFile || selectedEvent.businessRegUrl)}
                                  >
                                    <img src={selectedEvent.organizerInfo?.businessRegUrl || selectedEvent.businessRegFile || selectedEvent.businessRegUrl} alt="Business Registration" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-adv-orange/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ExternalLink className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                   <div className="aspect-video rounded-2xl bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest border border-dashed border-gray-200">No document provided</div>
                                )}
                              </div>
                            </div>
                        </div>
                    )}
                    
`;

content = content.replace(docsInsertion, docsBlock + docsInsertion);

const actionPanelInsertion = `                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleApprove(selectedEvent.id)}
                          className="flex-1 py-4 rounded-2xl bg-adv-orange text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-adv-orange/30"
                        >`;

const commentBlock = `                      <div className="space-y-4 mb-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t.internalNote}</label>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-inner focus-within:border-adv-orange/30 transition-colors">
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t.addComment}
                            className="w-full bg-transparent border-none text-sm text-adv-slate font-medium placeholder:text-gray-300 focus:outline-none focus:ring-0 resize-none min-h-[120px]"
                          />
                        </div>
                        <button 
                          onClick={handleAddComment}
                          disabled={!comment.trim()}
                          className="w-full px-6 py-4 rounded-2xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-30 disabled:grayscale hover:bg-adv-slate transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Save className="w-4 h-4" />
                          {t.postComment}
                        </button>
                      </div>
                      
`;

content = content.replace(actionPanelInsertion, commentBlock + actionPanelInsertion);

// ensure Settings import is there
if (!content.includes('Settings')) {
    content = content.replace('import { Search', 'import { Search, Settings');
}

fs.writeFileSync(path, content);
console.log('Successfully updated AdminDashboard.tsx');
