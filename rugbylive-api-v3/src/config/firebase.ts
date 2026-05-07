import 'dotenv/config'
import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

let initialised = false

export function initFirebase() {
  if (initialised) return
  const saPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT ?? '../rugbylive-api/service-account.json')
  const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'))
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  })
  initialised = true
}

export function db() {
  return admin.firestore()
}
