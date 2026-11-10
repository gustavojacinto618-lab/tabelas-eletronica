# Eletrônica de Bolso

Aplicativo estático instalável (PWA), em português brasileiro, com consulta de resistores, capacitores e transistores. Funciona offline depois da primeira visita.

## Instalar no Android

1. Abra o link do app no Chrome do Android.
2. Aguarde a página carregar uma vez com conexão.
3. Toque no menu ⋮ e selecione **Instalar app** ou **Adicionar à tela inicial**.

Ao publicar atualizações, aumente `CACHE_NAME` em `sw.js`.

## Gerar um APK futuramente

- **PWABuilder:** informe a URL pública em https://www.pwabuilder.com/ e gere o pacote Android.
- **Bubblewrap:** `bubblewrap init --manifest https://SEU-DOMINIO/manifest.json` e depois `bubblewrap build`.

## Aviso

Valores de transistores são faixas representativas de datasheets. Confirme sempre o datasheet exato antes de usar em projeto.
