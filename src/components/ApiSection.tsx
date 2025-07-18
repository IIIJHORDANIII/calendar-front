import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ExternalLink, Code, Database, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ApiSection: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const endpoints = [
    {
      method: 'POST',
      path: '/auth/register',
      description: 'Registrar novo usuário',
      category: 'auth'
    },
    {
      method: 'POST',
      path: '/auth/login',
      description: 'Login de usuário',
      category: 'auth'
    },
    {
      method: 'GET/POST/PUT/DELETE',
      path: '/igrejas',
      description: 'Gerenciar igrejas (sede/congregação)',
      category: 'igrejas'
    },
    {
      method: 'POST',
      path: '/pastor',
      description: 'Cadastrar/editar página do pastor',
      category: 'pastor'
    },
    {
      method: 'GET',
      path: '/pastor/:igreja',
      description: 'Buscar página do pastor',
      category: 'pastor'
    },
    {
      method: 'POST',
      path: '/diretoria',
      description: 'Cadastrar/editar diretoria',
      category: 'diretoria'
    },
    {
      method: 'GET',
      path: '/diretoria/:igreja',
      description: 'Buscar diretoria',
      category: 'diretoria'
    },
    {
      method: 'POST',
      path: '/dizimo',
      description: 'Registrar dízimos e ofertas',
      category: 'dizimo'
    },
    {
      method: 'GET',
      path: '/dizimo/:igreja',
      description: 'Buscar dízimos por igreja',
      category: 'dizimo'
    },
    {
      method: 'POST',
      path: '/calendario',
      description: 'Criar evento no calendário',
      category: 'calendario'
    },
    {
      method: 'GET',
      path: '/calendario/:igreja',
      description: 'Buscar eventos por igreja',
      category: 'calendario'
    },
    {
      method: 'POST',
      path: '/evento',
      description: 'Criar evento especial',
      category: 'evento'
    },
    {
      method: 'GET',
      path: '/evento/:igreja',
      description: 'Buscar eventos especiais',
      category: 'evento'
    }
  ];

  const categories = [
    { id: 'auth', name: 'Autenticação', icon: Shield, color: 'bg-green-500' },
    { id: 'igrejas', name: 'Igrejas', icon: Database, color: 'bg-blue-500' },
    { id: 'pastor', name: 'Pastor', icon: Code, color: 'bg-purple-500' },
    { id: 'diretoria', name: 'Diretoria', icon: Code, color: 'bg-indigo-500' },
    { id: 'dizimo', name: 'Dízimos', icon: Code, color: 'bg-yellow-500' },
    { id: 'calendario', name: 'Calendário', icon: Code, color: 'bg-red-500' },
    { id: 'evento', name: 'Eventos', icon: Code, color: 'bg-orange-500' }
  ];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(text);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getMethodColor = (method: string) => {
    if (method.includes('POST')) return 'bg-green-500';
    if (method.includes('GET')) return 'bg-blue-500';
    if (method.includes('PUT')) return 'bg-yellow-500';
    if (method.includes('DELETE')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <section id="api" className="py-20 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Home Button */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Home
          </Link>
        </motion.div>

        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Documentação da API
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore todos os endpoints disponíveis para integrar com o sistema de gestão de igrejas
          </p>
        </motion.div>

        {/* Base URL */}
        <motion.div
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-2xl p-8 shadow-lg transition-all duration-400 relative overflow-hidden mb-12 animate-glow"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Code className="w-5 h-5 text-blue-500 animate-pulse" />
            Base URL
          </h3>
          <div className="flex items-center gap-4">
            <code className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-blue-500 font-mono border border-blue-500">
              http://localhost:3001
            </code>
            <button
              onClick={() => copyToClipboard('http://localhost:3001')}
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer border-none relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30"
            >
              {copiedEndpoint === 'http://localhost:3001' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Copiar
            </button>
          </div>
        </motion.div>

        {/* Endpoints by Category */}
        <div className="space-y-12">
          {categories.map((category, categoryIndex) => {
            const categoryEndpoints = endpoints.filter(ep => ep.category === category.id);
            
            return (
              <motion.div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`${category.color} p-2 rounded-lg`}>
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                </div>

                <div className="space-y-4">
                  {categoryEndpoints.map((endpoint, index) => (
                    <motion.div
                      key={endpoint.path}
                      className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className={`${getMethodColor(endpoint.method)} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                            {endpoint.method}
                          </span>
                          <code className="text-blue-500 dark:text-blue-400 font-mono">
                            {endpoint.path}
                          </code>
                        </div>
                        <button
                          onClick={() => copyToClipboard(`${endpoint.method} ${endpoint.path}`)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {copiedEndpoint === `${endpoint.method} ${endpoint.path}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-2 ml-20">
                        {endpoint.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Start */}
        <motion.div
          className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            Comece Agora
          </h3>
          <p className="text-blue-100 mb-6">
            Acesse a documentação completa e comece a integrar com nossa API
          </p>
          <Link
            to="/documentation"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Ver Documentação Completa
            <ExternalLink className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ApiSection; 