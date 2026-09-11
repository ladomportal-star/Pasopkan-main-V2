with open("Frontend/src/pages/CreateEvent.tsx", "r") as f:
    code = f.read()

# Let's inspect activeStep === 4:
#
# <div className="space-y-4">
#   {/* Show Remaining Tickets */}
#   ...
#   {/* Require Every Ticket Info */}
#   ...
#   {/* Allow Refunds Toggle */}
#   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
#     <div>
#       <h4 className="text-adv-slate font-bold mb-1 flex items-center gap-2">
#         <span>{t.allowRefunds}</span>
#         <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
#           allowRefunds ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
#         }`}>
#           {allowRefunds ? (lang === 'lo' ? 'ເປີດໃຊ້ງານ' : 'Enabled') : (lang === 'lo' ? 'ປິດໃຊ້ງານ' : 'Disabled')}
#         </span>
#       </h4>
#       <p className="text-sm text-gray-500">{t.allowRefundsDesc}</p>
#     </div>
#     <button 
#       onClick={() => setAllowRefunds(!allowRefunds)}
#       className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${allowRefunds ? 'bg-adv-orange' : 'bg-gray-300'}`}
#       type="button"
#       title={allowRefunds ? (lang === 'lo' ? 'ກົດເພື່ອປິດການຄືນເງິນ' : 'Click to disable refunds') : (lang === 'lo' ? 'ກົດເພື່ອເປີດການຄືນເງິນ' : 'Click to enable refunds')}
#     >
#       <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${allowRefunds ? 'translate-x-5 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
#     </button>
#   </div>
#   ...
#   {/* Max Tickets Per User */}
# </div>
