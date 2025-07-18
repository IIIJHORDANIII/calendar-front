# Sistema Igreja - Frontend

Landing page moderna e responsiva para apresentar a API de gestão de igrejas.

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Framer Motion** - Biblioteca de animações
- **Lucide React** - Ícones modernos

## ✨ Características

- 🎨 Design moderno com cores sobrias
- 📱 Totalmente responsivo
- ✨ Animações suaves e interativas
- 🎯 SEO otimizado
- ⚡ Performance otimizada
- 🔧 Fácil de customizar

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto em modo de desenvolvimento:
```bash
npm start
```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Header.tsx      # Cabeçalho com navegação
│   ├── Hero.tsx        # Seção principal
│   ├── Features.tsx    # Recursos do sistema
│   ├── ApiSection.tsx  # Documentação da API
│   └── Footer.tsx      # Rodapé
├── App.tsx             # Componente principal
├── App.css             # Estilos globais
└── index.tsx           # Ponto de entrada
```

## 🎨 Componentes

### Header
- Navegação responsiva
- Menu mobile
- Efeitos de scroll
- Logo animado

### Hero
- Seção principal com gradientes animados
- Botões de call-to-action
- Estatísticas animadas
- Indicador de scroll

### Features
- Cards interativos
- Ícones coloridos
- Stack de tecnologias
- Animações de entrada

### ApiSection
- Documentação interativa da API
- Endpoints organizados por categoria
- Botões de copiar
- Cores por método HTTP

### Footer
- Links organizados
- Newsletter
- Redes sociais
- Informações de contato

## 🎯 Funcionalidades

- **Navegação Suave**: Scroll suave entre seções
- **Animações**: Efeitos visuais com Framer Motion
- **Responsividade**: Adaptável a todos os dispositivos
- **Acessibilidade**: Navegação por teclado e screen readers
- **Performance**: Otimizado para carregamento rápido

## 🚀 Scripts Disponíveis

- `npm start` - Executa o app em modo de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm test` - Executa os testes
- `npm run eject` - Ejecta do Create React App

## 🎨 Customização

### Cores
As cores podem ser customizadas no arquivo `tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#3b82f6', // Cor principal
  }
}
```

### Animações
Novas animações podem ser adicionadas no `tailwind.config.js`:

```javascript
animation: {
  'custom': 'custom 2s ease-in-out infinite',
}
```

## 📱 Responsividade

O projeto é totalmente responsivo com breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🔧 Configuração do Backend

Para conectar com o backend, certifique-se de que:
1. O backend está rodando na porta 3001
2. CORS está configurado corretamente
3. As rotas da API estão funcionando

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request
