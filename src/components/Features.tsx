import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Shield, 
  FileText, 
  Settings,
  Church,
  UserCheck
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Gestão de Igrejas',
      description: 'Gerencie sedes e congregações com facilidade. Sistema completo para administração de múltiplas igrejas.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: UserCheck,
      title: 'Autenticação Segura',
      description: 'Sistema de login e registro com JWT, bcrypt e validações robustas para máxima segurança.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Calendar,
      title: 'Calendário de Eventos',
      description: 'Organize eventos, cultos e atividades da igreja com um calendário intuitivo e responsivo.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: DollarSign,
      title: 'Controle de Dízimos',
      description: 'Gerencie dízimos e ofertas com relatórios detalhados e controle financeiro transparente.',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: Church,
      title: 'Perfil do Pastor',
      description: 'Crie e gerencie páginas personalizadas para pastores com fotos e informações.',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: FileText,
      title: 'Gestão de Diretoria',
      description: 'Organize a diretoria da igreja com fotos e informações dos membros.',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: Shield,
      title: 'Segurança Avançada',
      description: 'Proteção de dados com middleware de autenticação e autorização por sede.',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: Settings,
      title: 'Upload de Arquivos',
      description: 'Sistema de upload seguro para fotos e documentos com validação de tipos.',
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const technologies = [
    { name: 'Node.js', logo: '🟢', color: 'bg-green-500' },
    { name: 'Express', logo: '⚡', color: 'bg-gray-500' },
    { name: 'MongoDB', logo: '🍃', color: 'bg-green-600' },
    { name: 'JWT', logo: '🔐', color: 'bg-purple-500' },
    { name: 'bcrypt', logo: '🔒', color: 'bg-blue-500' },
    { name: 'Multer', logo: '📁', color: 'bg-orange-500' },
    { name: 'CORS', logo: '🌐', color: 'bg-indigo-500' },
    { name: 'TypeScript', logo: '📘', color: 'bg-blue-600' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Recursos Principais
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Uma API completa e moderna para gerenciar todos os aspectos da sua igreja
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative"
              variants={cardVariants}
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-2xl p-8 shadow-lg transition-all duration-400 relative overflow-hidden h-full hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:border-blue-500/30">
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 mb-6 group-hover:scale-110 transition-transform duration-300 animate-glow`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-blue-500 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tech Stack Section */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Tecnologias Utilizadas
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.name}
                className={`${tech.color} text-white py-6 px-4 rounded-lg font-medium flex flex-col items-center justify-center gap-2`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-3xl">{tech.logo}</span>
                <span className="text-sm">{tech.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features; 