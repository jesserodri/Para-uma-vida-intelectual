// main.js
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.squarIndex');

    sections.forEach(section => {
        section.addEventListener('click', () => {
            sections.forEach(s => s.classList.remove('open'));
            section.classList.add('open');
        });

        // opcional: permitir ativar com Enter/Space para acessibilidade
        section.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sections.forEach(s => s.classList.remove('open'));
                section.classList.add('open');
            }
        });
    });

    // handler para a âncora que abre a section com id="guia"
    const guiaLink = document.querySelector('a[href="#guia"], a#guia');
    if (guiaLink) {
        guiaLink.addEventListener('click', (e) => {
            e.preventDefault();
            sections.forEach(s => s.classList.remove('open'));
            const target = document.getElementById('guia') || document.querySelector('section#guia');
            if (target) {
                target.classList.add('open');
                // opcional: levar a section para a tela
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // se quiser atualizar a hash no URL sem pular:
            history.replaceState(null, '', '#guia');
        });
    }
});

    const geralLink = document.querySelector('a[href="#geral"], a#geral');
    if (geralLink) {
        geralLink.addEventListener('click', (e) => {
            e.preventDefault();
            sections.forEach(s => s.classList.remove('open'));
            const target = document.getElementById('geral') || document.querySelector('section#geral');
            if (target) {
                target.classList.add('open');
                // opcional: levar a section para a tela
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // se quiser atualizar a hash no URL sem pular:
            history.replaceState(null, '', '#geral');
        });
    };

    const filosofosLink = document.querySelector('a[href="#filosofos"], a#filosofos');
    if (filosofosLink) {
        filosofosLink.addEventListener('click', (e) => {
            e.preventDefault();
            sections.forEach(s => s.classList.remove('open'));
            const target = document.getElementById('filosofos') || document.querySelector('section#filosofos');
            if (target) {
                target.classList.add('open');
                // opcional: levar a section para a tela
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // se quiser atualizar a hash no URL sem pular:
            history.replaceState(null, '', '#filosofos');
        });
    };
    const romaLink = document.querySelector('a[href="#roma1"], a#historiaRoma');
    if (romaLink) {
        romaLink.addEventListener('click', (e) => {
            e.preventDefault();
            sections.forEach(s => s.classList.remove('open'));
            const target = document.getElementById('historiaRoma') || document.querySelector('section#historiaRoma');
            if (target) {
                target.classList.add('open');
                // opcional: levar a section para a tela
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // se quiser atualizar a hash no URL sem pular:
            history.replaceState(null, '', '#roma1');
        });
    };
    const idadeMediaLink = document.querySelector('a[href="#idadeMedia"], a#historiaIdadeMedia');
    if (idadeMediaLink) {
        idadeMediaLink.addEventListener('click', (e) => {
            e.preventDefault();
            sections.forEach(s => s.classList.remove('open'));
            const target = document.getElementById('historiaIdadeMedia') || document.querySelector('section#historiaIdadeMedia');
            if (target) {
                target.classList.add('open');
                // opcional: levar a section para a tela
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // se quiser atualizar a hash no URL sem pular:
            history.replaceState(null, '', '#historiaIdadeMedia');
        });
    };

    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const header = section.querySelector('h2'); 
        if (header) {
            const link = document.createElement('a');
            link.href = `#${section.id}`;
            link.textContent = header.textContent;
            header.innerHTML = '';
            header.appendChild(link);
        }
    });
