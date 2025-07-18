# API Service - Centralized Error Handling

Este serviço centraliza todas as chamadas de API e automaticamente redireciona para o login quando ocorre um erro 401 (Unauthorized).

## Como usar

### 1. Importar o hook useApi

```typescript
import { useApi } from '../utils/api';

const MyComponent: React.FC = () => {
  const api = useApi();
  // ... resto do componente
};
```

### 2. Fazer chamadas de API

```typescript
// GET request
const response = await api.get('/endpoint');

// POST request
const response = await api.post('/endpoint', { data: 'value' });

// PUT request
const response = await api.put('/endpoint', { data: 'value' });

// DELETE request
const response = await api.delete('/endpoint');

// PATCH request
const response = await api.patch('/endpoint', { data: 'value' });
```

### 3. Tratar respostas

```typescript
try {
  const response = await api.get('/evento');
  
  if (response.ok) {
    const data = await response.json();
    setEventos(data);
  } else {
    setError('Erro ao carregar dados');
  }
} catch (error) {
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('Erro de conexão');
  }
}
```

## Funcionalidades

### ✅ Redirecionamento automático
- Quando uma requisição retorna 401, o usuário é automaticamente redirecionado para `/login`
- O token e dados do usuário são removidos do localStorage
- Não é necessário verificar manualmente se o token existe

### ✅ Headers automáticos
- O token de autorização é automaticamente incluído em todas as requisições
- Content-Type é definido como application/json por padrão

### ✅ Tratamento de erros
- Erros de rede são capturados e tratados adequadamente
- Mensagens de erro são padronizadas

### ✅ Base URL centralizada
- Todas as requisições usam a mesma base URL (`http://localhost:3005`)
- Fácil de alterar em um só lugar

## Migração de código existente

### Antes:
```typescript
const token = localStorage.getItem('token');
if (!token) {
  navigate('/login');
  return;
}

const response = await fetch('http://localhost:3005/evento', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Depois:
```typescript
const response = await api.get('/evento');
```

## Benefícios

1. **Menos código repetitivo** - Não precisa mais verificar token em cada requisição
2. **Tratamento consistente de erros** - Todos os 401 são tratados da mesma forma
3. **Manutenção mais fácil** - Mudanças na lógica de autenticação em um só lugar
4. **Melhor experiência do usuário** - Redirecionamento automático quando necessário 