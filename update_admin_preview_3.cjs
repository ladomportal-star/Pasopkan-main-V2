const fs = require('fs');

const path = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const insertionPoint = `                      {selectedEvent.attendeeMessage && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mt-4">`;

const attendeeQuestionsBlock = `                      {selectedEvent.attendeeQuestions && selectedEvent.attendeeQuestions.length > 0 && (
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl mt-4">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">{lang === 'lo' ? 'ຄຳຖາມສຳລັບຜູ້ເຂົ້າຮ່ວມ' : 'Custom Attendee Questions'}</div>
                          <div className="space-y-2">
                            {selectedEvent.attendeeQuestions.map((q: any, idx: number) => (
                              <div key={idx} className="p-3 bg-white border border-gray-100 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-bold text-adv-slate">{q.label}</span>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-adv-orange bg-orange-50 px-2 py-0.5 rounded-md">
                                    {q.type}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 font-medium">
                                  {q.required ? 'Required' : 'Optional'}
                                  {q.options && q.options.length > 0 && (
                                    <span className="ml-2 block mt-1 text-gray-500">Options: {q.options.join(', ')}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
`;

content = content.replace(insertionPoint, attendeeQuestionsBlock + insertionPoint);

fs.writeFileSync(path, content);
console.log('Successfully updated AdminDashboard.tsx 3');
