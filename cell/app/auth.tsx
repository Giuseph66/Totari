import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

// Zod schema for form validation
const authSchema = z.object({
  email: z.string().email('Endereço de email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  displayName: z.string().optional(),
});

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    // Validate form
    try {
      authSchema.pick({ email: true, password: true }).parse({ email, password });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      await login(email, password);
      router.replace('/(tabs)/threads');
    } catch (error) {
      Alert.alert('Falha no Login', error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bem-vindo de Volta</Text>
      <Text style={styles.subtitle}>Entre na sua conta</Text>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text>Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.link}>Cadastrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { register } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    // Validate form
    try {
      authSchema.parse({ email, password, displayName });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      await register(email, password, displayName);
      router.replace('/(tabs)/threads');
    } catch (error) {
      Alert.alert('Falha no Cadastro', error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>
      <Text style={styles.subtitle}>Cadastre-se para começar</Text>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.displayName && styles.inputError]}
            placeholder="Nome de Exibição"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Criando Conta...' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text>Já tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.link}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#2196F3',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#BBDEFB',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});

// Main Auth Screen Component
export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Totari</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
        </Text>
      </View>

      {isLogin ? <LoginScreen /> : <RegisterScreen />}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
        </Text>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.link}>
            {isLogin ? 'Cadastrar' : 'Entrar'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}