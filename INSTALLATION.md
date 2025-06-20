# Instalação Automática de Dependências

Este projeto agora inclui funcionalidades para instalar automaticamente o Python e a biblioteca `cloudscraper` necessários para o funcionamento.

## Métodos de Instalação

### 1. Instalação Automática via npm

Após instalar o pacote npm, as dependências Python serão instaladas automaticamente:

```bash
npm install cloudscraper.js
```

### 2. Scripts npm Disponíveis

```bash
# Instala apenas as dependências Python
npm run install-deps

# Instala usando script Python
npm run install-python

# Setup completo (build + instalação de dependências)
npm run setup
```

### 3. Instalação Programática

Você pode instalar as dependências programaticamente:

```javascript
const CloudScraper = require("cloudscraper.js");

async function setup() {
  const cloudscraper = new CloudScraper();

  try {
    // Instala Python e cloudscraper automaticamente
    await cloudscraper.installDependencies();
    console.log("✅ Dependências instaladas com sucesso!");
  } catch (error) {
    console.error("❌ Erro na instalação:", error.message);
  }
}

setup();
```

## Sistemas Operacionais Suportados

### macOS

- Instala Homebrew automaticamente se necessário
- Instala Python via Homebrew
- Instala cloudscraper via pip

### Linux

- Suporta múltiplos gerenciadores de pacotes:
  - apt (Ubuntu/Debian)
  - yum (CentOS/RHEL)
  - dnf (Fedora)
  - pacman (Arch Linux)
- Instala Python3 e pip
- Instala cloudscraper via pip

### Windows

- Requer instalação manual do Python
- Fornece instruções para download
- Instala cloudscraper via pip automaticamente

## Verificação de Dependências

O sistema verifica automaticamente:

1. Se Python está instalado (python3 ou python)
2. Se a biblioteca cloudscraper está disponível
3. Instala apenas o que está faltando

## Logs de Instalação

Durante a instalação, você verá logs detalhados:

- ✅ Dependências encontradas
- 🔍 Verificando instalações
- 📦 Instalando componentes
- ❌ Erros encontrados

## Exemplo Completo

```javascript
const CloudScraper = require("cloudscraper.js");

async function main() {
  const cloudscraper = new CloudScraper();

  try {
    // Instala dependências se necessário
    await cloudscraper.installDependencies();

    // Usa o cloudscraper normalmente
    const response = await cloudscraper.get("https://example.com");
    console.log("Status:", response.status);
    console.log("Dados:", response.text());
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

main();
```

## Troubleshooting

### Erro: "Python não encontrado"

- Execute `npm run install-deps` para instalação automática
- Ou instale Python manualmente e execute `npm run install-python`

### Erro: "Falha na instalação do cloudscraper"

- Verifique se você tem permissões de administrador
- Tente executar com `sudo` no Linux/macOS
- Verifique sua conexão com a internet

### Erro no Windows

- Instale Python manualmente de https://www.python.org/downloads/
- Marque "Add Python to PATH" durante a instalação
- Execute `npm run install-python` após a instalação

## Scripts Individuais

### scripts/install-dependencies.js

Script Node.js completo para instalação automática de Python e cloudscraper.

### scripts/install-python.py

Script Python simples para instalar apenas a biblioteca cloudscraper.

## Notas Importantes

- A instalação automática requer permissões de administrador em alguns sistemas
- No Windows, a instalação do Python deve ser feita manualmente
- O script detecta automaticamente o sistema operacional e usa o método apropriado
- As dependências são verificadas antes de cada instalação para evitar reinstalações desnecessárias
