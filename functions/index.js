const functions = require('firebase-functions');
const admin = require('firebase-admin');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Firebase Admin with default credentials
admin.initializeApp();

// Initialize Firestore and Auth
const db = admin.firestore();
const auth = admin.auth();

// Simple HTTP function that returns "Hello from Firebase!"
exports.hello = functions.https.onRequest((request, response) => {
  logger.info("Hello function was called!");
  response.send("Hello from Firebase!");
});

// Function to handle player movement updates
exports.updatePlayerPosition = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    logger.error('Unauthenticated position update attempt');
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { x, y } = data;
  
  try {
    logger.info('Updating player position', { 
      userId: context.auth.uid,
      position: { x, y }
    });
    
    await db.collection('players').doc(context.auth.uid).update({
      position: { x, y },
      lastUpdate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info('Successfully updated player position', { userId: context.auth.uid });
    return { success: true };
  } catch (error) {
    logger.error('Error updating player position', {
      userId: context.auth.uid,
      position: { x, y },
      error: error.message
    });
    throw new functions.https.HttpsError('internal', 'Failed to update position');
  }
});

// Function to handle new player registration
exports.createPlayerProfile = functions.auth.user().onCreate(async (user) => {
  try {
    logger.info('Creating player profile', { userId: user.uid });
    // Create initial player profile
    await db.collection('players').doc(user.uid).set({
      email: user.email,
      position: { x: 400, y: 400 }, // Start in middle of 800x800 map
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info(`Created profile for player ${user.uid}`);
  } catch (error) {
    logger.error('Error creating player profile', { 
      userId: user.uid, 
      error: error.message 
    });
  }
});

// Function to get nearby players (for proximity voice chat)
exports.getNearbyPlayers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    logger.error('Unauthenticated nearby players request');
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { x, y, radius = 50 } = data; // 50px radius for voice chat

  try {
    logger.info('Getting nearby players', { 
      userId: context.auth.uid, 
      position: { x, y }, 
      radius 
    });
    
    const playersSnapshot = await db.collection('players').get();
    const nearbyPlayers = [];
    
    playersSnapshot.forEach(doc => {
      if (doc.id !== context.auth.uid) {
        const playerData = doc.data();
        if (playerData.position) {
          const distance = Math.sqrt(
            Math.pow(x - playerData.position.x, 2) + 
            Math.pow(y - playerData.position.y, 2)
          );
          
          if (distance <= radius) {
            nearbyPlayers.push({
              id: doc.id,
              distance
            });
          }
        }
      }
    });
    
    logger.info('Successfully retrieved nearby players', { 
      userId: context.auth.uid, 
      nearbyPlayers 
    });
    
    return { players: nearbyPlayers };
  } catch (error) {
    logger.error('Error getting nearby players', { 
      userId: context.auth.uid, 
      position: { x, y }, 
      radius, 
      error: error.message 
    });
    throw new functions.https.HttpsError('internal', 'Failed to get nearby players');
  }
});

// Check invite code validity
exports.checkInviteCode = functions.https.onCall(async (data, context) => {
  const code = data.code;
  if (!code || typeof code !== 'string') {
    logger.error('Invalid invite code format', { code });
    throw new functions.https.HttpsError('invalid-argument', 'Invite code must be a string');
  }

  try {
    logger.info('Checking invite code', { code });
    const inviteSnapshot = await db.collection('invites').where('code', '==', code).get();
    if (inviteSnapshot.empty) {
      logger.info('Invalid invite code', { code });
      return { valid: false, message: 'Invalid invite code' };
    }

    const invite = inviteSnapshot.docs[0].data();
    if (invite.used) {
      logger.info('Invite code already used', { code });
      return { valid: false, message: 'Invite code has already been used' };
    }

    logger.info('Valid invite code found', { code });
    return { valid: true, message: 'Valid invite code' };
  } catch (error) {
    logger.error('Error checking invite code', { code, error: error.message });
    throw new functions.https.HttpsError('internal', 'Error checking invite code');
  }
});

// Create a new user with invite code
exports.createUserWithInvite = functions.https.onCall(async (data, context) => {
  const { email, password, inviteCode } = data;
  
  logger.info('Attempting to create user with invite', { email, inviteCode });
  
  // Validate invite code first
  const inviteSnapshot = await db.collection('invites').where('code', '==', inviteCode).get();
  if (inviteSnapshot.empty) {
    logger.error('Invalid invite code during user creation', { inviteCode });
    throw new functions.https.HttpsError('invalid-argument', 'Invalid invite code');
  }

  const invite = inviteSnapshot.docs[0];
  if (invite.data().used) {
    logger.error('Attempted to use already used invite code', { inviteCode });
    throw new functions.https.HttpsError('invalid-argument', 'Invite code already used');
  }

  try {
    // Create the user
    logger.info('Creating new user', { email });
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: false
    });

    // Mark invite as used
    logger.info('Marking invite code as used', { inviteCode, userId: userRecord.uid });
    await invite.ref.update({
      used: true,
      usedBy: userRecord.uid,
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create initial player profile at map center (800x800)
    logger.info('Creating player profile', { userId: userRecord.uid });
    await db.collection('players').doc(userRecord.uid).set({
      email: email,
      position: { x: 400, y: 400 },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      inviteCode: inviteCode
    });

    logger.info('Successfully created new user and profile', { userId: userRecord.uid });
    return { success: true, uid: userRecord.uid };
  } catch (error) {
    logger.error('Error creating user', { 
      email, 
      inviteCode, 
      error: error.message,
      stack: error.stack 
    });
    throw new functions.https.HttpsError('internal', 'Error creating user account');
  }
});

// Generate new invite codes (admin only)
exports.generateInviteCodes = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated and has admin rights
  if (!context.auth) {
    logger.error('Unauthenticated invite code generation attempt');
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const adminSnapshot = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminSnapshot.exists) {
    logger.error('Non-admin attempted to generate invite codes', { userId: context.auth.uid });
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin');
  }

  const count = data.count || 1;
  const codes = [];

  try {
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      logger.info('Generating new invite code', { code });
      await db.collection('invites').add({
        code: code,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
        used: false
      });
      codes.push(code);
    }

    logger.info('Successfully generated invite codes', { codes });
    return { success: true, codes };
  } catch (error) {
    logger.error('Error generating invite codes', { 
      error: error.message, 
      stack: error.stack 
    });
    throw new functions.https.HttpsError('internal', 'Error generating invite codes');
  }
});
