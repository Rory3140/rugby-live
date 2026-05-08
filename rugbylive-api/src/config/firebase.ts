import 'dotenv/config'
import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

let initialised = false

export function initFirebase() {
  if (initialised) return
  let serviceAccount: object
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Cloud Run: service account JSON stored as secret env var
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  } else {
    // Local dev: read from file path
    const saPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT ?? '../rugbylive-api/service-account.json')
    serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'))
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  })
  initialised = true
}

export function db() {
  return admin.firestore()
}
