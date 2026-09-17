with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# find exact block
target = "                  <span>{lang === 'lo' ? 'ຢືນຢັນເບີກຈ່າຍເງິນ' : 'Confirm & Claim'}</span>\n                </button>\n              </div>              </div>\n            </motion.div>\n          </motion.div>\n            )}"

replacement = "                  <span>{lang === 'lo' ? 'ຢືນຢັນເບີກຈ່າຍເງິນ' : 'Confirm & Claim'}</span>\n                </button>\n              </div>\n            </motion.div>\n          </motion.div>\n            )}"


if target in content:
    content = content.replace(target, replacement)
    with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed extra div!")
else:
    print("Could not find exact block.")
