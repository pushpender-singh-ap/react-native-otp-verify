import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Starts the SMS Retriever API to listen for incoming SMS messages.
   * The API will listen for up to 5 minutes for a matching SMS message.
   * @returns Promise that resolves when the SMS retriever starts successfully
   */
  startSmsRetriever(): Promise<string>;

  /**
   * Gets the app signature hash required for SMS verification.
   * This hash must be included in the SMS message sent from the server.
   * The hash is an 11-character base64 encoded string.
   * @returns Promise that resolves with the app signature hash
   */
  getAppSignature(): Promise<string>;

  /**
   * Requests SMS consent from the user for a specific sender.
   * This is an alternative approach that shows a consent dialog.
   * @returns Promise that resolves when the consent request starts successfully
   */
  requestPhoneNumber(): Promise<string>;

  /**
   * Removes the SMS listener to stop listening for messages.
   * @returns Promise that resolves when the listener is removed successfully
   */
  removeSmsListener(): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ReactNativeOtpVerify');
