const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetStr = `                            <button 
                              onClick={() => setShowRejectionModal(true)}`;

const editBtnStr = `                            <Link 
                              to={\`/create?adminEdit=\${selectedEvent.id}\`}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-200 text-adv-slate hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                            >
                              <Edit className="w-4 h-4" /> {lang === 'lo' ? 'ແກ້ໄຂກິດຈະກຳ' : 'Edit Event'}
                            </Link>
                            <button 
                              onClick={() => setShowRejectionModal(true)}`;

content = content.replace(targetStr, editBtnStr);
fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
