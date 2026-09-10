const fs = require('fs');
const path = 'Frontend/src/pages/Account.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `            {/* Terms & Conditions (Simplified) */}
            <div className="px-2 sm:px-4">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="space-y-2 max-w-3xl">
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                    • {lang === 'lo'
                      ? 'ຫາກຜູ້ຈັດງານມີການແກ້ໄຂຂໍ້ມູນບັນຊີທະນາຄານ ຈະຕ້ອງລໍຖ້າໃຫ້ຄົບ 30 ວັນ ຈຶ່ງຈະສາມາດກົດຂໍເບີກຈ່າຍເງິນກິດຈະກຳໄດ້ ເພື່ອປ້ອງກັນການສໍ້ໂກງ ແລະ ການລັກລອບປ່ຽນບັນຊີ.'
                      : 'If the organizer edits bank details, they must wait 30 days before they can claim event money. This cooling-off lock prevents unauthorized account hijack payouts.'}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                    • {lang === 'lo'
                      ? 'ທຸກໆຄັ້ງທີ່ມີການເພີ່ມ ຫຼື ແກ້ໄຂຂໍ້ມູນບັນຊີທະນາຄານ ລະບົບຈະສົ່ງລະຫັດ OTP 6 ຫຼັກ ເພື່ອຢືນຢັນຕົວຕົນຂອງເຈົ້າຂອງບັນຊີຕົວຈິງກ່ອນບັນທຶກ.'
                      : 'Updating bank details strictly requires a 6-digit One-Time Password (OTP) verification sent to the verified organizer device before changes are saved.'}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                    • {lang === 'lo'
                      ? 'ການກົດຂໍເບີກຈ່າຍເງິນລາຍຮັບກິດຈະກຳຕ້ອງໄດ້ຮັບການຢືນຢັນດ້ວຍລະຫັດ OTP 6 ຫຼັກ ເພື່ອຮັບປະກັນວ່າເຈົ້າຂອງງານເປັນຜູ້ອະນຸມັດການໂອນເງິນ.'
                      : 'Claiming event money strictly requires 6-digit OTP confirmation to ensure that only the authorized organizer executes the fund transfer.'}
                  </p>
                </div>

                {/* Interactive Testing Simulation Toggle */}
                <div className="flex items-center gap-1.5 self-start bg-gray-100 dark:bg-zinc-800/80 p-1 rounded-xl shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 px-2 hidden sm:inline">
                    {lang === 'lo' ? 'ທົດສອບ:' : 'Test Sim:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSimulateBankDate(0)}
                    className={\`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer \${
                      isBankInCoolingPeriod
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                    }\`}
                    title="Simulate bank was updated today"
                  >
                    {lang === 'lo' ? 'ອັບເດດມື້ນີ້ (ຖືກລັອກ)' : 'Bank Edit Today (Locked)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateBankDate(35)}
                    className={\`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer \${
                      !isBankInCoolingPeriod
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                    }\`}
                    title="Simulate bank was updated 35 days ago"
                  >
                    {lang === 'lo' ? '35 ວັນກ່ອນ (ເບີກໄດ້)' : '35 Days Ago (Eligible)'}
                  </button>
                </div>
              </div>
            </div>`;

const lines = content.split('\n');
lines.splice(1965, 113, replacement);
fs.writeFileSync(path, lines.join('\n'));
