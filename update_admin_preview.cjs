const fs = require('fs');

let adminContent = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const previewContent = fs.readFileSync('preview_body.txt', 'utf8');

// The layout in AdminDashboard to replace:
// from: <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
// to: the matching closing div before: {showRejectionModal && selectedEvent && (

// Let's create the replacement string
const replacement = `              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-gray-50">
                {/* Hero Banner Cover */}
                <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-800 aspect-[21/9] min-h-[260px] shadow-2xl border border-gray-200 mb-8 mx-auto max-w-6xl">
                  <img 
                    src={selectedEvent.horizontalImage || selectedEvent.image} 
                    alt={selectedEvent.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-10">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-adv-orange text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md">
                        {selectedEvent.category}
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/30">
                        {selectedEvent.eventType === 'online' ? 'Online Event' : (selectedEvent.province || 'Offline Event')}
                      </span>
                      {selectedEvent.dateType === 'flexible' && (
                        <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider">
                          Flexible Date
                        </span>
                      )}
                    </div>
                    <h1 className="font-extrabold text-white tracking-tight mb-2 text-4xl">
                      {selectedEvent.title}
                    </h1>
                    <p className="text-slate-300 text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-adv-orange shrink-0" />
                      {selectedEvent.venue} • {selectedEvent.district}, {selectedEvent.province}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  
                  {/* Left Column: Details */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Event Quick Info Bar */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'lo' ? 'ວັນທີ' : 'Date'}</div>
                          <div className="text-sm font-bold text-adv-slate">
                            {selectedEvent.dateType === 'flexible' ? (
                              'Flexible Date'
                            ) : selectedEvent.date ? (
                              new Date(selectedEvent.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                            ) : 'TBA'}
                            {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.date && \` - \${new Date(selectedEvent.endDate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric' })}\`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'lo' ? 'ເວລາ' : 'Time'}</div>
                          <div className="text-sm font-bold text-adv-slate">
                            {selectedEvent.time || 'TBA'} {selectedEvent.endTime && \` - \${selectedEvent.endTime}\`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-adv-slate mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-adv-orange" />
                        {lang === 'lo' ? 'ລາຍລະອຽດ event' : 'Event Description'}
                      </h3>
                      <div 
                        className="prose max-w-none text-gray-600 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedEvent.description || '<p>No description provided.</p>' }}
                      />
                    </div>

                    {/* Gallery Images */}
                    {selectedEvent.exampleImages && selectedEvent.exampleImages.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ຮູບພາບປະກອບ' : 'Event Gallery'}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedEvent.exampleImages.map((img, idx) => (
                            <img key={idx} src={img} alt={\`Gallery \${idx}\`} className="w-full h-32 object-cover rounded-xl border border-gray-100 shadow-sm" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seating Zone Map */}
                    {selectedEvent.hasSeating && selectedEvent.zoneImage && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ແຜນຜັງໂຊນບ່ອນນັ່ງ' : 'Zone Seating Map'}
                        </h3>
                        <div className="rounded-xl overflow-hidden border border-gray-200 max-h-[400px] flex justify-center bg-gray-50">
                          <img src={selectedEvent.zoneImage} alt="Seating Map" className="w-full object-contain" />
                        </div>
                      </div>
                    )}

                    {/* Time Slots */}
                    {selectedEvent.hasTimeSelection && selectedEvent.timeSlots && selectedEvent.timeSlots.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                          <Clock className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ເລືອກຊ່ວງເວລາ' : 'Operating Time Slots'}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedEvent.timeSlots.map((slot, idx) => (
                            <div key={idx} className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-center text-xs font-bold text-adv-slate">
                              {slot}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Organizer Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                      {selectedEvent.organizerLogo || (selectedEvent.organizerInfo && selectedEvent.organizerInfo.logoUrl) ? (
                        <img src={selectedEvent.organizerLogo || selectedEvent.organizerInfo?.logoUrl} alt={selectedEvent.organizer || 'Organizer'} className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange font-black text-xl shrink-0">
                          {(selectedEvent.organizerInfo?.name || selectedEvent.organizer || 'O').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-400 font-bold uppercase">{lang === 'lo' ? 'ຜູ້ຈັດງານ' : 'Organized by'}</div>
                        <div className="text-base font-extrabold text-adv-slate">{selectedEvent.organizerInfo?.name || selectedEvent.organizer || 'Organizer Name'}</div>
                        {(selectedEvent.organizerInfo?.contact || selectedEvent.organizerContact) && (
                          <div className="text-xs text-gray-500 font-medium mt-0.5">{selectedEvent.organizerInfo?.contact || selectedEvent.organizerContact}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Admin Verification Documents (Only for Admin Dashboard) */}
                    {selectedEvent.status === 'pending' && selectedEvent.organizerInfo && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                              <Shield className="w-5 h-5 text-adv-orange" />
                              {t.idCard}
                            </h3>
                            {selectedEvent.organizerInfo.idCardUrl ? (
                              <div 
                                className="relative group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 shadow-sm aspect-video max-w-sm"
                                onClick={() => setViewingIdCardUrl(selectedEvent.organizerInfo.idCardUrl)}
                              >
                                <img src={selectedEvent.organizerInfo.idCardUrl} alt="ID Card" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-adv-orange/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ExternalLink className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            ) : (
                               <div className="aspect-video max-w-sm rounded-2xl bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest border border-dashed border-gray-200">No document provided</div>
                            )}
                        </div>
                    )}
                    
                    {selectedEvent.status === 'pending' && selectedEvent.paymentInfo && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                          <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-adv-orange" />
                            {t.payoutInfo}
                          </h3>
                            
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.bankAccount}</div>
                              <div className="font-bold text-adv-slate">{selectedEvent.paymentInfo.accountName}</div>
                              <div className="text-xs text-gray-500 font-medium mt-1">{selectedEvent.paymentInfo.bankName}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.accountNumber}</div>
                              <div className="font-bold text-adv-slate tracking-wider">{selectedEvent.paymentInfo.accountNumber}</div>
                            </div>
                          </div>
                        </div>
                    )}

                  </div>

                  {/* Right Column: Ticket Purchase Box & Admin Actions */}
                  <div className="space-y-6">
                    {/* Ticket Box */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-6">
                      <div className="border-b border-gray-100 pb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          {lang === 'lo' ? 'ລາຄາປີ້ເລີ່ມຕົ້ນ' : 'Starting Ticket Price'}
                        </span>
                        <div className="text-2xl font-black text-adv-orange">
                          {selectedEvent.price || \`0 ₭\`}
                        </div>
                      </div>

                      {/* Ticket Tiers list */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                          {lang === 'lo' ? 'ປະເພດປີ້' : 'Ticket Tiers'}
                        </h4>
                        {selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0 ? (
                          selectedEvent.ticketTiers.map((tier, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                              <div>
                                <div className="font-bold text-xs text-adv-slate">{tier.name || \`Tier \${idx + 1}\`}</div>
                                <div className="text-[10px] text-gray-400 font-medium">Qty: {tier.quantity || 'Unlimited'}</div>
                              </div>
                              <div className="font-extrabold text-xs text-adv-orange">
                                {tier.price ? \`\${(Number(String(tier.price).replace(/,/g, '')) || 0).toLocaleString()} ₭\` : \`0 ₭\`}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-xs text-gray-400 font-medium">
                            General Admission
                          </div>
                        )}
                      </div>

                      {/* Coupons Badge */}
                      {selectedEvent.coupons && selectedEvent.coupons.length > 0 && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold">
                          <Ticket className="w-4 h-4 shrink-0" />
                          <span>{selectedEvent.coupons.length} {lang === 'lo' ? 'ຄູປອງສ່ວນຫຼຸດພິເສດ' : 'Special Coupons Available'}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Admin Actions Panel */}
                    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 shadow-sm sticky top-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-adv-orange" />
                        {t.adminActions}
                      </h4>
                      
                      <div className="space-y-3 mb-8">
                        {selectedEvent.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => {
                                handleApprove(selectedEvent.id);
                                setSelectedEvent(null);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-adv-orange text-white hover:bg-orange-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100"
                            >
                              <CheckCircle2 className="w-4 h-4" /> {t.approveEvent}
                            </button>
                            <button 
                              onClick={() => setShowRejectionModal(true)}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-red-100 text-red-500 hover:bg-red-50 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <XCircle className="w-4 h-4" /> {t.rejectEvent}
                            </button>
                          </>
                        ) : (
                          <>
                            <Link 
                              to={\`/event/\${selectedEvent.id}\`}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-200 text-adv-slate hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                            >
                              <ExternalLink className="w-4 h-4" /> {t.viewPage}
                            </Link>
                            <button 
                              onClick={() => handleDeleteEvent(selectedEvent.id)}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Trash2 className="w-4 h-4" /> {t.delete}
                            </button>
                          </>
                        )}
                      </div>

                      <div className="space-y-4">
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
                    </div>

                  </div>
                </div>
              </div>`;

const startIndex = adminContent.indexOf('<div className="p-8 overflow-y-auto flex-1 custom-scrollbar">');
const markerRejection = '{showRejectionModal && selectedEvent && (';
const endIndex = adminContent.indexOf(markerRejection);

// Let's find the closing tag for the p-8 div. It is the div right before {showRejectionModal
let beforeRejection = adminContent.substring(0, endIndex);
let lastClosingDiv = beforeRejection.lastIndexOf('</div>');
// actually there might be multiple closing divs.
// The structure was:
/*
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  ...
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {showRejectionModal
*/

// So let's just do a regex replace or substring replace
// I will replace everything between `<div className="p-8 overflow-y-auto flex-1 custom-scrollbar">`
// and `            </motion.div>`

const blockStartIndex = adminContent.indexOf('<div className="p-8 overflow-y-auto flex-1 custom-scrollbar">');
const blockEndIndex = adminContent.indexOf('</motion.div>', blockStartIndex);

if (blockStartIndex !== -1 && blockEndIndex !== -1) {
  const newContent = adminContent.substring(0, blockStartIndex) + replacement + '\n            ' + adminContent.substring(blockEndIndex);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', newContent);
  console.log('Successfully updated AdminDashboard.tsx');
} else {
  console.log('Could not find the block to replace.');
}

