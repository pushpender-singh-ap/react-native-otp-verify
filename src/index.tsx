import { Platform, NativeEventEmitter } from 'react-native';
import type { Spec } from './NativeReactNativeOtpVerify';
import ReactNativeOtpVerify from './NativeReactNativeOtpVerify';

const LINKING_ERROR =
  `The package 'react-native-otp-verify' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// iOS is not supported - throw error on iOS
const throwIOSError = (): never => {
  throw new Error(
    'react-native-otp-verify is only available on Android. iOS is not supported.'
  );
};

// Create proxy for iOS that throws errors
const iOSProxy = new Proxy(
  {},
  {
    get() {
      return throwIOSError;
    },
  }
) as Spec;

const OtpVerify: Spec =
  Platform.OS === 'ios'
    ? iOSProxy
    : ReactNativeOtpVerify
      ? ReactNativeOtpVerify
      : (new Proxy(
          {},
          {
            get() {
              throw new Error(LINKING_ERROR);
            },
          }
        ) as Spec);

// Event emitter for SMS received events
let eventEmitter: NativeEventEmitter | null = null;
if (Platform.OS === 'android') {
  // For TurboModules, pass null to NativeEventEmitter
  // The native module will still emit events that we can listen to
  eventEmitter = new NativeEventEmitter();
}

export interface SmsMessage {
  /**
   * The full SMS message content
   */
  message: string | null;

  /**
   * Status of the SMS retrieval: 'success', 'timeout', or 'error'
   */
  status: 'success' | 'timeout' | 'error';

  /**
   * The sender's phone number or address (available in GMS 24.20+)
   */
  senderAddress?: string;
}

export type SmsListener = (message: SmsMessage) => void;

/**
 * Starts the SMS Retriever API to listen for incoming SMS messages.
 * The API will listen for up to 5 minutes for a matching SMS message.
 *
 * @returns Promise that resolves when the SMS retriever starts successfully
 * @throws Error on iOS or if the API fails to start
 *
 * @example
 * ```typescript
 * try {
 *   await startSmsRetriever();
 *   console.log('SMS Retriever started');
 * } catch (error) {
 *   console.error('Failed to start SMS Retriever:', error);
 * }
 * ```
 */
export function startSmsRetriever(): Promise<string> {
  if (Platform.OS === 'ios') {
    return Promise.reject(
      new Error('react-native-otp-verify is only available on Android')
    );
  }
  return OtpVerify.startSmsRetriever();
}

/**
 * Gets the app signature hash required for SMS verification.
 * This hash must be included in the SMS message sent from your server.
 * The hash is an 11-character base64 encoded string.
 *
 * The SMS message format should be:
 * <Your message text> <OTP Code>
 * <11-character hash>
 *
 * Example: "Your ExampleApp code is: 123ABC78\n\nFA+9qCX9VSu"
 *
 * @returns Promise that resolves with the app signature hash
 * @throws Error on iOS or if the hash cannot be generated
 *
 * @example
 * ```typescript
 * try {
 *   const hash = await getAppSignature();
 *   console.log('App hash:', hash);
 *   // Send this hash to your server to include in SMS messages
 * } catch (error) {
 *   console.error('Failed to get app signature:', error);
 * }
 * ```
 */
export function getAppSignature(): Promise<string> {
  if (Platform.OS === 'ios') {
    return Promise.reject(
      new Error('react-native-otp-verify is only available on Android')
    );
  }
  return OtpVerify.getAppSignature();
}

/**
 * Requests SMS consent from the user for a specific sender.
 * This is an alternative approach that shows a consent dialog to the user.
 *
 * @returns Promise that resolves when the consent request starts successfully
 * @throws Error on iOS or if the consent request fails
 *
 * @example
 * ```typescript
 * try {
 *   await requestPhoneNumber();
 *   console.log('SMS Consent request started');
 * } catch (error) {
 *   console.error('Failed to request SMS consent:', error);
 * }
 * ```
 */
export function requestPhoneNumber(): Promise<string> {
  if (Platform.OS === 'ios') {
    return Promise.reject(
      new Error('react-native-otp-verify is only available on Android')
    );
  }
  return OtpVerify.requestPhoneNumber();
}

/**
 * Removes the SMS listener to stop listening for messages.
 * Call this when you no longer need to listen for SMS messages.
 *
 * @returns Promise that resolves when the listener is removed successfully
 * @throws Error on iOS or if the listener cannot be removed
 *
 * @example
 * ```typescript
 * try {
 *   await removeSmsListener();
 *   console.log('SMS Listener removed');
 * } catch (error) {
 *   console.error('Failed to remove SMS listener:', error);
 * }
 * ```
 */
export function removeSmsListener(): Promise<string> {
  if (Platform.OS === 'ios') {
    return Promise.reject(
      new Error('react-native-otp-verify is only available on Android')
    );
  }
  return OtpVerify.removeSmsListener();
}

/**
 * Adds a listener for SMS received events.
 * The listener will be called when an SMS message is received, times out, or encounters an error.
 *
 * @param listener - Callback function that receives the SMS message data
 * @returns A subscription object with a `remove()` method to unsubscribe
 *
 * @example
 * ```typescript
 * const subscription = addSmsListener((message) => {
 *   if (message.status === 'success' && message.message) {
 *     console.log('SMS received:', message.message);
 *     // Extract OTP from message
 *     const otpMatch = message.message.match(/\d{4,6}/);
 *     if (otpMatch) {
 *       const otp = otpMatch[0];
 *       console.log('OTP:', otp);
 *     }
 *   } else if (message.status === 'timeout') {
 *     console.log('SMS retrieval timed out');
 *   } else {
 *     console.log('SMS retrieval failed');
 *   }
 * });
 *
 * // Later, remove the listener
 * subscription.remove();
 * ```
 */
export function addSmsListener(listener: SmsListener) {
  if (Platform.OS === 'ios') {
    console.warn('react-native-otp-verify is only available on Android');
    return { remove: () => {} };
  }

  if (!eventEmitter) {
    console.warn('Event emitter not available');
    return { remove: () => {} };
  }

  const subscription = eventEmitter.addListener(
    'com.pushpendersingh.otpverify:SmsReceived',
    listener as any
  );

  return subscription;
}

/**
 * Utility function to extract OTP from SMS message.
 * This is a helper function that uses common OTP patterns to extract the code.
 *
 * @param message - The SMS message content
 * @param otpLength - Optional length of the OTP (default: looks for 4-8 digit codes)
 * @returns The extracted OTP code or null if not found
 *
 * @example
 * ```typescript
 * const message = "Your verification code is: 123456. Do not share this code.";
 * const otp = extractOtp(message);
 * console.log(otp); // "123456"
 *
 * // With specific length
 * const otp4 = extractOtp(message, 4);
 * ```
 */
export function extractOtp(message: string, otpLength?: number): string | null {
  if (!message) return null;

  // If OTP length is specified, look for that exact length
  if (otpLength) {
    const regex = new RegExp(`\\b\\d{${otpLength}}\\b`);
    const match = message.match(regex);
    return match ? match[0] : null;
  }

  // Look for common OTP patterns (4-8 digits)
  const patterns = [
    /\b\d{6}\b/, // 6 digits (most common)
    /\b\d{4}\b/, // 4 digits
    /\b\d{5}\b/, // 5 digits
    /\b\d{8}\b/, // 8 digits
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}
