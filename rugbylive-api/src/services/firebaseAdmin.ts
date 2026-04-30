import admin from 'firebase-admin'
import path from 'path'
import fs from 'fs'

let initialised = false

function init() {
  if (initialised || admin.apps.length > 0) {
    initialised = true
    return
  }

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!saPath) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set')

  const resolved = path.resolve(saPath)
  const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'))

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  })

  initialised = true
}

export function getFirestore(): admin.firestore.Firestore {
  init()
  return admin.firestore()
}

export function getDatabase(): admin.database.Database {
  init()
  if (!process.env.FIREBASE_DATABASE_URL) {
    throw new Error('FIREBASE_DATABASE_URL env var not set')
  }
  return admin.database()
}
