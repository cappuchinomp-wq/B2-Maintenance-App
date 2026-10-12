import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserRole, Department } from '../types/maintenance';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory as required by guidelines
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      console.warn('No access token in credential, user logged in without full OAuth token');
    }

    cachedAccessToken = credential?.accessToken || null;
    return { 
      user: result.user, 
      accessToken: cachedAccessToken || '' 
    };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Helper to determine initial role from email/department
export const mapUserToProfile = (user: User, customRole?: UserRole, customDept?: Department): UserProfile => {
  const email = user.email || '';
  let defaultRole: UserRole = customRole || 'staff';
  let defaultDept: Department = customDept || 'พนักงานต้อนรับ (GSA)';

  if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('manager') || email.toLowerCase().includes('hm') || email.toLowerCase().includes('bookingb2hotel')) {
    defaultRole = 'admin';
    defaultDept = 'ผู้จัดการโรงแรม (HM)';
  } else if (email.toLowerCase().includes('eng') || email.toLowerCase().includes('tech') || email.toLowerCase().includes('maint')) {
    defaultRole = 'technician';
    defaultDept = 'ช่างอาคาร';
  } else if (email.toLowerCase().includes('house') || email.toLowerCase().includes('clean')) {
    defaultRole = 'housekeeping';
    defaultDept = 'แม่บ้าน';
  }

  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
    photoURL: user.photoURL || undefined,
    role: defaultRole,
    department: defaultDept,
    phone: user.phoneNumber || '0812345678',
  };
};
