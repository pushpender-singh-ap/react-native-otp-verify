# @pushpendersingh/react-native-otp-verify

[![npm](https://img.shields.io/npm/v/@pushpendersingh/react-native-otp-verify.svg)](https://www.npmjs.com/package/@pushpendersingh/react-native-otp-verify) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]

Automatic SMS OTP verification for React Native Android apps using Google's SMS Retriever and User Consent APIs — zero runtime SMS permissions required.

Key points: Zero permissions • Google Play approved • Easy to integrate • TypeScript support

---

## Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Examples](#-complete-examples)
- [Backend integration](#-backend-integration)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- 🔐 **Two verification methods**: Automatic (silent) and Consent-based (with user approval)
- 🚫 **Zero permissions**: No `READ_SMS` or `RECEIVE_SMS` permissions needed
- ✅ **Google Play approved**: Uses official Google Play Services APIs
- 🎯 **Easy to use**: Simple API with TypeScript support
- 📱 **Cross-platform support**: Android (fully functional) and iOS (graceful error handling)
- 🔄 **Event-driven**: Listen for SMS events with modern EventEmitter pattern
- 🛠️ **Built with New Architecture**: Supports React Native's new architecture (TurboModules)
- 🔒 **Thread-Safe**: Concurrent-safe receiver management with locks and atomic operations
- 📊 **Enhanced Logging**: Comprehensive debug logging for easier troubleshooting

---

## 📦 Installation

```sh
npm install @pushpendersingh/react-native-otp-verify
```

or

```sh
yarn add @pushpendersingh/react-native-otp-verify
```

### Requirements

- React Native >= 0.76
- Android API Level >= 24
- Google Play Services
- Expo prebuild is supported.

---

## 🚀 Quick Start

```javascript
import {
  startSmsRetriever,
  addSmsListener,
  getAppSignature,
  extractOtp,
} from '@pushpendersingh/react-native-otp-verify';

// Get app signature (needed for SMS format)
const signature = await getAppSignature();
console.log('App Signature:', signature);

// Start listening for SMS
await startSmsRetriever();

// Add listener for incoming SMS
const removeListener = addSmsListener((message) => {
  if (message.status === 'success' && message.message) {
    const otp = extractOtp(message.message);
    console.log('OTP:', otp);
  }
});

// Clean up when done
removeListener();
```

---

## 📚 API Reference

### Two Verification Methods

This library provides **two different approaches** for SMS OTP verification:

| Method | User Action | SMS Format | Use Case |
|--------|-------------|------------|----------|
| **SMS Retriever** | None (Automatic) | Requires app hash | Best for your own backend |
| **SMS User Consent** | User taps "Allow" | Any format | Works with any SMS sender |

---

## 1️⃣ SMS Retriever API (Automatic)

### `startSmsRetriever()`

Starts the SMS Retriever API to automatically capture SMS messages containing your app's signature.

- **Returns:** `Promise<string>`
- **Throws:** Error if failed to start
- **Duration:** Listens for up to 5 minutes

```javascript
import { startSmsRetriever } from '@pushpendersingh/react-native-otp-verify';

try {
  await startSmsRetriever();
  console.log('SMS Retriever started');
} catch (error) {
  console.error('Failed to start:', error);
}
```

---

### `getAppSignature()`

Gets your app's 11-character hash signature that must be included in SMS messages.

- **Returns:** `Promise<string>` - The app signature (e.g., `FA+9qCX9VSu`)
- **Throws:** Error if signature cannot be generated

```javascript
import { getAppSignature } from '@pushpendersingh/react-native-otp-verify';

try {
  const signature = await getAppSignature();
  console.log('App Signature:', signature);
  // Send this signature to your backend
} catch (error) {
  console.error('Failed to get signature:', error);
}
```

**Important:** Send this signature to your backend so it can be included in SMS messages.

---

### `addSmsListener(callback)`

Adds a listener for incoming SMS events.

- **Parameters:**
  - `callback: (message: SmsMessage) => void` - Function called when SMS is received
- **Returns:** `() => void` - Function to remove the listener

**SmsMessage Interface:**

```typescript
interface SmsMessage {
  message: string | null;      // The full SMS message content
  status: 'success' | 'timeout' | 'error';
  senderAddress?: string;      // Sender's phone number (if available)
}
```

**Example:**

```javascript
import { addSmsListener } from '@pushpendersingh/react-native-otp-verify';

const removeListener = addSmsListener((message) => {
  console.log('SMS Status:', message.status);
  
  if (message.status === 'success') {
    console.log('SMS:', message.message);
    console.log('From:', message.senderAddress);
  } else if (message.status === 'timeout') {
    console.log('SMS Retriever timed out after 5 minutes');
  } else if (message.status === 'error') {
    console.error('SMS Retriever error');
  }
});

// Don't forget to clean up
removeListener();
```

---

### `removeSmsListener()`

Removes the SMS receiver and stops listening for messages.

- **Returns:** `Promise<string>`

```javascript
import { removeSmsListener } from '@pushpendersingh/react-native-otp-verify';

try {
  await removeSmsListener();
  console.log('SMS Listener removed');
} catch (error) {
  console.error('Failed to remove listener:', error);
}
```

---

### `extractOtp(message, pattern?)`

Extracts OTP code from SMS message using regex pattern.

- **Parameters:**
  - `message: string` - The SMS message text
  - `pattern?: RegExp` - Custom regex pattern (optional)
- **Returns:** `string | null` - The extracted OTP or null if not found
- **Default Pattern:** Matches 4-8 digit codes

**Example:**

```javascript
import { extractOtp } from '@pushpendersingh/react-native-otp-verify';

const sms = "Your OTP is: 123456\\n\\nFA+9qCX9VSu";
const otp = extractOtp(sms);
console.log('OTP:', otp); // "123456"

// Custom pattern for alphanumeric codes
const customPattern = /[A-Z0-9]{6}/;
const code = extractOtp("Your code: ABC123", customPattern);
console.log('Code:', code); // "ABC123"
```

---

## 2️⃣ SMS User Consent API (With User Approval)

### `requestPhoneNumber()`

Starts the SMS User Consent API which shows a consent dialog when SMS arrives.

- **Returns:** `Promise<string>`
- **Throws:** Error if failed to start

**How it works:**

1. Call this function to start listening
2. When SMS arrives, Google shows a consent dialog
3. User taps "Allow" or "Deny"
4. SMS is delivered through `addSmsListener` callback

**Example:**

```javascript
import { requestPhoneNumber, addSmsListener, extractOtp } from '@pushpendersingh/react-native-otp-verify';

// Add listener first
const removeListener = addSmsListener((message) => {
  if (message.status === 'success' && message.message) {
    console.log('User approved SMS:', message.message);
    const otp = extractOtp(message.message);
    console.log('OTP:', otp);
  } else if (message.status === 'error') {
    console.log('User denied consent');
  }
});

// Start SMS User Consent
try {
  await requestPhoneNumber();
  console.log('Waiting for SMS... User will see consent dialog');
} catch (error) {
  console.error('Failed to start consent:', error);
}

// Clean up
removeListener();
```

---

## 📋 Complete Examples

### Example 1: SMS Retriever (Automatic)

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import {
  startSmsRetriever,
  addSmsListener,
  getAppSignature,
  extractOtp,
  removeSmsListener,
} from '@pushpendersingh/react-native-otp-verify';

export default function OtpScreen() {
  const [otp, setOtp] = useState('');
  const [signature, setSignature] = useState('');

  useEffect(() => {
    // Get app signature on mount
    getAppSignature().then(setSignature);

    // Add SMS listener
    const removeListener = addSmsListener((message) => {
      if (message.status === 'success' && message.message) {
        const code = extractOtp(message.message);
        if (code) {
          setOtp(code);
          Alert.alert('OTP Received', `Code: ${code}`);
        }
      } else if (message.status === 'timeout') {
        Alert.alert('Timeout', 'No SMS received in 5 minutes');
      }
    });

    // Cleanup on unmount
    return () => {
      removeListener();
      removeSmsListener();
    };
  }, []);

  const handleStartListening = async () => {
    try {
      await startSmsRetriever();
      Alert.alert('Listening', 'Waiting for OTP SMS...');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>App Signature: {signature}</Text>
      <Text>OTP: {otp}</Text>
      <Button title="Start Listening" onPress={handleStartListening} />
    </View>
  );
}
```

**SMS Format for your backend:**

```text
<#> Your OTP is: 123456

FA+9qCX9VSu
```

---

### Example 2: SMS User Consent

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import {
  requestPhoneNumber,
  addSmsListener,
  extractOtp,
} from '@pushpendersingh/react-native-otp-verify';

export default function ConsentOtpScreen() {
  const [otp, setOtp] = useState('');

  useEffect(() => {
    const removeListener = addSmsListener((message) => {
      if (message.status === 'success' && message.message) {
        const code = extractOtp(message.message);
        if (code) {
          setOtp(code);
          Alert.alert('OTP Received', `Code: ${code}`);
        }
      } else if (message.status === 'error') {
        Alert.alert('Denied', 'You denied SMS access');
      }
    });

    return () => removeListener();
  }, []);

  const handleRequestConsent = async () => {
    try {
      await requestPhoneNumber();
      Alert.alert('Waiting for SMS', 'You will see a consent dialog when SMS arrives');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>OTP: {otp}</Text>
      <Button title="Request SMS Consent" onPress={handleRequestConsent} />
    </View>
  );
}
```

**Works with any SMS format:**

```text
Your verification code is 123456
```

---

## 🔧 Backend Integration

### SMS Format for SMS Retriever API

Your backend must send SMS in this exact format:

```text
<#> Your message here
OTP: 123456

YOUR_APP_SIGNATURE
```

**Rules:**

- Must start with `<#>`
- Message can be up to 140 bytes
- Must end with your 11-character app signature
- One blank line before signature

### Example: Node.js Backend

```javascript
const signature = 'FA+9qCX9VSu'; // Get this from getAppSignature()
const otp = '123456';

const sms = `<#> Your OTP is: ${otp}

${signature}`;

// Send SMS using your SMS provider (Twilio, AWS SNS, etc.)
await sendSMS(phoneNumber, sms);
```

---

## 🆚 When to Use Which Method

### Use SMS Retriever when

- ✅ You control the backend/SMS format
- ✅ You want fully automatic verification
- ✅ You want the best user experience (no interaction)

### Use SMS User Consent when

- ✅ You can't control SMS format (3rd party service)
- ✅ You want to give users explicit control
- ✅ SMS doesn't have your app signature

---

## 🛡️ Permissions

**None required!** 🎉

Both APIs use Google Play Services and require **zero permissions**.

```xml
<!-- AndroidManifest.xml - NO SMS permissions needed! -->
<manifest>
  <!-- No READ_SMS -->
  <!-- No RECEIVE_SMS -->
</manifest>
```

---

## 🍎 iOS Support

iOS is **supported with graceful error handling**. The library includes native iOS implementation that:

- ✅ Links properly without build errors
- ✅ Returns clear error messages when methods are called
- ✅ Follows proper TurboModule protocol
- ⚠️ Does not provide OTP verification functionality (Android-only feature)

All methods will reject with error code `PLATFORM_NOT_SUPPORTED` and message explaining that the feature is Android-only.

**Example:**

```typescript
try {
  await startSmsRetriever();
} catch (error) {
  // On iOS: "@pushpendersingh/react-native-otp-verify package only supports Android."
  console.log(error.message);
}
```

**Best Practice:**

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  // Use OTP verification on Android only
  await startSmsRetriever();
}
```

---

## 🐛 Troubleshooting

### SMS not being captured

1. **Check app signature**: Make sure backend is using correct signature from `getAppSignature()`
2. **SMS format**: Verify SMS follows exact format with `<#>` and signature
3. **Timeout**: SMS Retriever only listens for 5 minutes
4. **Google Play Services**: Make sure device has Google Play Services installed

### Consent dialog not showing

1. **Check SMS arrives**: Dialog only shows when SMS actually arrives
2. **Background app**: Make sure app is in foreground when SMS arrives

### Build errors

```bash
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

---

## 📖 TypeScript Support

Full TypeScript definitions included:

```typescript
import {
  startSmsRetriever,
  getAppSignature,
  requestPhoneNumber,
  addSmsListener,
  removeSmsListener,
  extractOtp,
  SmsMessage,
} from '@pushpendersingh/react-native-otp-verify';

// All functions are fully typed
const signature: Promise<string> = getAppSignature();
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

---

## 📄 License

MIT

---

## 🙏 Credits

- Built with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
- Uses [Google SMS Retriever API](https://developers.google.com/identity/sms-retriever/overview)
- Uses [Google SMS User Consent API](https://developers.google.com/identity/sms-retriever/user-consent/overview)

---

## 📚 Resources

- [SMS Retriever API Documentation](https://developers.google.com/identity/sms-retriever/overview)
- [SMS User Consent API Documentation](https://developers.google.com/identity/sms-retriever/user-consent/overview)
- [Generate App Signature Hash](https://developers.google.com/identity/sms-retriever/verify#computing_your_apps_hash_string)
