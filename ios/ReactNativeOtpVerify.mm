#import "ReactNativeOtpVerify.h"

// Constants for error handling
static NSString *const kPlatformNotSupportedError = @"PLATFORM_NOT_SUPPORTED";
static NSString *const kPlatformNotSupportedMessage = @"@pushpendersingh/react-native-otp-verify package only supports Android.";

@implementation ReactNativeOtpVerify

- (void)startSmsRetriever:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
    NSError *error = [NSError errorWithDomain:@"ReactNativeOtpVerify"
                                         code:1
                                     userInfo:@{NSLocalizedDescriptionKey: kPlatformNotSupportedMessage}];
    reject(kPlatformNotSupportedError, kPlatformNotSupportedMessage, error);
}

- (void)getAppSignature:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
    NSError *error = [NSError errorWithDomain:@"ReactNativeOtpVerify"
                                         code:1
                                     userInfo:@{NSLocalizedDescriptionKey: kPlatformNotSupportedMessage}];
    reject(kPlatformNotSupportedError, kPlatformNotSupportedMessage, error);
}

- (void)requestPhoneNumber:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
    NSError *error = [NSError errorWithDomain:@"ReactNativeOtpVerify"
                                         code:1
                                     userInfo:@{NSLocalizedDescriptionKey: kPlatformNotSupportedMessage}];
    reject(kPlatformNotSupportedError, kPlatformNotSupportedMessage, error);
}

- (void)removeSmsListener:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
    NSError *error = [NSError errorWithDomain:@"ReactNativeOtpVerify"
                                         code:1
                                     userInfo:@{NSLocalizedDescriptionKey: kPlatformNotSupportedMessage}];
    reject(kPlatformNotSupportedError, kPlatformNotSupportedMessage, error);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeReactNativeOtpVerifySpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"ReactNativeOtpVerify";
}

@end
