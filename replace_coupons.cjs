const fs = require('fs');
const path = 'Frontend/src/components/ManageCouponsSection.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `                {/* Left side: Code, Details, Stats */}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {/* Coupon Code Tag */}
                    <div className={\`px-3.5 py-1.5 rounded-xl border font-bold flex items-center justify-between sm:justify-start gap-2 shrink-0 \${
                      coupon.isActive
                        ? 'bg-orange-500/10 border-orange-500/30 text-adv-orange shadow-sm'
                        : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400'
                    }\`}>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 shrink-0" />
                        <span className="font-mono font-black text-sm sm:text-base tracking-widest uppercase">
                          {coupon.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        title={lang === 'lo' ? 'ຄັດລອກລະຫັດ' : 'Copy code'}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 hover:text-adv-orange" />
                        )}
                      </button>
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-adv-slate dark:text-white leading-tight tracking-tight">
                      {discountLabel}
                    </span>
                  </div>

                  {/* Usage Stats Pills */}
                  <div className={\`flex flex-wrap items-center gap-1.5\`}>
                      <div className={\`px-2.5 py-1 rounded-lg border text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shrink-0 \${
                        usageCount > 0
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400'
                      }\`}>
                        <Users className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">
                          {lang === 'lo' ? 'ນຳໃຊ້ແລ້ວ: ' : 'Used: '}
                          <strong className="font-black">{usageCount}</strong>
                          {maxUsesVal ? \` / \${maxUsesVal} \${lang === 'lo' ? 'ຄັ້ງ' : 'uses'}\` : \` \${lang === 'lo' ? 'ຄັ້ງ' : 'times'}\`}
                        </span>
                      </div>

                      {usageCount > 0 && totalSavedAmount > 0 && (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span className="whitespace-nowrap">
                            {lang === 'lo' ? 'ປະຢັດທັງໝົດ: ' : 'Total Saved: '}
                            <strong className="font-black">{totalSavedAmount.toLocaleString()} {currency}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Date range */}
                    <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-gray-400 font-medium">
                      {coupon.validFrom || coupon.validUntil ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-adv-orange shrink-0" />
                          <span>
                            {coupon.validFrom ? formatToDDMMYYYY(coupon.validFrom) : 'Now'} - {coupon.validUntil ? formatToDDMMYYYY(coupon.validUntil) : 'Forever'}
                          </span>
                        </span>
                      ) : (
                        <span>{lang === 'lo' ? 'ບໍ່ມີກຳນົດໝົດອາຍຸ' : 'No expiration date'}</span>
                      )}
                    </div>
                  </div>

                {/* Right side: Action Controls (Only Status Toggle & View Accounts) */}
                <div className="grid grid-cols-2 lg:flex lg:items-center justify-between lg:justify-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-zinc-800/80 shrink-0 w-full lg:w-auto">
                  {/* View Details / Who Used Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCouponForDetails(coupon);
                      setSearchQuery('');
                    }}
                    className={\`px-2 sm:px-3.5 py-2 rounded-xl border text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer shadow-xs w-full \${
                      theme === 'dark'
                        ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-adv-slate'
                    }\`}
                  >
                    <Users className="w-3.5 h-3.5 text-adv-orange shrink-0 hidden sm:block" />
                    <span className="truncate">{lang === 'lo' ? 'ເບິ່ງລາຍລະອຽດຜູ້ໃຊ້' : 'View Accounts'}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-adv-orange text-white text-[10px] font-black shrink-0">
                      {usageCount}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0 hidden sm:block" />
                  </button>

                  {/* Active / Paused Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(String(coupon.id))}
                    title={coupon.isActive 
                      ? (lang === 'lo' ? 'ກົດເພື່ອປິດການໃຊ້ງານຊົ່ວຄາວ' : 'Click to Pause') 
                      : (lang === 'lo' ? 'ກົດເພື່ອເປີດການໃຊ້ງານ' : 'Click to Activate')}
                    className={\`px-2 sm:px-3.5 py-2 rounded-xl border text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full \${
                      coupon.isActive
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-xs'
                        : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                    }\`}
                  >
                    <span className={\`w-2 h-2 rounded-full shrink-0 \${coupon.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}\`} />
                    <span className="truncate">
                      {coupon.isActive 
                        ? (lang === 'lo' ? 'ເປີດໃຊ້ງານ (Active)' : 'Active') 
                        : (lang === 'lo' ? 'ປິດຊົ່ວຄາວ (Paused)' : 'Paused')}
                    </span>
                  </button>
                </div>`;

const replacementStr = `                {/* Left side: Details, Code, Stats */}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-col items-start gap-2.5">
                    <span className="text-xl sm:text-3xl font-black text-adv-slate dark:text-white leading-tight tracking-tight">
                      {discountLabel}
                    </span>
                    {/* Coupon Code Tag */}
                    <div className={\`px-3.5 py-1.5 rounded-xl border font-bold flex items-center justify-between sm:justify-start gap-2 shrink-0 \${
                      coupon.isActive
                        ? 'bg-orange-500/10 border-orange-500/30 text-adv-orange shadow-sm'
                        : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400'
                    }\`}>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 shrink-0" />
                        <span className="font-mono font-black text-sm sm:text-base tracking-widest uppercase">
                          {coupon.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        title={lang === 'lo' ? 'ຄັດລອກລະຫັດ' : 'Copy code'}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 hover:text-adv-orange" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Usage Stats Pills */}
                  <div className={\`flex flex-wrap items-center gap-1.5\`}>
                      <div className={\`px-2.5 py-1 rounded-lg border text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shrink-0 \${
                        usageCount > 0
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400'
                      }\`}>
                        <Users className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">
                          {lang === 'lo' ? 'ນຳໃຊ້ແລ້ວ: ' : 'Used: '}
                          <strong className="font-black">{usageCount}</strong>
                          {maxUsesVal ? \` / \${maxUsesVal} \${lang === 'lo' ? 'ຄັ້ງ' : 'uses'}\` : \` \${lang === 'lo' ? 'ຄັ້ງ' : 'times'}\`}
                        </span>
                      </div>

                      {usageCount > 0 && totalSavedAmount > 0 && (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span className="whitespace-nowrap">
                            {lang === 'lo' ? 'ປະຢັດທັງໝົດ: ' : 'Total Saved: '}
                            <strong className="font-black">{totalSavedAmount.toLocaleString()} {currency}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Date range */}
                    <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-gray-400 font-medium">
                      {coupon.validFrom || coupon.validUntil ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-adv-orange shrink-0" />
                          <span>
                            {coupon.validFrom ? formatToDDMMYYYY(coupon.validFrom) : 'Now'} - {coupon.validUntil ? formatToDDMMYYYY(coupon.validUntil) : 'Forever'}
                          </span>
                        </span>
                      ) : (
                        <span>{lang === 'lo' ? 'ບໍ່ມີກຳນົດໝົດອາຍຸ' : 'No expiration date'}</span>
                      )}
                    </div>
                  </div>

                {/* Right side: Action Controls (Only Status Toggle & View Accounts) */}
                <div className="flex flex-col justify-center items-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-zinc-800/80 shrink-0 w-full lg:w-48">
                  {/* View Details / Who Used Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCouponForDetails(coupon);
                      setSearchQuery('');
                    }}
                    className={\`px-2 sm:px-3.5 py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold flex items-center justify-between gap-1 sm:gap-2 transition-all cursor-pointer shadow-xs w-full \${
                      theme === 'dark'
                        ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-adv-slate'
                    }\`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                      <span className="truncate">{lang === 'lo' ? 'ເບິ່ງລາຍລະອຽດຜູ້ໃຊ້' : 'View Accounts'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.2 rounded-full bg-adv-orange text-white text-[10px] font-black shrink-0">
                        {usageCount}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </div>
                  </button>

                  {/* Active / Paused Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(String(coupon.id))}
                    title={coupon.isActive 
                      ? (lang === 'lo' ? 'ກົດເພື່ອປິດການໃຊ້ງານຊົ່ວຄາວ' : 'Click to Pause') 
                      : (lang === 'lo' ? 'ກົດເພື່ອເປີດການໃຊ້ງານ' : 'Click to Activate')}
                    className={\`px-2 sm:px-3.5 py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full \${
                      coupon.isActive
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-xs'
                        : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                    }\`}
                  >
                    <span className={\`w-2 h-2 rounded-full shrink-0 \${coupon.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}\`} />
                    <span className="truncate">
                      {coupon.isActive 
                        ? (lang === 'lo' ? 'ເປີດໃຊ້ງານ (Active)' : 'Active') 
                        : (lang === 'lo' ? 'ປິດຊົ່ວຄາວ (Paused)' : 'Paused')}
                    </span>
                  </button>
                </div>`;

if(content.includes(targetStr)) {
  fs.writeFileSync(path, content.replace(targetStr, replacementStr));
  console.log("Success");
} else {
  console.log("Target string not found.");
}
