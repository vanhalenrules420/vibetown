const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore and Auth
const db = admin.firestore();
const auth = admin.auth();

// Simple HTTP function that returns "Hello from Firebase!"
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello World function executed!");
  response.send("Hello from Firebase!");
});

// Test function that logs a message
exports.helloVibeTown = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello from Vibe Town!", {structuredData: true});
  response.json({message: "Welcome to Vibe Town!"});
});

// Handle new player registration
exports.onPlayerCreated = functions.auth.user().onCreate(async (user) => {
  try {
    // Create a player profile when a new user signs up
    await db.collection('players').doc(user.uid).set({
      email: user.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });
    
    functions.logger.info(`Created profile for player ${user.uid}`);
  } catch (error) {
    functions.logger.error('Error creating player profile:', error);
  }
});

// Update player's last login timestamp
exports.updatePlayerLastLogin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  try {
    await db.collection('players').doc(context.auth.uid).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating last login:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update last login');
  }
});
