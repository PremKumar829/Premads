import { db, doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from "./firebase.js";
import { SystemSettings, User, WithdrawalRequest, AdminMember, GroupMessage, SupportTicket, TransactionItem, AdWatchLog } from "../types.js";
import { initialSettings, initialUsers, initialAdminTeam, initialWithdrawalRequests, initialGroupMessages, initialAdWatchLogs } from "../mockData.js";

// Utility to replace undefined with null/omit for Firestore compatibility
function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(obj as any)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned;
  }
  return obj;
}

export class FirestoreStorage {
  private static isInitialized = false;

  public static async loadAllData() {
    console.log("🔥 Initializing Firestore Database storage...");

    let settings: SystemSettings = { ...initialSettings };
    let users: User[] = [];
    let withdrawalRequests: WithdrawalRequest[] = [];
    let adminTeam: AdminMember[] = [];
    let groupMessages: GroupMessage[] = [];
    let supportTickets: SupportTicket[] = [];
    let transactionsLog: TransactionItem[] = [];
    let adWatchLogs: AdWatchLog[] = [];

    try {
      // 1. Settings
      const settingsRef = doc(db, "settings", "global");
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        settings = { ...initialSettings, ...(settingsSnap.data() as SystemSettings) };
      } else {
        await setDoc(settingsRef, cleanForFirestore(initialSettings));
        settings = { ...initialSettings };
      }

      // 2. Users
      const usersSnap = await getDocs(collection(db, "users"));
      if (!usersSnap.empty) {
        users = usersSnap.docs.map(d => d.data() as User);
      } else {
        // Seed initial users into Firestore
        for (const u of initialUsers) {
          await setDoc(doc(db, "users", u.id), cleanForFirestore(u));
        }
        users = [...initialUsers];
      }

      // 3. Withdrawals
      const withdrawalsSnap = await getDocs(collection(db, "withdrawals"));
      if (!withdrawalsSnap.empty) {
        withdrawalRequests = withdrawalsSnap.docs.map(d => d.data() as WithdrawalRequest);
      } else {
        for (const w of initialWithdrawalRequests) {
          await setDoc(doc(db, "withdrawals", w.id), cleanForFirestore(w));
        }
        withdrawalRequests = [...initialWithdrawalRequests];
      }

      // 4. Admin Team
      const adminSnap = await getDocs(collection(db, "adminTeam"));
      if (!adminSnap.empty) {
        adminTeam = adminSnap.docs.map(d => d.data() as AdminMember);
      } else {
        for (const a of initialAdminTeam) {
          await setDoc(doc(db, "adminTeam", a.id), cleanForFirestore(a));
        }
        adminTeam = [...initialAdminTeam];
      }

      // 5. Group Messages
      const msgsSnap = await getDocs(collection(db, "groupMessages"));
      if (!msgsSnap.empty) {
        groupMessages = msgsSnap.docs.map(d => d.data() as GroupMessage);
      } else {
        for (const m of initialGroupMessages) {
          await setDoc(doc(db, "groupMessages", m.id), cleanForFirestore(m));
        }
        groupMessages = [...initialGroupMessages];
      }

      // 6. Support Tickets
      const ticketsSnap = await getDocs(collection(db, "supportTickets"));
      if (!ticketsSnap.empty) {
        supportTickets = ticketsSnap.docs.map(d => d.data() as SupportTicket);
      }

      // 7. Transactions
      const txSnap = await getDocs(collection(db, "transactions"));
      if (!txSnap.empty) {
        transactionsLog = txSnap.docs.map(d => d.data() as TransactionItem);
      }

      this.isInitialized = true;
      console.log(`✅ Firestore loaded successfully! Users: ${users.length}, Withdrawals: ${withdrawalRequests.length}`);
    } catch (error) {
      console.error("❌ Firestore initial loading error, fallback to initial state:", error);
      users = [...initialUsers];
      withdrawalRequests = [...initialWithdrawalRequests];
      adminTeam = [...initialAdminTeam];
      groupMessages = [...initialGroupMessages];
      adWatchLogs = [...initialAdWatchLogs];
    }

    return {
      settings,
      users,
      withdrawalRequests,
      adminTeam,
      groupMessages,
      supportTickets,
      transactionsLog,
      adWatchLogs
    };
  }

  // Persistent Async Savers
  public static async saveSettings(settings: SystemSettings) {
    try {
      await setDoc(doc(db, "settings", "global"), cleanForFirestore(settings), { merge: true });
    } catch (err) {
      console.error("Error saving settings to Firestore:", err);
    }
  }

  public static async saveUser(user: User) {
    try {
      await setDoc(doc(db, "users", user.id), cleanForFirestore(user), { merge: true });
    } catch (err) {
      console.error(`Error saving user ${user.id} to Firestore:`, err);
    }
  }

  public static async saveWithdrawal(withdrawal: WithdrawalRequest) {
    try {
      await setDoc(doc(db, "withdrawals", withdrawal.id), cleanForFirestore(withdrawal), { merge: true });
    } catch (err) {
      console.error(`Error saving withdrawal ${withdrawal.id} to Firestore:`, err);
    }
  }

  public static async saveAdminMember(member: AdminMember) {
    try {
      await setDoc(doc(db, "adminTeam", member.id), cleanForFirestore(member), { merge: true });
    } catch (err) {
      console.error(`Error saving admin member ${member.id} to Firestore:`, err);
    }
  }

  public static async deleteAdminMember(id: string) {
    try {
      await deleteDoc(doc(db, "adminTeam", id));
    } catch (err) {
      console.error(`Error deleting admin member ${id} from Firestore:`, err);
    }
  }

  public static async saveGroupMessage(msg: GroupMessage) {
    try {
      await setDoc(doc(db, "groupMessages", msg.id), cleanForFirestore(msg), { merge: true });
    } catch (err) {
      console.error(`Error saving group message ${msg.id} to Firestore:`, err);
    }
  }

  public static async saveSupportTicket(ticket: SupportTicket) {
    try {
      await setDoc(doc(db, "supportTickets", ticket.id), cleanForFirestore(ticket), { merge: true });
    } catch (err) {
      console.error(`Error saving support ticket ${ticket.id} to Firestore:`, err);
    }
  }

  public static async saveTransaction(tx: TransactionItem) {
    try {
      await setDoc(doc(db, "transactions", tx.id), cleanForFirestore(tx), { merge: true });
    } catch (err) {
      console.error(`Error saving transaction ${tx.id} to Firestore:`, err);
    }
  }
}
