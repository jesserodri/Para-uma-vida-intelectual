# Para uma vida intelectual — Importação CSV

Este repositório contém uma página estática (`index.html`) com controles para marcar livros como lidos. Adicionei funcionalidades de exportação/importação CSV, por seção e global, incluindo dry-run e undo.

Este README explica como usar a importação CSV, exemplos de CSV e como testar localmente.

## Onde está a funcionalidade
- Botão global de import: no canto superior direito, ao lado de `Exportar todos (lidos)` (dentro do elemento `.global-summary`).
- Import por seção: cada seção tem um botão `Importar CSV (seção)` dentro de `.section-controls` (aplica apenas para essa seção).
- Export por seção e export global continuam disponíveis.

## Formato CSV recomendado
Use UTF-8 e inclua um cabeçalho. O formato recomendado é:

```
bookId,title,sectionId,read
```

- `bookId`: identificador estável usado internamente (o mesmo que aparece em `data-book-id` nos elementos `<li>`). Ex.: `geral-ideias-tem-consequencias-richard-weaver`.
- `title`: título legível (opcional para a operação, mas útil para verificação humana).
- `sectionId`: id da seção (ex.: `geral`, `filosofos`) — usado pelo import por seção (pode ser vazio para import global).
- `read`: `1` ou `0`, ou `true`/`false` (`sim`/`nao` também são aceitos). `1` marca como lido, `0` desmarca.

Exemplo de CSV válido:

```
bookId,title,sectionId,read
geral-ideias-tem-consequencias-richard-weaver,Ideias tem Consequências – Richard Weaver,geral,1
geral-como-ler-livros-mortimer-adler,Como Ler Livros – Mortimer Adler,geral,0
```

## Fluxo de importação
1. Clique em `Importar todos (CSV)` (global) ou `Importar CSV (seção)` para o comportamento por seção.
2. Selecione um arquivo CSV (UTF-8).
3. O sistema executa um `dry-run` que mostra um resumo: total de registros, quantos batem com livros existentes, quantos são desconhecidos, quantos serão marcados/desmarcados.
4. Confirme para aplicar. Ao aplicar, a alteração é gravada em `localStorage` (chaves do tipo `book-read:<bookId>`) e a UI é atualizada (checkbox + contador + badges).
5. Após aplicar, aparece um snackbar com uma opção `Desfazer` por alguns segundos — clicar desfaz as mudanças aplicadas pela importação.

## Como gerar um CSV de exemplo (automático)
Há um script Python incluído para gerar um CSV de exemplo e fazer um dry-run local (`scripts/import_dryrun.py`). Para usá-lo, execute (Windows / PowerShell):

```powershell
python .\scripts\import_dryrun.py
```

Ele cria `scripts/sample_import.csv` e imprime o resumo do dry-run com base no `index.html`.

## Observações importantes
- O import funciona melhor quando o CSV contém `bookId` exato. O `bookId` é gerado no carregamento da página pelo algoritmo `normalize()` em `js/main.js` (slugifica o title e prefixa com o id da seção). Se você não tiver `bookId`, posso implementar correspondência por `title` (fuzzy) — mas isso aumenta a chance de correspondências erradas.
- O import não executa código do CSV — apenas lê colunas previstas.
- Se estiver testando, use o mesmo navegador/perfil para que o `localStorage` e os checkboxes reflitam o estado real.

## Testes manuais recomendados
1. Abra `index.html` no navegador (arraste para o navegador ou sirva via um servidor estático simples).
2. Abra o console DevTools → Application → Local Storage e observe as chaves `book-read:*` antes e depois.
3. Use `Importar todos (CSV)` com `scripts/sample_import.csv` e confirme o dry-run; aplique e verifique os checkboxes.
4. Teste `Desfazer` no snackbar.
5. Teste `Importar CSV (seção)` para importar apenas para uma seção específica (o script filtra por `sectionId`).

## Próximos passos possíveis
- Adicionar correspondência por título (fuzzy) quando o `bookId` não estiver presente.
- Substituir `alert/confirm` por um modal detalhado mostrando as linhas que serão alteradas (útil para arquivos grandes).
- Registrar histórico de imports para auditoria/undo avançado.

Se quiser que eu implemente algum desses próximos passos, responda aqui com a letra correspondente (ex.: `fuzzy`, `modal`, `histórico`).

---
Arquivo gerados/alterados nesta sessão:
- `js/main.js` — import parsing/apply, per-section import, global import wiring (no summary), registro `_bookIndex`.
- `index.html` — removi o botão duplicado de import no header e adicionei os elementos estáticos para modal/snackbar.
- `css/style.css` — estilos para os botões/import/export e limpeza de estilos redundantes.
- `scripts/import_dryrun.py` — utilitário para gerar `scripts/sample_import.csv` e executar dry-run local.

Boa leitura — diga se quer que eu adicione o modal de pré-visualização do dry-run (recomendo para CSV maiores).
