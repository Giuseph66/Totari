import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function CustomDrawerContent() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.drawerHeader, { borderBottomColor: colors.icon }]}>
        <Text style={[styles.drawerTitle, { color: colors.text }]}>Totari</Text>
        <Text style={[styles.drawerSubtitle, { color: colors.icon }]}>
          {user?.displayName || user?.email || 'Usuário'}
        </Text>
      </View>
      
      <View style={styles.drawerContent}>
        <TouchableOpacity 
          style={[styles.drawerItem, { borderBottomColor: colors.icon }]}
          onPress={() => router.navigate('/(tabs)/threads')}
        >
          <Ionicons name="chatbubbles-outline" size={24} color={colors.text} />
          <Text style={[styles.drawerItemText, { color: colors.text }]}>Conversas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.drawerItem, { borderBottomColor: colors.icon }]}
          onPress={() => router.navigate('/personalities')}
        >
          <Ionicons name="person-outline" size={24} color={colors.text} />
          <Text style={[styles.drawerItemText, { color: colors.text }]}>Personalidades</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.drawerItem, { borderBottomColor: colors.icon }]}
          onPress={() => Alert.alert('Em breve')}
        >
          <Ionicons name="search-outline" size={24} color={colors.text} />
          <Text style={[styles.drawerItemText, { color: colors.text }]}>Explorar</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.drawerFooter, { borderTopColor: colors.icon }]}>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.inputError }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Drawer
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.background,
        },
        drawerActiveTintColor: colors.tint,
        drawerInactiveTintColor: colors.icon,
      }}
    >
      <Drawer.Screen
        name="threads"
        options={{
          title: 'Conversas',
          drawerIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="personalities"
        options={{
          title: 'Personalidades',
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="explore"
        options={{
          title: 'Explorar',
          drawerIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 16,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  drawerItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
