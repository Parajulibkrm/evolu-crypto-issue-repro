import {
  FiniteNumber,
  createEvolu,
  getOrThrow,
  id,
  kysely,
  maxLength,
  NonEmptyString,
  NonEmptyString1000,
  nullOr,
  QueryRows,
  SimpleName,
  SqliteBoolean,
} from "@evolu/common";
import { EvoluProvider, createUseEvolu, useQuery } from "@evolu/react";
import { evoluReactNativeDeps } from "@evolu/react-native/expo-sqlite";

// Primary keys
const ConnectionId = id("Connection");
export type ConnectionId = typeof ConnectionId.Type;

const TransactionId = id("Transaction");
export type TransactionId = typeof TransactionId.Type;

// Custom branded types
const NonEmptyString100 = maxLength(100)(NonEmptyString);
export type NonEmptyString100 = typeof NonEmptyString100.Type;

// Database Schema
const Schema = {
  connection: {
    id: ConnectionId,
    name: NonEmptyString100,
    note: nullOr(NonEmptyString1000),
  },
  transaction: {
    id: TransactionId,
    connectionId: ConnectionId,
    amount: FiniteNumber,
    // true => You gave them money (they owe you). false => You took money (you owe them)
    isCredit: SqliteBoolean,
    note: nullOr(NonEmptyString1000),
  },
};

export const evolu = createEvolu(evoluReactNativeDeps)(Schema, {
  name: getOrThrow(SimpleName.from("personal-finance-evolu")),
  // Indexes recommended for production
  indexes: (create) => [
    create("connectionCreatedAt").on("connection").column("createdAt"),
    create("transactionCreatedAt").on("transaction").column("createdAt"),
    create("transactionByConnection").on("transaction").column("connectionId"),
  ],
});

export const useEvolu = createUseEvolu(evolu);
export { EvoluProvider } from "@evolu/react";

// Queries
export const allConnections = evolu.createQuery((db) =>
  db
    .selectFrom("connection")
    .select(["id", "name", "note"]) // name is nullable in queries by design
    .where("isDeleted", "is not", 1)
    .orderBy("createdAt")
);

export type AllConnectionsRow = typeof allConnections.Row;

export const allTransactions = evolu.createQuery((db) =>
  db
    .selectFrom("transaction")
    .select(["id", "connectionId", "amount", "isCredit", "note", "createdAt"]) // createdAt is implicit
    .where("isDeleted", "is not", 1)
    .orderBy("createdAt")
);

export type AllTransactionsRow = typeof allTransactions.Row;

// Helpers
export type ConnectionBalance = {
  connectionId: ConnectionId;
  name: string | null;
  balance: number;
};

export function computeBalances(
  connections: QueryRows<AllConnectionsRow>,
  transactions: QueryRows<AllTransactionsRow>
): ConnectionBalance[] {
  const byId: Record<string, ConnectionBalance> = Object.create(null);
  for (const c of connections) {
    byId[String(c.id)] = {
      connectionId: c.id,
      name: c.name ?? null,
      balance: 0,
    };
  }
  for (const t of transactions) {
    const key = String(t.connectionId);
    if (!byId[key]) continue;
    const signed = (t.isCredit ? 1 : -1) * (t.amount ?? 0);
    byId[key].balance += signed;
  }
  return Object.values(byId);
}

export function formatCurrency(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback if Intl not available in env
    return `$${value.toFixed(2)}`;
  }
}


