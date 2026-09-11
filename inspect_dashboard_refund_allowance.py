with open("Frontend/src/pages/Dashboard.tsx", "r") as f:
    code = f.read()

# Let's inspect isRefundEligible in Dashboard.tsx:
# Currently:
# const isRefundEligible = (ticket: PurchasedTicket): boolean => {
#   const eventDateStr = ticket.selectedDate || ticket.event?.date;
#   ...
# }
# If ticket.event?.allowRefunds === false:
# the event organizer has disabled refunds for this event!
# Let's update isRefundEligible:
# if (ticket.event && ticket.event.allowRefunds === false) {
#   return false;
# }
#
# And in handleRefundTicket:
# if (ticket.event && ticket.event.allowRefunds === false) {
#   alert(lang === 'lo' ? 'ຜູ້ຈັດງານບໍ່ອະນຸຍາດໃຫ້ຄືນເງິນສຳລັບກິດຈະກຳນີ້' : 'The event organizer does not allow refunds for this event.');
#   return;
# }
#
# And in the refund button tooltip/display:
# If ticket.event?.allowRefunds === false:
# title={lang === 'lo' ? 'ຜູ້ຈັດງານປິດການຄືນເງິນ' : 'Refund disabled by organizer'}
