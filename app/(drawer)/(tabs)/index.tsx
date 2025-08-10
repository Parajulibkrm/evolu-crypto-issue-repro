import { Stack } from 'expo-router';
import { useState } from 'react';
import { View, TextInput, Text, Pressable, ScrollView } from 'react-native';
import { useEvolu } from '~/lib/evolu';
import { allConnections, allTransactions, computeBalances, formatCurrency } from '~/lib/evolu';
import { useQuery } from '@evolu/react';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Dashboard' }} />
      <DashboardView />
    </>
  );
}

function DashboardView() {
  const { insert } = useEvolu();
  const connections = useQuery(allConnections);
  const transactions = useQuery(allTransactions);

  const balances = computeBalances(connections, transactions);
  const totalOwedToYou = balances.reduce((acc, b) => acc + Math.max(0, b.balance), 0);
  const totalYouOwe = balances.reduce((acc, b) => acc + Math.min(0, b.balance), 0);

  const [newName, setNewName] = useState('');

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ gap: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Totals</Text>
        <Text>They owe you: {formatCurrency(totalOwedToYou)}</Text>
        <Text>You owe them: {formatCurrency(Math.abs(totalYouOwe))}</Text>
      </View>

      <View style={{ gap: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Add Connection</Text>
        <TextInput
          placeholder="Name"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={() => {
            if (newName.trim()) {
              insert('connection', { name: newName.trim() });
              setNewName('');
            }
          }}
          style={{ borderWidth: 1, borderColor: '#a1a1aa', borderRadius: 8, padding: 10 }}
        />
        <Pressable
          onPress={() => {
            if (newName.trim()) {
              insert('connection', { name: newName.trim() });
              setNewName('');
            }
          }}
          style={{ backgroundColor: 'black', padding: 12, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: 'white' }}>Add</Text>
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Connections</Text>
        {balances.map((b) => (
          <View
            key={String(b.connectionId)}
            style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{b.name || 'Unnamed'}</Text>
            <Text>Balance: {formatCurrency(b.balance)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
