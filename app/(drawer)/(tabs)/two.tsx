import { Stack } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useQuery } from '@evolu/react';
import {
  allConnections,
  allTransactions,
  useEvolu,
  formatCurrency,
  type AllConnectionsRow,
} from '~/lib/evolu';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Connections' }} />
      <ConnectionsView />
    </>
  );
}

function ConnectionsView() {
  const { insert, update } = useEvolu();
  const connections = useQuery(allConnections);
  const transactions = useQuery(allTransactions);

  const [newName, setNewName] = useState('');

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ gap: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>New Connection</Text>
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

      <View style={{ gap: 12 }}>
        {connections.map((c) => (
          <ConnectionCard key={String(c.id)} connection={c} />
        ))}
      </View>
    </ScrollView>
  );
}

function ConnectionCard({ connection }: { connection: AllConnectionsRow }) {
  const { insert, update } = useEvolu();
  const transactions = useQuery(allTransactions);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const balance = transactions
    .filter((t) => String(t.connectionId) === String(connection.id))
    .reduce((sum, t) => sum + (t.isCredit ? 1 : -1) * (t.amount ?? 0), 0);

  return (
    <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>{connection.name || 'Unnamed'}</Text>
        <Text style={{ fontWeight: '600' }}>{formatCurrency(balance)}</Text>
      </View>

      <TextInput
        placeholder="Amount"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        style={{ borderWidth: 1, borderColor: '#a1a1aa', borderRadius: 8, padding: 10 }}
      />
      <TextInput
        placeholder="Note (optional)"
        value={note}
        onChangeText={setNote}
        style={{ borderWidth: 1, borderColor: '#a1a1aa', borderRadius: 8, padding: 10 }}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => {
            const amt = Number(amount);
            if (Number.isFinite(amt) && amt > 0) {
              insert('transaction', {
                connectionId: connection.id,
                amount: amt,
                isCredit: true,
                note: note || null,
              });
              setAmount('');
              setNote('');
            }
          }}
          style={{
            backgroundColor: 'black',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            flex: 1,
          }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>Give</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const amt = Number(amount);
            if (Number.isFinite(amt) && amt > 0) {
              insert('transaction', {
                connectionId: connection.id,
                amount: amt,
                isCredit: false,
                note: note || null,
              });
              setAmount('');
              setNote('');
            }
          }}
          style={{
            backgroundColor: '#4b5563',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            flex: 1,
          }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>Take</Text>
        </Pressable>
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: '600', marginTop: 8 }}>Transactions</Text>
        {transactions
          .filter((t) => String(t.connectionId) === String(connection.id))
          .slice()
          .reverse()
          .map((t) => (
            <View
              key={String(t.id)}
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>{t.isCredit ? 'Give' : 'Take'}</Text>
              <Text>{formatCurrency((t.amount ?? 0) * (t.isCredit ? 1 : 1))}</Text>
            </View>
          ))}
      </View>
    </View>
  );
}
