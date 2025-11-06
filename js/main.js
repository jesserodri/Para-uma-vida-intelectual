// main.js — controla abertura de sections e subcategorias (acordeão)
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.squarIndex');

    const normalize = (str) => str
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFKD') // remove acentos
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

        // registry para controlar seções, itens e controles (usado para badges/atualizações)
        const sectionRegistry = new Map();

        // Abre apenas uma section por vez
        sections.forEach(section => {
            section.addEventListener('click', (e) => {
                sections.forEach(s => s.classList.remove('open'));
                section.classList.add('open');
                // abrir primeira subcategoria automaticamente
                openFirstSubcategory(section);
            });

        // tratar subcategorias dentro da section: primeiro <ul> em #start é a lista de categorias
        const startDiv = section.querySelector('#start');
        if (!startDiv) return;
        const sublist = startDiv.querySelector('ul');
        if (!sublist) return;

        const contentLists = Array.from(startDiv.querySelectorAll('ul.textoIntrodução'));

        // garantir que cada content list tenha um id-base armazenado em data-orig-id
        contentLists.forEach((el, idx) => {
            if (!el.dataset.origId) {
                if (el.id) {
                    el.dataset.origId = el.id.replace(/Open$/, '');
                    el.id = el.dataset.origId; // normaliza (remove eventual "Open")
                } else {
                    el.dataset.origId = `${section.id || 'section'}-content-${idx}`;
                    el.id = el.dataset.origId;
                }
            }
        });

        // quando clicar em uma subcategoria, abre o conteúdo correspondente e fecha os outros
        const items = Array.from(sublist.querySelectorAll('li'));
        items.forEach((li, idx) => {
            const a = li.querySelector('a');
            const handler = (ev) => {
                ev.preventDefault();
                // fechar todas as contentLists desta seção
                contentLists.forEach(cl => {
                    cl.classList.remove('openIntro');
                    cl.id = cl.dataset.origId; // remove 'Open' do id
                });

                // abrir a contentList correspondente (se existir)
                const target = contentLists[idx];
                if (target) {
                    target.classList.add('openIntro');
                    target.id = `${target.dataset.origId}Open`;
                }
            };

            if (a) {
                a.addEventListener('click', handler);
                // permitir teclado
                li.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handler(e);
                    }
                });
            }
        });

        // --- Flags de leitura e controles por seção
        const sectionBookItems = contentLists.flatMap(cl => Array.from(cl.querySelectorAll('li')));

        // cria área de controles (botão + contador) se não existir
        let controls = startDiv.querySelector('.section-controls');
        if (!controls) {
            controls = document.createElement('div');
            controls.className = 'section-controls';
                    // botão marcar/desmarcar tudo
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'mark-all-btn';
                    btn.textContent = 'Marcar tudo';
                    // filtro (All / Lidos / Não lidos)
                    const filter = document.createElement('select');
                    filter.className = 'section-filter';
                    filter.title = 'Filtrar itens';
                    ['Todos','Lidos','Não lidos'].forEach(opt => {
                        const o = document.createElement('option'); o.value = opt.toLowerCase(); o.textContent = opt; filter.appendChild(o);
                    });
                    // initial visual state: mark filter when 'todos' is selected so we can style it
                    if (filter.value === 'todos') filter.classList.add('filter-todos');
                    // exportar CSV (apenas lidos)
                    const exportBtn = document.createElement('button');
                    exportBtn.type = 'button';
                    exportBtn.className = 'export-btn';
                    exportBtn.textContent = 'Exportar CSV (lidos)';
                    // import por seção
                    const importSectionBtn = document.createElement('button');
                    importSectionBtn.type = 'button';
                    importSectionBtn.className = 'import-section-btn';
                    importSectionBtn.textContent = 'Importar CSV (seção)';
                    importSectionBtn.title = 'Importar CSV apenas para esta seção';
                    // input file escondido para esta seção
                    const importInputSection = document.createElement('input');
                    importInputSection.type = 'file';
                    importInputSection.accept = '.csv,text/csv';
                    importInputSection.style.display = 'none';
                    // anexar input ao controls (não visível)
                    controls.appendChild(importInputSection);
                    // contador
                    const counter = document.createElement('span');
                    counter.className = 'read-counter';
                    counter.textContent = 'Lidos: 0/0';

            // layout: left area contains counter, right area contains filter/export/import/btn
            const leftArea = document.createElement('div');
            leftArea.className = 'controls-left';
            const rightArea = document.createElement('div');
            rightArea.className = 'controls-right';

            leftArea.appendChild(counter);
            rightArea.appendChild(filter);
            rightArea.appendChild(exportBtn);
            rightArea.appendChild(importSectionBtn);
            rightArea.appendChild(btn);

            controls.appendChild(leftArea);
            controls.appendChild(rightArea);
            // inserir antes da sublist para ficar visível
            startDiv.insertBefore(controls, sublist);

                            // função para atualizar contador e texto do botão
                            const updateCounter = () => {
                                const total = sectionBookItems.length;
                                const read = sectionBookItems.reduce((acc, li) => {
                                    return acc + (li.classList.contains('read') ? 1 : 0);
                                }, 0);
                                counter.textContent = `Lidos: ${read}/${total}`;
                                btn.textContent = (read === total && total > 0) ? 'Desmarcar tudo' : 'Marcar tudo';
                                // animação sutil no contador
                                counter.classList.add('pulse');
                                setTimeout(() => counter.classList.remove('pulse'), 350);
                                // atualizar badge no nav
                                updateNavBadge(section.id, read, total);
                                // atualizar resumo global
                                updateGlobalSummary();
                            };

                            // ação do botão: alterna todos os checkboxes desta seção (com confirmação)
            btn.addEventListener('click', () => {
                                const total = sectionBookItems.length;
                                if (total === 0) return;
                                const allRead = sectionBookItems.every(li => li.classList.contains('read'));
                                const action = allRead ? 'desmarcar' : 'marcar';
                                showConfirmation(`Deseja ${action} todos os livros desta seção?`, (confirmed) => {
                                    if (!confirmed) return;
                                    // capturar estado anterior para permitir undo
                                    const prevStates = sectionBookItems.map(li => ({ id: li.dataset.bookId, wasRead: li.classList.contains('read') }));
                                    sectionBookItems.forEach(li => {
                                        const bookId = li.dataset.bookId;
                                        const cb = li.querySelector('input.read-checkbox');
                                        if (allRead) {
                                            // desmarcar tudo
                                            if (cb) cb.checked = false;
                                            li.classList.remove('read');
                                            localStorage.removeItem(`book-read:${bookId}`);
                                        } else {
                                            // marcar tudo
                                            if (cb) cb.checked = true;
                                            li.classList.add('read');
                                            localStorage.setItem(`book-read:${bookId}`, '1');
                                        }
                                    });
                                    updateCounter();
                                    // oferecer desfazer via snackbar
                                    showSnackbar(allRead ? 'Todos desmarcados' : 'Todos marcados', 'Desfazer', 8000, () => {
                                        // restaurar prevStates
                                        prevStates.forEach(p => {
                                            const li = document.querySelector(`li[data-book-id="${p.id}"]`);
                                            if (!li) return;
                                            const cb = li.querySelector('input.read-checkbox');
                                            if (p.wasRead) {
                                                if (cb) cb.checked = true;
                                                li.classList.add('read');
                                                localStorage.setItem(`book-read:${p.id}`, '1');
                                            } else {
                                                if (cb) cb.checked = false;
                                                li.classList.remove('read');
                                                localStorage.removeItem(`book-read:${p.id}`);
                                            }
                                        });
                                        // atualizar contador e global
                                        const reg = sectionRegistry.get(section.id);
                                        if (reg && reg.controls && typeof reg.controls.updateCounter === 'function') reg.controls.updateCounter();
                                        updateGlobalSummary();
                                    });
                                });
            });

                            // tooltip
                            btn.title = 'Marcar/Desmarcar todos os livros desta seção';
                                    // exportar CSV apenas com os lidos desta seção
                                    exportBtn.addEventListener('click', () => {
                                        const rows = [];
                                        sectionBookItems.forEach(li => {
                                            if (li.classList.contains('read')) {
                                                const title = li.querySelector('.book-title')?.textContent?.trim() || li.textContent.trim();
                                                rows.push({section: section.id || '', title, id: li.dataset.bookId || ''});
                                            }
                                        });
                                        if (rows.length === 0) {
                                            alert('Não há livros marcados como lidos nesta seção.');
                                            return;
                                        }
                                        const csv = ['section,title,id'].concat(rows.map(r => `${escapeCSV(r.section)},${escapeCSV(r.title)},${escapeCSV(r.id)}`)).join('\n');
                                        const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${section.id || 'section'}-lidos-${filenameTimestamp()}.csv`;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        URL.revokeObjectURL(url);
                                    });

                                    // import por seção: reusa a rotina importCSVFile com sectionId
                                    importSectionBtn.addEventListener('click', () => importInputSection.click());
                                    importInputSection.addEventListener('change', async (ev) => {
                                        const f = ev.target.files && ev.target.files[0]; if (!f) return;
                                        try {
                                            const dry = await importCSVFile(f, {dryRun:true, sectionId: section.id});
                                            const s = dry.summary;
                                            const msg = `Dry-run (seção ${section.id}): total ${s.total}, matches ${s.known}, unknown ${s.unknown}, to mark ${s.toMark}, to unmark ${s.toUnmark}. Aplicar?`;
                                            if (confirm(msg)) {
                                                const applied = await importCSVFile(f, {dryRun:false, sectionId: section.id});
                                                if (applied.undo) showSnackbar('Import aplicado (seção)', 'Desfazer', 7000, () => { applied.undo(); });
                                                alert('Import aplicado: ' + JSON.stringify(applied.summary));
                                            } else { alert('Import cancelado.'); }
                                        } catch (err) { alert('Erro ao importar: ' + (err && err.message)); }
                                        importInputSection.value = '';
                                    });

                                    // filter change: mostrar apenas lidos / não lidos / todos
                                    filter.addEventListener('change', () => {
                                        const v = filter.value; // 'todos'|'lidos'|'não lidos'
                                        // toggle visual class for 'Todos'
                                        filter.classList.toggle('filter-todos', v === 'todos');
                                        sectionBookItems.forEach(li => {
                                            if (v === 'todos') li.style.display = '';
                                            else if (v === 'lidos') li.style.display = li.classList.contains('read') ? '' : 'none';
                                            else if (v === 'não lidos') li.style.display = li.classList.contains('read') ? 'none' : '';
                                            else li.style.display = '';
                                        });
                                    });

                                    // salvar a função para ser usada abaixo
                                    controls.updateCounter = updateCounter;
        }

        // injetar checkboxes em todos os itens desta seção
        sectionBookItems.forEach((li, idx) => {
            if (!li.dataset.bookId) {
                const sectionId = section.id || 'section';
                const text = li.textContent || li.innerText || `item-${idx}`;
                const slug = normalize(text).slice(0, 60) || `item-${idx}`;
                li.dataset.bookId = `${sectionId}-${slug}`;
            }
            const bookId = li.dataset.bookId;
            if (li.querySelector('input.read-checkbox')) return; // já processado


                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'read-checkbox';
                    checkbox.id = `chk-${bookId}`;

                    const label = document.createElement('label');
                    label.className = 'book-label';
                    label.setAttribute('for', checkbox.id);

                    const custom = document.createElement('span');
                    custom.className = 'custom-checkbox';

                    const contentSpan = document.createElement('span');
                    contentSpan.className = 'book-title';
                    while (li.firstChild) {
                        contentSpan.appendChild(li.firstChild);
                    }

                    // estrutura: label contains input, custom checkbox and title
                    label.appendChild(checkbox);
                    label.appendChild(custom);
                    label.appendChild(contentSpan);
                    // append label to li (checkbox is inside label)
                    li.appendChild(label);

            // restaurar estado salvo
            const saved = localStorage.getItem(`book-read:${bookId}`);
            if (saved === '1') {
                checkbox.checked = true;
                li.classList.add('read');
            }

                            checkbox.addEventListener('change', () => {
                        if (checkbox.checked) {
                            li.classList.add('read');
                            localStorage.setItem(`book-read:${bookId}`, '1');
                        } else {
                            li.classList.remove('read');
                            localStorage.removeItem(`book-read:${bookId}`);
                        }
                        // atualizar contador da seção
                        const parentControls = li.closest('#start')?.querySelector('.section-controls');
                                if (parentControls && typeof parentControls.updateCounter === 'function') parentControls.updateCounter();
                    });

                    // registrar no índice global de livros para facilitar importações
                    window._bookIndex = window._bookIndex || {};
                    try {
                        window._bookIndex[bookId] = { bookId, li, checkbox, sectionId: section.id || '', title: contentSpan.textContent.trim() };
                    } catch (err) {
                        // segurança: se algo falhar, não interrompe o restante
                        console && console.warn && console.warn('index register error', err);
                    }
        });

            // registrar seção para atualizações e atualizar contador inicial
            sectionRegistry.set(section.id, {
                items: sectionBookItems,
                controls: startDiv.querySelector('.section-controls'),
                startDiv,
                contentLists
            });
                const parentControls = startDiv.querySelector('.section-controls');
                if (parentControls && typeof parentControls.updateCounter === 'function') parentControls.updateCounter();
    });

            // cria elemento resumo global no header
            function ensureGlobalSummary() {
                let el = document.querySelector('.global-summary');
                if (!el) {
                    const header = document.querySelector('header');
                    if (!header) return null;
                        el = document.createElement('div');
                        el.className = 'global-summary';
                        const span = document.createElement('span');
                        span.className = 'global-summary-text';
                        span.textContent = 'Total lidos: 0/0';
                        const exportAll = document.createElement('button');
                        exportAll.type = 'button';
                        exportAll.className = 'export-all-btn';
                        exportAll.textContent = 'Exportar todos (lidos)';
                        exportAll.title = 'Exportar todos os livros marcados como lidos (todas as seções)';
                        // Import all (CSV) button next to export
                        const importAll = document.createElement('button');
                        importAll.type = 'button';
                        importAll.className = 'import-all-btn';
                        importAll.textContent = 'Importar todos (CSV)';
                        importAll.title = 'Importar CSV para atualizar marcações (todas as seções)';
                        // hidden file input for global import (attached to global summary)
                        const importAllInput = document.createElement('input');
                        importAllInput.type = 'file';
                        importAllInput.accept = '.csv,text/csv';
                        importAllInput.style.display = 'none';
                        // wire importAll: click -> open file picker
                        importAll.addEventListener('click', () => importAllInput.click());
                        importAllInput.addEventListener('change', async (ev) => {
                            const f = ev.target.files && ev.target.files[0]; if (!f) return;
                            try {
                                const dry = await importCSVFile(f, {dryRun:true});
                                const s = dry.summary;
                                const msg = `Dry-run: total ${s.total}, matches ${s.known}, unknown ${s.unknown}, to mark ${s.toMark}, to unmark ${s.toUnmark}. Aplicar?`;
                                if (confirm(msg)) {
                                    const applied = await importCSVFile(f, {dryRun:false});
                                    if (applied.undo) showSnackbar('Import aplicado (todos)', 'Desfazer', 7000, () => { applied.undo(); });
                                    alert('Import aplicado: ' + JSON.stringify(applied.summary));
                                } else { alert('Import cancelado.'); }
                            } catch (err) { alert('Erro ao importar: ' + (err && err.message)); }
                            importAllInput.value = '';
                        });
                        exportAll.addEventListener('click', () => {
                            // coletar todos lidos
                            const rows = [];
                            for (const [, info] of sectionRegistry) {
                                info.items.forEach(li => {
                                    if (li.classList.contains('read')) {
                                        const title = li.querySelector('.book-title')?.textContent?.trim() || li.textContent.trim();
                                        rows.push({section: (li.closest('.squarIndex')?.id || ''), title, id: li.dataset.bookId || ''});
                                    }
                                });
                            }
                            if (rows.length === 0) { alert('Não há livros lidos para exportar.'); return; }
                            const csv = ['section,title,id'].concat(rows.map(r => `${escapeCSV(r.section)},${escapeCSV(r.title)},${escapeCSV(r.id)}`)).join('\n');
                            const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url; a.download = `todos-lidos-${filenameTimestamp()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                        });
                        el.appendChild(span);
                        header.appendChild(el);

                        // create actions container on the right for export/import buttons
                        const actionsEl = document.createElement('div');
                        actionsEl.className = 'global-actions';
                        actionsEl.appendChild(exportAll);
                        actionsEl.appendChild(importAllInput);
                        actionsEl.appendChild(importAll);
                        header.appendChild(actionsEl);
                }
                return el;
            }

            // atualizar resumo global (soma de todas as seções)
            function updateGlobalSummary() {
                const el = ensureGlobalSummary();
                if (!el) return;
                let total = 0, read = 0;
                for (const [, info] of sectionRegistry) {
                    total += info.items.length;
                    read += info.items.reduce((acc, li) => acc + (li.classList.contains('read') ? 1 : 0), 0);
                }
                const span = el.querySelector('.global-summary-text');
                if (span) span.textContent = `Total lidos: ${read}/${total}`;
                else el.textContent = `Total lidos: ${read}/${total}`;
            }

        // função para abrir a primeira subcategoria de uma seção (se houver)
        function openFirstSubcategory(section) {
            const startDiv = section.querySelector('#start');
            if (!startDiv) return;
            const contentLists = Array.from(startDiv.querySelectorAll('ul.textoIntrodução'));
            if (!contentLists || contentLists.length === 0) return;
            // se já houver uma aberta, não mudar
            if (contentLists.some(cl => cl.classList.contains('openIntro'))) return;
            const first = contentLists[0];
            first.classList.add('openIntro');
            first.id = `${first.dataset.origId || first.id}Open`;
        }

        // atualiza/insere badge no nav para a seção
        function updateNavBadge(sectionId, read = 0, total = 0) {
            if (!sectionId) return;
            // procurar link no nav que aponte para essa section
            let link = document.querySelector(`header nav a[href="#${sectionId}"]`);
            if (!link) {
                // procurar por id do link igual ao sectionId
                link = document.querySelector(`header nav a#${sectionId}`);
            }
            if (!link) {
                // fallback: procurar link cujo texto contenha parte do sectionId
                const maybe = Array.from(document.querySelectorAll('header nav a')).find(a => a.textContent.toLowerCase().includes(sectionId.replace(/[^a-z]/g, '').toLowerCase()));
                link = maybe || null;
            }
            if (!link) return;
            let badge = link.querySelector('.nav-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'nav-badge';
                link.appendChild(badge);
            }
            badge.textContent = total > 0 ? `${read}/${total}` : '';
        }

        // sincroniza entre abas: quando localStorage mudar em outra aba
        window.addEventListener('storage', (e) => {
            if (!e.key || !e.key.startsWith('book-read:')) return;
            const bookId = e.key.replace('book-read:', '');
            // encontrar o li correspondente
            const li = document.querySelector(`li[data-book-id="${bookId}"]`);
            if (li) {
                const cb = li.querySelector('input.read-checkbox');
                if (e.newValue === '1') {
                    if (cb) cb.checked = true;
                    li.classList.add('read');
                } else {
                    if (cb) cb.checked = false;
                    li.classList.remove('read');
                }
                // atualizar contador da seção correspondente
                const section = li.closest('.squarIndex');
                const reg = section && sectionRegistry.get(section.id);
                if (reg && reg.controls && typeof reg.controls.updateCounter === 'function') reg.controls.updateCounter();
            }
        });

            // helper: escape CSV fields
            function escapeCSV(s) {
                if (s == null) return '';
                const str = String(s).replace(/"/g, '""');
                return `"${str}"`;
            }

            // helper: timestamp for filenames
            function filenameTimestamp() {
                const d = new Date();
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth()+1).padStart(2,'0');
                const dd = String(d.getDate()).padStart(2,'0');
                const hh = String(d.getHours()).padStart(2,'0');
                const min = String(d.getMinutes()).padStart(2,'0');
                return `${yyyy}-${mm}-${dd}_${hh}${min}`;
            }

            // modal confirmation utility (uses static markup in index.html)
            function showConfirmation(message, cb) {
                const overlay = document.querySelector('.confirm-overlay');
                if (!overlay) {
                    // fallback: create quick confirm
                    const ok = confirm(message);
                    cb(ok);
                    return;
                }
                const msgEl = overlay.querySelector('.confirm-msg');
                const yesBtn = overlay.querySelector('.confirm-yes');
                const noBtn = overlay.querySelector('.confirm-no');

                function cleanup() {
                    yesBtn.removeEventListener('click', onYes);
                    noBtn.removeEventListener('click', onNo);
                    overlay.removeEventListener('click', onOverlay);
                    overlay.style.display = 'none';
                }
                function onYes(e){ e.stopPropagation(); cleanup(); cb(true); }
                function onNo(e){ e.stopPropagation(); cleanup(); cb(false); }
                function onOverlay(e){ if (e.target === overlay) { cleanup(); cb(false); } }

                msgEl.textContent = message;
                overlay.style.display = 'flex';
                yesBtn.addEventListener('click', onYes);
                noBtn.addEventListener('click', onNo);
                overlay.addEventListener('click', onOverlay);
            }

            // --- CSV import utilities ---
            // Parse CSV into array of records (handles quoted fields and CRLF/LF)
            function parseCSV(text) {
                const rows = [];
                let cur = '';
                let row = [];
                let inQuotes = false;
                for (let i = 0; i < text.length; i++) {
                    const ch = text[i];
                    const nxt = text[i+1];
                    if (ch === '"') {
                        if (inQuotes && nxt === '"') { cur += '"'; i++; }
                        else inQuotes = !inQuotes;
                        continue;
                    }
                    if (!inQuotes && (ch === '\n' || ch === '\r')) {
                        if (ch === '\r' && nxt === '\n') { /* skip, will be handled */ }
                        if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); row = []; cur = ''; }
                        continue;
                    }
                    if (!inQuotes && ch === ',') { row.push(cur); cur = ''; continue; }
                    cur += ch;
                }
                if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); }
                if (rows.length === 0) return [];
                const headers = rows[0].map(h => h.trim());
                const out = [];
                for (let r = 1; r < rows.length; r++) {
                    const cells = rows[r];
                    if (cells.length === 1 && cells[0] === '') continue; // skip empty
                    const obj = {};
                    for (let c = 0; c < headers.length; c++) obj[headers[c]] = (cells[c] !== undefined) ? cells[c].trim() : '';
                    out.push(obj);
                }
                return out;
            }

            function csvReadValue(v) {
                if (v === undefined || v === null) return false;
                const s = String(v).trim().toLowerCase();
                return s === '1' || s === 'true' || s === 'yes' || s === 'sim';
            }

            // applyImport: dryRun=true returns summary; dryRun=false applies changes and returns undo
            async function applyImport(records, {dryRun=true, onProgress=null} = {}) {
                window._bookIndex = window._bookIndex || {};
                const known = [], unknown = [], toMark = [], toUnmark = [];
                for (const rec of records) {
                    const bookId = (rec.bookId || rec.bookid || rec.id || '').trim();
                    if (!bookId) { unknown.push({rec, reason: 'missing id'}); continue; }
                    const entry = window._bookIndex[bookId];
                    const desiredRead = csvReadValue(rec.read || rec.Read || rec.reading);
                    if (!entry) { unknown.push({rec, reason: 'not found'}); continue; }
                    known.push({rec, entry});
                    const currentlyRead = !!entry.checkbox.checked;
                    if (desiredRead && !currentlyRead) toMark.push({entry, rec});
                    if (!desiredRead && currentlyRead) toUnmark.push({entry, rec});
                }
                const summary = { total: records.length, known: known.length, unknown: unknown.length, toMark: toMark.length, toUnmark: toUnmark.length };
                if (dryRun) return { summary, details: { known, unknown, toMark, toUnmark } };

                // apply changes, keep previous states for undo
                const previous = {};
                [...toMark, ...toUnmark].forEach(it => { previous[it.entry.bookId] = !!it.entry.checkbox.checked; });
                for (const itm of toMark) {
                    const e = itm.entry; e.checkbox.checked = true; e.li.classList.add('read'); localStorage.setItem(`book-read:${e.bookId}`, '1'); if (onProgress) onProgress(itm);
                }
                for (const itm of toUnmark) {
                    const e = itm.entry; e.checkbox.checked = false; e.li.classList.remove('read'); localStorage.removeItem(`book-read:${e.bookId}`); if (onProgress) onProgress(itm);
                }
                // refresh counters/badges
                if (typeof updateGlobalSummary === 'function') updateGlobalSummary();
                return { summary, undo: () => {
                    for (const k of Object.keys(previous)) {
                        const was = previous[k]; const e = window._bookIndex[k]; if (!e) continue;
                        e.checkbox.checked = !!was; if (e.checkbox.checked) { e.li.classList.add('read'); localStorage.setItem(`book-read:${k}`, '1'); } else { e.li.classList.remove('read'); localStorage.removeItem(`book-read:${k}`); }
                    }
                    if (typeof updateGlobalSummary === 'function') updateGlobalSummary();
                }};
            }

            function importCSVFile(file, {dryRun=true, sectionId=null} = {}) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                        try {
                            const text = ev.target.result;
                            const records = parseCSV(text);
                            const filtered = sectionId ? records.filter(r => (r.sectionId || r.sectionid || '').trim() === sectionId) : records;
                            const res = await applyImport(filtered, {dryRun});
                            resolve(res);
                        } catch (err) { reject(err); }
                    };
                    reader.onerror = (e) => reject(e);
                    reader.readAsText(file, 'utf-8');
                });
            }

            // global import wiring removed: use the Import button in the global summary instead

            // snackbar undo utility
            let lastUndo = null;
            function showSnackbar(message, actionText, timeout = 8000, onAction) {
                let sb = document.querySelector('.snackbar'); if (sb) sb.remove();
                sb = document.createElement('div'); sb.className = 'snackbar';
                const msg = document.createElement('span'); msg.textContent = message; sb.appendChild(msg);
                if (actionText) {
                    const act = document.createElement('button'); act.className = 'snackbar-action'; act.textContent = actionText;
                    act.addEventListener('click', () => { if (onAction) onAction(); sb.remove(); if (lastUndo && lastUndo.timeout) { clearTimeout(lastUndo.timeout); lastUndo = null; } });
                    sb.appendChild(act);
                }
                document.body.appendChild(sb);
                const t = setTimeout(() => { sb.remove(); lastUndo = null; }, timeout);
                lastUndo = { element: sb, timeout: t, onAction };
                return lastUndo;
            }

    // links de navegação no header: abrem a section correspondente
    const navLinks = document.querySelectorAll('header nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href') || `#${link.id}`;
            const targetId = href.startsWith('#') ? href.slice(1) : href;
            sections.forEach(s => s.classList.remove('open'));
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.add('open');
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', `#${targetId}`);
            }
        });
    });

});
