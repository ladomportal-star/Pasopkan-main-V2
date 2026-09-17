with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """                  <span>{lang === 'lo' ? 'ຢືນຢັນເບີກຈ່າຍເງິນ' : 'Confirm & Claim'}</span>
                </button>
              </div>
              </div>
            </motion.div>
          </motion.div>
            )}"""

replacement = """                  <span>{lang === 'lo' ? 'ຢືນຢັນເບີກຈ່າຍເງິນ' : 'Confirm & Claim'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
            )}"""

if target in content:
    content = content.replace(target, replacement)
    with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed extra div!")
else:
    print("Could not find target block.")
