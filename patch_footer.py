import re

with open('frontend/src/components/LandscapeEventCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '<div className="flex flex-col">'
replacement = '<div className="flex flex-col min-w-0 mr-2">'

if target in content:
    content = content.replace(target, replacement)
    
target2 = '<div className="flex items-baseline gap-1">'
replacement2 = '<div className="flex items-baseline gap-1 min-w-0">'

if target2 in content:
    content = content.replace(target2, replacement2)

target3 = '<span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">'
replacement3 = '<span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">'

if target3 in content:
    content = content.replace(target3, replacement3)

target4 = '<span className="text-sm sm:text-base md:text-lg font-bold text-adv-orange leading-tight">'
replacement4 = '<span className="text-sm sm:text-base md:text-lg font-bold text-adv-orange leading-tight truncate">'

if target4 in content:
    content = content.replace(target4, replacement4)

target5 = '<button className="text-[11px] sm:text-xs font-bold text-adv-orange group-hover:underline flex items-center gap-1">'
replacement5 = '<button className="shrink-0 text-[11px] sm:text-xs font-bold text-adv-orange group-hover:underline flex items-center gap-1">'

if target5 in content:
    content = content.replace(target5, replacement5)


with open('frontend/src/components/LandscapeEventCard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied truncate to footer")
