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
            // contador
            const counter = document.createElement('span');
            counter.className = 'read-counter';
            counter.textContent = 'Lidos: 0/0';

            controls.appendChild(btn);
            controls.appendChild(counter);
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
                        // atualizar badge no nav
                        updateNavBadge(section.id, read, total);
                    };

            // ação do botão: alterna todos os checkboxes desta seção
            btn.addEventListener('click', () => {
                const total = sectionBookItems.length;
                if (total === 0) return;
                const allRead = sectionBookItems.every(li => li.classList.contains('read'));
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
            label.setAttribute('for', checkbox.id);
            label.className = 'book-label';

            const contentSpan = document.createElement('span');
            contentSpan.className = 'book-title';
            while (li.firstChild) {
                contentSpan.appendChild(li.firstChild);
            }
            label.appendChild(contentSpan);

            // inserir checkbox antes do label for left-side appearance
            li.appendChild(checkbox);
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
