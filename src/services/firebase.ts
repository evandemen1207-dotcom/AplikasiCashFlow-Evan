import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  Firestore,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { Transaction, UserSettings } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID specified in firebase-applet-config.json
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Initialize Firebase Auth
export const auth = getAuth(app);

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

/**
 * Validasi koneksi langsung ke Firestore sesuai panduan implementasi
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline. Periksa koneksi jaringan.');
    }
    return false;
  }
}

/**
 * Simpan atau perbarui profil pengguna di Firestore
 */
export async function saveUserProfile(user: User): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Pengguna Cash Flow',
        photoURL: user.photoURL || '',
        isAnonymous: user.isAnonymous,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Gagal menyimpan profil pengguna ke Firestore:', err);
  }
}

/**
 * Masuk menggunakan akun Google (Firebase Google Sign-In)
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const result = await signInWithPopup(auth, provider);
  await saveUserProfile(result.user);
  return result.user;
}

/**
 * Keluar dari akun pengguna
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Inisialisasi Firebase Auth listener
 */
export function initFirebaseAuth(
  onUserReady: (user: User | null) => void,
  onError?: (err: Error) => void
): () => void {
  // Test connection on boot
  testConnection().catch(() => {});

  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser && !currentUser.isAnonymous) {
      try {
        await saveUserProfile(currentUser);
      } catch (err) {
        console.warn('Failed saving user profile:', err);
      }
      onUserReady(currentUser);
    } else {
      // Belum login (unauthenticated) - jangan auto sign-in anonymously
      onUserReady(null);
    }
  });

  return unsubscribe;
}

// === FIRESTORE TRANSACTIONS CRUD ===

export function getTransactionsCollectionRef(userId: string) {
  return collection(db, 'users', userId, 'transactions');
}

export function getSettingsDocRef(userId: string) {
  return doc(db, 'users', userId, 'settings', 'user_profile');
}

export function getAiInsightsCollectionRef(userId: string) {
  return collection(db, 'users', userId, 'ai_insights');
}

/**
 * Real-time listener untuk koleksi transaksi pengguna di Firestore
 */
export function subscribeTransactionsFromFirestore(
  userId: string,
  onUpdate: (transactions: Transaction[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(getTransactionsCollectionRef(userId), orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        transactions.push({
          id: docSnap.id,
          date: data.date,
          type: data.type,
          category: data.category,
          amount: Number(data.amount) || 0,
          note: data.note || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      onUpdate(transactions);
    },
    (err) => {
      console.warn('Firestore transactions subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Tambah transaksi baru ke Firestore
 */
export async function addTransactionToFirestore(
  userId: string,
  tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
): Promise<string> {
  const colRef = getTransactionsCollectionRef(userId);
  const id = tx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const docRef = doc(colRef, id);

  const payload = {
    date: tx.date,
    type: tx.type,
    category: tx.category,
    amount: tx.amount,
    note: tx.note || '',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, payload);
  return id;
}

/**
 * Perbarui transaksi yang ada di Firestore
 */
export async function updateTransactionInFirestore(
  userId: string,
  txId: string,
  updates: Partial<Omit<Transaction, 'id'>>
): Promise<void> {
  const docRef = doc(getTransactionsCollectionRef(userId), txId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Hapus transaksi dari Firestore
 */
export async function deleteTransactionFromFirestore(
  userId: string,
  txId: string
): Promise<void> {
  const docRef = doc(getTransactionsCollectionRef(userId), txId);
  await deleteDoc(docRef);
}

/**
 * Batch insert seed transactions ke Firestore
 */
export async function seedTransactionsToFirestore(
  userId: string,
  transactions: Transaction[]
): Promise<void> {
  const batch = writeBatch(db);
  const colRef = getTransactionsCollectionRef(userId);

  transactions.forEach((tx) => {
    const docRef = doc(colRef, tx.id);
    batch.set(docRef, {
      date: tx.date,
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      note: tx.note || '',
      userId,
      createdAt: tx.createdAt || new Date().toISOString(),
    });
  });

  await batch.commit();
}

/**
 * Hapus seluruh transaksi di Firestore untuk pengguna
 */
export async function clearAllTransactionsInFirestore(userId: string): Promise<void> {
  const snapshot = await getDocs(getTransactionsCollectionRef(userId));
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

// === FIRESTORE SETTINGS CRUD ===

/**
 * Simpan pengaturan pengguna ke Firestore
 */
export async function saveSettingsToFirestore(
  userId: string,
  settings: UserSettings
): Promise<void> {
  const docRef = getSettingsDocRef(userId);
  await setDoc(docRef, {
    ...settings,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Ambil pengaturan pengguna dari Firestore
 */
export async function getSettingsFromFirestore(
  userId: string
): Promise<UserSettings | null> {
  const docRef = getSettingsDocRef(userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as UserSettings;
  }
  return null;
}

// === AI INSIGHTS PERSISTENCE ===

export interface SavedAiInsight {
  id: string;
  createdAt: string;
  financialScore: number;
  executiveSummary: string;
  cashFlowAnalysis: string;
  spendingLeaks: string[];
  investmentStrategy: string;
  actionChecklist: { task: string; priority: 'high' | 'medium' | 'low'; impact: string }[];
}

export async function saveAiInsightToFirestore(
  userId: string,
  insight: Omit<SavedAiInsight, 'id' | 'createdAt'>
): Promise<string> {
  const id = `insight-${Date.now()}`;
  const docRef = doc(getAiInsightsCollectionRef(userId), id);
  const payload: SavedAiInsight = {
    ...insight,
    id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(docRef, payload);
  return id;
}

export async function getLatestAiInsightFromFirestore(
  userId: string
): Promise<SavedAiInsight | null> {
  const q = query(getAiInsightsCollectionRef(userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].data() as SavedAiInsight;
  }
  return null;
}
