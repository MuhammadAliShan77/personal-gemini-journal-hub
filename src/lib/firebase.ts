import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import type { JournalEntry } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();

// Initialize Authentication
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom database ID if specified in config
const dbId = firebaseConfigJson.firestoreDatabaseId || undefined;
export const db: Firestore = dbId ? getFirestore(app, dbId) : getFirestore(app);

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Strips all undefined fields recursively before writing to Firestore
 */
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Signs in user with Google Auth popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  // Persist user record in private isolation
  if (result.user) {
    const userRef = doc(db, 'users', result.user.uid);
    await setDoc(
      userRef,
      sanitizePayload({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLoginAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  }
  return result.user;
}

/**
 * Signs out current user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Listens for auth state changes
 */
export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Real-time listener for user-isolated journal entries
 * Path: /users/{userId}/journalEntries/{entryId}
 * Also supports legacy /users/{userId}/interactions gracefully.
 */
export function subscribeToUserJournalEntries(
  userId: string,
  onData: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }

  // Primary isolated collection: journalEntries
  const entriesRef = collection(db, 'users', userId, 'journalEntries');
  const q = query(entriesRef, orderBy('updatedAt', 'desc'));

  let primaryEntries: JournalEntry[] = [];
  let legacyEntries: JournalEntry[] = [];

  const updateCombined = () => {
    const entryMap = new Map<string, JournalEntry>();
    // Primary takes precedence
    primaryEntries.forEach((e) => entryMap.set(e.id, e));
    // Add legacy if not overwritten
    legacyEntries.forEach((e) => {
      if (!entryMap.has(e.id)) entryMap.set(e.id, e);
    });
    const combined = Array.from(entryMap.values()).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    onData(combined);
  };

  const unsubPrimary = onSnapshot(
    q,
    (snapshot) => {
      primaryEntries = [];
      snapshot.forEach((docSnap) => {
        primaryEntries.push({ id: docSnap.id, ...(docSnap.data() as Omit<JournalEntry, 'id'>) });
      });
      updateCombined();
    },
    (err) => {
      console.error('[Firestore Error: subscribeToUserJournalEntries]', err);
      onError(err);
    }
  );

  // Also query legacy interactions collection in case old entries exist
  const legacyRef = collection(db, 'users', userId, 'interactions');
  const legacyQ = query(legacyRef, orderBy('updatedAt', 'desc'));
  const unsubLegacy = onSnapshot(
    legacyQ,
    (snapshot) => {
      legacyEntries = [];
      snapshot.forEach((docSnap) => {
        legacyEntries.push({ id: docSnap.id, ...(docSnap.data() as Omit<JournalEntry, 'id'>) });
      });
      updateCombined();
    },
    (_legacyErr) => {
      // Ignore legacy errors if rules only permit journalEntries
    }
  );

  return () => {
    unsubPrimary();
    unsubLegacy();
  };
}

// Backward-compatible alias
export const subscribeToUserInteractions = subscribeToUserJournalEntries;

/**
 * Saves or updates a journal entry in Firestore under /users/{userId}/journalEntries/{entryId}
 */
export async function saveUserJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error('Cannot save journal entry without valid authenticated userId.');
  if (!entry.id) throw new Error('Cannot save journal entry without entry ID.');

  const entryRef = doc(db, 'users', userId, 'journalEntries', entry.id);
  const cleanPayload = sanitizePayload(entry);
  await setDoc(entryRef, cleanPayload, { merge: true });
}

// Backward-compatible alias
export const saveUserInteraction = saveUserJournalEntry;

/**
 * Deletes a journal entry from Firestore
 */
export async function deleteUserJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const entryRef = doc(db, 'users', userId, 'journalEntries', entryId);
  await deleteDoc(entryRef);

  // Also clean up from legacy path if exists
  try {
    const legacyRef = doc(db, 'users', userId, 'interactions', entryId);
    await deleteDoc(legacyRef);
  } catch {
    // Ignore legacy cleanup errors
  }
}

// Backward-compatible alias
export const deleteUserInteraction = deleteUserJournalEntry;
