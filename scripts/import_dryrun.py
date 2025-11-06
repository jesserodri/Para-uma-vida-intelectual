import re
import unicodedata
import csv
import sys
from pathlib import Path

HTML_PATH = Path(r"C:\Users\tipol\Desktop\backup jesse\Projetos\Para uma vida intelectual\index.html")
OUT_CSV = Path(r"C:\Users\tipol\Desktop\backup jesse\Projetos\Para uma vida intelectual\scripts\sample_import.csv")

html = HTML_PATH.read_text(encoding='utf-8')

# normalize similar to JS normalize()
import re

def normalize(s):
    s = str(s or '')
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-+', '-', s)
    s = s.strip('-')
    return s

# extract sections
section_pattern = re.compile(r'<section[^>]*class="[^"]*squarIndex[^"]*"[^>]*id="([^"]+)"[^>]*>(.*?)</section>', re.S | re.I)
ul_pattern = re.compile(r'<ul[^>]*class="[^"]*textoIntrodução[^"]*"[^>]*>(.*?)</ul>', re.S | re.I)
li_pattern = re.compile(r'<li>(.*?)</li>', re.S | re.I)

def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s).strip()

book_index = {}

for sec_id, sec_html in section_pattern.findall(html):
    lists = ul_pattern.findall(sec_html)
    for lst in lists:
        for li in li_pattern.findall(lst):
            text = strip_tags(li)
            if not text: continue
            slug = normalize(text)[:60] or 'item'
            book_id = f"{sec_id}-{slug}"
            book_index[book_id] = {'title': text, 'section': sec_id}

# prepare sample CSV: pick up to 4 known ids and add an unknown
known_ids = list(book_index.keys())[:4]
rows = []
for i, bid in enumerate(known_ids):
    # alternate read values
    rows.append({'bookId': bid, 'title': book_index[bid]['title'], 'sectionId': book_index[bid]['section'], 'read': '1' if i % 2 == 0 else '0'})
rows.append({'bookId': 'unknown-book-123', 'title': 'Livro Desconhecido', 'sectionId': 'geral', 'read': '1'})

# write CSV
with OUT_CSV.open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['bookId','title','sectionId','read'])
    writer.writeheader()
    for r in rows:
        writer.writerow(r)

# now perform dry-run: assume current state: none read (no localStorage available here)
records = rows
known = []
unknown = []
to_mark = []
to_unmark = []
for rec in records:
    bid = rec.get('bookId','').strip()
    desired = str(rec.get('read','')).strip().lower() in ('1','true','yes','sim')
    if not bid:
        unknown.append({'rec': rec, 'reason': 'missing id'})
        continue
    entry = book_index.get(bid)
    if not entry:
        unknown.append({'rec': rec, 'reason': 'not found'})
        continue
    known.append({'rec': rec, 'entry': entry})
    currently = False
    if desired and not currently:
        to_mark.append({'entry': entry, 'rec': rec})
    if (not desired) and currently:
        to_unmark.append({'entry': entry, 'rec': rec})

summary = {
    'total': len(records),
    'known': len(known),
    'unknown': len(unknown),
    'toMark': len(to_mark),
    'toUnmark': len(to_unmark)
}

print('Sample CSV written to:', OUT_CSV)
print('\n--- Sample CSV contents ---')
print(OUT_CSV.read_text(encoding='utf-8'))
print('\n--- Dry-run summary ---')
for k,v in summary.items():
    print(f"{k}: {v}")

if known:
    print('\nKnown records:')
    for k in known:
        print('-', k['rec']['bookId'], '->', k['entry']['title'])
if unknown:
    print('\nUnknown records:')
    for u in unknown:
        print('-', u['rec']['bookId'], 'reason=', u['reason'])

print('\nTo mark (will be marked on apply):')
for t in to_mark:
    print('-', t['rec']['bookId'], '->', t['entry']['title'])

print('\nTo unmark (will be unmarked on apply):')
for t in to_unmark:
    print('-', t['rec']['bookId'], '->', t['entry']['title'])

