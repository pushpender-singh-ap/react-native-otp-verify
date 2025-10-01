package com.pushpendersingh.reactnativeotpverify

import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.os.Build
import android.util.Base64
import android.util.Log
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.util.ArrayList

/**
 * Helper class to generate and retrieve the app's hash signature.
 * This hash is required to be included in SMS messages for the SMS Retriever API.
 * 
 * Based on Google's AppSignatureHelper sample:
 * https://github.com/googlesamples/android-credentials/blob/master/sms-verification/android/app/src/main/java/com/google/samples/smartlock/sms_verify/AppSignatureHelper.java
 */
class AppSignatureHelper(context: Context) : ContextWrapper(context) {

    companion object {
        const val TAG = "AppSignatureHelper"
        private const val HASH_TYPE = "SHA-256"
        const val NUM_HASHED_BYTES = 9
        const val NUM_BASE64_CHAR = 11
    }

    /**
     * Get all the app signatures for the current package
     * @return List of app signatures as base64 encoded strings
     */
    fun getAppSignatures(): ArrayList<String> {
        val appCodes = ArrayList<String>()

        try {
            // Get all package signatures for the current package
            val packageName = packageName
            val packageManager = packageManager
            
            val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                // For Android 9 (API 28) and above
                val signingInfo = packageManager.getPackageInfo(
                    packageName,
                    PackageManager.GET_SIGNING_CERTIFICATES
                ).signingInfo
                
                if (signingInfo?.hasMultipleSigners() == true) {
                    signingInfo.apkContentsSigners
                } else {
                    signingInfo?.signingCertificateHistory
                }
            } else {
                // For Android 8.1 (API 27) and below
                @Suppress("DEPRECATION")
                packageManager.getPackageInfo(
                    packageName,
                    PackageManager.GET_SIGNATURES
                ).signatures
            }

            // For each signature, create a compatible hash
            signatures?.forEach { signature ->
                val hash = hash(packageName, signature.toCharsString())
                if (hash != null) {
                    appCodes.add(String.format("%s", hash))
                    Log.d(TAG, "App Signature: $hash")
                } else {
                    Log.e(TAG, "Failed to generate hash for signature")
                }
            }
        } catch (e: PackageManager.NameNotFoundException) {
            Log.e(TAG, "Unable to find package to obtain hash.", e)
        }

        return appCodes
    }

    /**
     * Compute the SHA-256 hash of the package name and signature.
     * 
     * @param packageName The package name
     * @param signature The app signature
     * @return The first 11 characters of the base64 encoded hash
     */
    private fun hash(packageName: String, signature: String): String? {
        val appInfo = "$packageName $signature"
        
        try {
            val messageDigest = MessageDigest.getInstance(HASH_TYPE)
            messageDigest.update(appInfo.toByteArray(StandardCharsets.UTF_8))
            
            var hashSignature = messageDigest.digest()

            // Truncate to the first NUM_HASHED_BYTES bytes
            hashSignature = hashSignature.copyOfRange(0, NUM_HASHED_BYTES)
            
            // Encode as base64 and take the first NUM_BASE64_CHAR characters
            var base64Hash = Base64.encodeToString(
                hashSignature,
                Base64.NO_PADDING or Base64.NO_WRAP
            )
            base64Hash = base64Hash.substring(0, NUM_BASE64_CHAR)

            Log.d(TAG, "Package: $packageName")
            Log.d(TAG, "Hash: $base64Hash")
            
            return base64Hash
        } catch (e: NoSuchAlgorithmException) {
            Log.e(TAG, "No Such Algorithm Exception", e)
        }

        return null
    }
}
