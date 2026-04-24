import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Building2, 
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabaseClient';

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else if (data.user) {
        setSuccessMessage('Conta criada com sucesso! Verifique seu e-mail ou tente fazer login.');
        setIsSignUp(false);
      }
    } else {
      const { error } = await login(email, password);
      if (error) {
        setError('Usuário ou senha inválidos ou erro na autenticação.');
        console.error('Login error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        {/* Left Side - Branding */}
        <div className="bg-petrol-900 p-12 text-white flex flex-col justify-between hidden md:flex">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <Building2 className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight">ImobiGestão</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-6">
              A gestão inteligente para sua imobiliária.
            </h1>
            <p className="text-petrol-200 text-lg">
              Conectado agora com <strong>Supabase Cloud</strong> para máxima segurança e escalabilidade.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-petrol-100">
              <CheckCircle size={18} className="text-emerald-400" />
              <span>Autenticação segura via Supabase Auth</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-petrol-100">
              <CheckCircle size={18} className="text-emerald-400" />
              <span>Banco de dados PostgreSQL em tempo real</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-petrol-100">
              <CheckCircle size={18} className="text-emerald-400" />
              <span>Infraestrutura robusta e escalável</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Criar nova conta' : 'Acesse sua conta'}
            </h2>
            <p className="text-slate-500">
              {isSignUp ? 'Cadastre-se para começar a usar o sistema.' : 'Entre com suas credenciais do Supabase.'}
            </p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {successMessage}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário ou E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  type="text" 
                  placeholder="seu@email.com ou username" 
                  className="pl-10 h-12" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha</label>
                {!isSignUp && <a href="#" className="text-xs font-bold text-petrol-600 hover:text-petrol-800">Esqueceu a senha?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base gap-2">
              {isSignUp ? 'Cadastrar Agora' : 'Entrar no Sistema'}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'} {' '}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-bold text-petrol-600 hover:text-petrol-800"
              >
                {isSignUp ? 'Fazer Login' : 'Criar Conta no Supabase'}
              </button>
            </p>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-8 text-slate-400 text-xs flex items-center gap-2">
        <ShieldCheck size={14} />
        Conectado ao Supabase Cloud
      </div>
    </div>
  );
};
