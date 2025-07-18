// Script para atualizar o token no localStorage
// Execute no console do navegador

const updateToken = (token, userData) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  console.log('Token atualizado com sucesso!');
  console.log('Recarregue a página para aplicar as mudanças.');
};

// Tokens disponíveis:
const tokens = {
  admin: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NzEzOTMwMjU1MzgxMmIzMjk5YTNjZiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjUwMjIxMiwiZXhwIjoxNzUzMTA3MDEyfQ.0IJ7ik3OSDfwKG9mtNNHU6X603ldewsTBsDsQ3d4SoU',
    user: {
      nome: 'Administrador Sistema',
      email: 'admin@sistema.com',
      role: 'admin'
    }
  },
  sede: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NzUwNGVkNDU5NjVmYTcwMmNhYThkMSIsInJvbGUiOiJzZWRlIiwiaWdyZWphIjoiNjg3NTA0ZWQ0NTk2NWZhNzAyY2FhOGNmIiwiaWF0IjoxNzUyNTAyMjEyLCJleHAiOjE3NTMxMDcwMTJ9.8nIUhTaHLXmqkIkHpk1kq_YGDmxxhBQWSjF2rkScsX4',
    user: {
      nome: 'vilson',
      email: 'vilson@araquari.com',
      role: 'sede',
      igreja: '687504ed45965fa702caa8cf'
    }
  }
};

// Para usar como admin:
// updateToken(tokens.admin.token, tokens.admin.user);

// Para usar como sede:
// updateToken(tokens.sede.token, tokens.sede.user);

console.log('Script carregado! Use:');
console.log('updateToken(tokens.admin.token, tokens.admin.user); // Para admin');
console.log('updateToken(tokens.sede.token, tokens.sede.user); // Para sede'); 