import { Platform } from 'react-native';
import type { Spec } from './NativeReactNativeOtpVerify';
import ReactNativeOtpVerify from './NativeReactNativeOtpVerify';

const LINKING_ERROR =
  `The package 'react-native-otp-verify' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const OtpVerify: Spec = ReactNativeOtpVerify
  ? ReactNativeOtpVerify
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    ) as Spec);

export interface SmsMessage {
  message: string | null;
  status: 'success' | 'timeout' | 'error';
  senderAddress?: string;
}

export type SmsListener = (message: SmsMessage) => void;

export function startSmsRetriever(): Promise<string> {
  return OtpVerify.startSmsRetriever();
}

export function getAppSignature(): Promise<string> {
  return OtpVerify.getAppSignature();
}

export function requestPhoneNumber(): Promise<string> {
  return OtpVerify.requestPhoneNumber();
}

export function removeSmsListener(): Promise<string> {
  return OtpVerify.removeSmsListener();
}

export function addSmsListener(listener: SmsListener) {
  return OtpVerify.onSmsReceived(listener);
}

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
