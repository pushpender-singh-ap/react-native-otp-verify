# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-16

### Added

- ✨ **Modern Event Handling**: Migrated from legacy `NativeEventEmitter` to TurboModule's native `EventEmitter` pattern
  - Uses `CodegenTypes.EventEmitter<SmsMessage>` for type-safe event emission
  - Improved performance and reliability of SMS event delivery
  - Better integration with React Native's new architecture

- 🔒 **Thread-Safe Receiver Management**: Added comprehensive thread-safety mechanisms
  - Implemented `ReentrantLock` for thread-safe receiver registration/unregistration
  - Added `AtomicBoolean` for thread-safe state tracking
  - Used `@Volatile` annotations for visibility guarantees across threads
  - Prevents race conditions during concurrent receiver operations

- 📊 **Enhanced Logging**: Added comprehensive debug logging throughout the native module
  - Added `Log.d()` statements for successful operations
  - Added `Log.w()` statements for warnings and edge cases
  - Added `Log.e()` statements for error scenarios
  - Easier debugging and troubleshooting of SMS verification flows

### Changed

- 🔄 **Event Emission**: Updated event emission to use new `emitOnSmsReceived()` method
  - Removed dependency on `DeviceEventManagerModule.RCTDeviceEventEmitter`
  - Event name is now handled internally by CodeGen
  - Simplified event handling code

- 🧹 **Code Organization**: Improved code structure and documentation
  - Added comprehensive KDoc comments for all methods
  - Organized receiver management into separate thread-safe functions
  - Better error handling and logging throughout

### Fixed

- 🐛 **Race Conditions**: Fixed potential race conditions in receiver registration
  - Receivers are now registered/unregistered within locked sections
  - Prevents multiple simultaneous register attempts
  - Ensures cleanup is always performed correctly

- 🐛 **Error Handling**: Improved error handling for receiver operations
  - Graceful handling of already-registered receivers
  - Better error messages for debugging
  - Proper cleanup in exception scenarios

### Technical Details

#### Native Module Changes (Kotlin)

**Thread-Safe State Management:**

```kotlin
@Volatile
private var smsReceiver: BroadcastReceiver? = null
private val isReceiverRegistered = AtomicBoolean(false)

@Volatile
private var consentReceiver: BroadcastReceiver? = null
private val isConsentReceiverRegistered = AtomicBoolean(false)

private val receiverLock = ReentrantLock()
private val consentLock = ReentrantLock()
```

**Improved Event Emission:**

```kotlin
// Old way
reactApplicationContext
  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  .emit("com.pushpendersingh.otpverify:SmsReceived", params)

// New way
emitOnSmsReceived(params)
```

#### JavaScript/TypeScript Changes

**Updated Event Listener:**

```typescript
// Old way
const subscription = eventEmitter.addListener(
  'com.pushpendersingh.otpverify:SmsReceived',
  listener
);

// New way
return OtpVerify.onSmsReceived(listener);
```

**Updated Spec Definition:**

```typescript
export interface Spec extends TurboModule {
  // ... other methods
  readonly onSmsReceived: CodegenTypes.EventEmitter<SmsMessage>;
}
```

### Migration Guide

This is a **minor version update** and is **fully backward compatible**. No changes are required in your application code. The API surface remains identical:

```typescript
// Your existing code continues to work without changes
import { addSmsListener } from '@pushpendersingh/react-native-otp-verify';

const subscription = addSmsListener((message) => {
  // Same API, better performance
  console.log(message);
});
```

### Performance Improvements

- Reduced overhead in event emission path
- More efficient thread-safe operations with locks
- Better memory management with proper cleanup
- Reduced risk of memory leaks from unregistered receivers

### Security Improvements

- Thread-safe operations prevent potential race condition exploits
- Better cleanup ensures receivers are always properly unregistered
- Enhanced logging helps identify security-related issues

---

## [1.0.0] - 2025-10-01

### Added

- 🎉 Initial release
- SMS Retriever API support
- SMS User Consent API support
- TypeScript definitions
- Complete documentation
- Example app
- Zero permissions required
- React Native New Architecture support
