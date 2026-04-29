// Firebase client SDK — Phase 2
//
// When ready to wire up direct RTDB listeners and FCM push notifications:
//
// 1. Go to Firebase console → Project settings → General → Add app (web)
// 2. Copy the firebaseConfig object into NEXT_PUBLIC_FIREBASE_CONFIG in .env.local
// 3. npm install firebase
// 4. Uncomment the init code below
// 5. Update RTDB security rules to allow reads:
//    { "rules": { ".read": true, ".write": false } }
//
// import { initializeApp, getApps } from 'firebase/app'
// import { getDatabase } from 'firebase/database'
// import { getMessaging } from 'firebase/messaging'
//
// const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG ?? '{}')
//
// export const firebaseApp = getApps().length
//   ? getApps()[0]
//   : initializeApp(firebaseConfig)
//
// export const rtdb = getDatabase(firebaseApp)
// export const messaging = typeof window !== 'undefined' ? getMessaging(firebaseApp) : null

export {}
