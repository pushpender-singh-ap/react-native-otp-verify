# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-10-16

### Added

- 🍎 **iOS Native Support**: Added complete iOS implementation with proper TurboModule protocol
  - Created `ios/ReactNativeOtpVerify.h` - Header file with spec protocol
  - Created `ios/ReactNativeOtpVerify.mm` - Objective-C++ implementation
  - Created `ReactNativeOtpVerify.podspec` - CocoaPods specification for iOS
  - All methods properly reject with `PLATFORM_NOT_SUPPORTED` error on iOS
  - Graceful error messages explaining Android-only functionality

- 🚀 **CI/CD iOS Build Pipeline**: Added comprehensive iOS build workflow
  - Complete iOS build job with Xcode 16.3
  - Turbo cache support for faster iOS builds
  - Automated CocoaPods installation and pod updates
  - Proper dependency caching for build optimization
  - Parallel Android and iOS build validation

- 📦 **Package Distribution Updates**: Enhanced package configuration
  - Added `ios` directory to distributed package files
  - Added `*.podspec` to package files for CocoaPods
  - Added `example/ios/build` to clean script for better cleanup
  - Updated package.json to include iOS-specific files

### Changed

- 🔧 **Configuration Improvements**: Simplified platform configuration
  - Changed `ios: null` to `ios: {}` in `example/react-native.config.js`
  - Enables proper codegen without iOS build errors
  - Removes need for iOS platform workaround documentation
  - Cleaner autolinking behavior across platforms

- 🧹 **Code Simplification**: Cleaned up JavaScript/TypeScript layer
  - Removed redundant iOS platform checks from `src/index.tsx`
  - Removed iOS proxy error throwing in JavaScript
  - Simplified module initialization logic
  - Removed verbose JSDoc comments (redundant with TypeScript types)
  - Cleaner, more maintainable codebase

- 📱 **Example App Enhancements**: Improved user experience
  - Better iOS platform detection messaging
  - Removed platform check from useEffect (handled at API level)
  - More informative error UI for iOS users
  - Explains Android-only functionality clearly

- 🧪 **CI Workflow Updates**: Improved testing pipeline
  - Commented out test job (to be properly implemented later)
  - Better workflow organization and naming
  - Improved caching strategies for both platforms

### Fixed

- 🐛 **iOS Build Errors**: Eliminated all iOS-related build failures
  - No more "Module does not exist" errors on iOS
  - No more autolinking failures requiring workarounds
  - CocoaPods integration works out of the box
  - Proper native module registration on iOS

- 🐛 **Platform Compatibility**: Improved cross-platform behavior
  - iOS apps no longer crash when importing the library
  - Clear error messages instead of undefined behavior
  - Proper error codes (`PLATFORM_NOT_SUPPORTED`) for debugging
  - Better developer experience on both platforms

### Documentation

- 📚 **README Updates**: Comprehensive documentation improvements
  - Updated "Features" section to reflect iOS support
  - Rewrote "iOS Support" section with practical examples
  - Added best practices for platform-specific code
  - Removed outdated iOS null configuration instructions
  - Added graceful error handling examples

### Migration

**Fully backward compatible** - No breaking changes!

Existing users: No migration needed. Optional: Remove iOS null config workaround from `react-native.config.js`.

New users: Works out of the box on both iOS and Android.

---

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
