import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

// Zod schema for form validation
const loginSchema = z.object({
  email: z.string().email('Endereço de email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login } = useAuthStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogin = async () => {
    // Validate form
    try {
      loginSchema.parse({ email, password });
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
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.authBackground }]}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/icons/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Bem-vindo de Volta</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Entre na sua conta</Text>
      
      <View style={[styles.form, { backgroundColor: colors.authCardBackground }]}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.text
              },
              errors.email && { borderColor: colors.inputError }
            ]}
            placeholder="E-mail"
            placeholderTextColor={colors.icon}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && <Text style={[styles.errorText, { color: colors.inputError }]}>{errors.email}</Text>}
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.text
              },
              errors.password && { borderColor: colors.inputError }
            ]}
            placeholder="Senha"
            placeholderTextColor={colors.icon}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.password && <Text style={[styles.errorText, { color: colors.inputError }]}>{errors.password}</Text>}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: colors.buttonBackground },
            loading && { backgroundColor: colors.buttonDisabled }
          ]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>
        {/* TODO: Add forgot password
        <View style={styles.footer}>
          <Text style={{ color: colors.text }}>Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={[styles.link, { color: colors.linkColor }]}>Cadastrar</Text>
          </TouchableOpacity>
        </View>
            */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
});