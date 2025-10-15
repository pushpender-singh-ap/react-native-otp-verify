package com.pushpendersingh.reactnativeotpverify

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.module.annotations.ReactModule
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status
import com.pushpendersingh.reactnativeotpverify.NativeReactNativeOtpVerifySpec
import android.util.Log
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

@ReactModule(name = ReactNativeOtpVerifyModule.NAME)
class ReactNativeOtpVerifyModule(reactContext: ReactApplicationContext) :
  NativeReactNativeOtpVerifySpec(reactContext),
  ActivityEventListener {

  // Thread-safe state management using AtomicBoolean and Volatile
  @Volatile
  private var smsReceiver: BroadcastReceiver? = null
  private val isReceiverRegistered = AtomicBoolean(false)
  
  @Volatile
  private var consentReceiver: BroadcastReceiver? = null
  private val isConsentReceiverRegistered = AtomicBoolean(false)
  
  // Locks for thread-safe register/unregister operations
  private val receiverLock = ReentrantLock()
  private val consentLock = ReentrantLock()

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String {
    return NAME
  }

  /**
   * Starts the SMS Retriever API to listen for incoming SMS messages.
   * The API will listen for up to 5 minutes for a matching SMS message.
   */
  override fun startSmsRetriever(promise: Promise) {
    val client = SmsRetriever.getClient(reactApplicationContext)
    val task = client.startSmsRetriever()

    task.addOnSuccessListener {
      // Register the broadcast receiver to listen for SMS
      registerReceiver()
      promise.resolve("SMS Retriever started successfully")
    }

    task.addOnFailureListener { exception ->
      promise.reject("START_FAILED", "Failed to start SMS Retriever: ${exception.message}", exception)
    }
  }

  /**
   * Gets the app signature hash required for SMS verification.
   * This hash must be included in the SMS message sent from the server.
   */
  override fun getAppSignature(promise: Promise) {
    try {
      val helper = AppSignatureHelper(reactApplicationContext)
      val signatures = helper.getAppSignatures()
      
      if (signatures.isNotEmpty()) {
        promise.resolve(signatures[0])
      } else {
        promise.reject("NO_SIGNATURE", "Could not generate app signature")
      }
    } catch (e: Exception) {
      promise.reject("SIGNATURE_ERROR", "Error getting app signature: ${e.message}", e)
    }
  }

  /**
   * Requests SMS consent from the user for a specific sender.
   * This is an alternative approach that shows a consent dialog.
   */
  override fun requestPhoneNumber(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Activity doesn't exist")
      return
    }

    try {
      // Register consent receiver to listen for SMS
      registerConsentReceiver()
      
      val client = SmsRetriever.getClient(reactApplicationContext)
      val task = client.startSmsUserConsent(null)

      task.addOnSuccessListener {
        promise.resolve("SMS User Consent started successfully")
      }

      task.addOnFailureListener { exception ->
        unregisterConsentReceiver()
        promise.reject("CONSENT_FAILED", "Failed to start SMS User Consent: ${exception.message}", exception)
      }
    } catch (e: Exception) {
      unregisterConsentReceiver()
      promise.reject("CONSENT_ERROR", "Error starting SMS User Consent: ${e.message}", e)
    }
  }

  /**
   * Removes the SMS receiver to stop listening for messages.
   */
  override fun removeSmsListener(promise: Promise) {
    try {
      unregisterReceiver()
      promise.resolve("SMS Listener removed successfully")
    } catch (e: Exception) {
      promise.reject("REMOVE_FAILED", "Failed to remove SMS Listener: ${e.message}", e)
    }
  }

  /**
   * Thread-safe receiver registration using ReentrantLock
   * Prevents race conditions during concurrent register attempts
   */
  private fun registerReceiver() {
    receiverLock.withLock {
      if (isReceiverRegistered.get()) {
        Log.w(NAME, "Receiver already registered, skipping")
        return
      }

      smsReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          if (SmsRetriever.SMS_RETRIEVED_ACTION == intent.action) {
            val extras = intent.extras
            val status = extras?.get(SmsRetriever.EXTRA_STATUS) as? Status

            when (status?.statusCode) {
              CommonStatusCodes.SUCCESS -> {
                // Get SMS message contents
                val message = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE)
                
                // Get SMS Sender address (available in GMS version 24.20+)
                val senderAddress = extras.getString(SmsRetriever.EXTRA_SMS_ORIGINATING_ADDRESS)

                // Send event to JavaScript using new EventEmitter pattern
                val params = Arguments.createMap().apply {
                  putString("message", message)
                  putString("status", "success")
                  if (senderAddress != null) {
                    putString("senderAddress", senderAddress)
                  }
                }
                sendEvent(params)
              }
              CommonStatusCodes.TIMEOUT -> {
                // Timeout occurred (5 minutes)
                val params = Arguments.createMap().apply {
                  putString("status", "timeout")
                  putString("message", "SMS Retriever timed out after 5 minutes")
                }
                sendEvent(params)
              }
              else -> {
                val params = Arguments.createMap().apply {
                  putString("status", "error")
                  putString("message", "SMS Retriever failed with status: ${status?.statusCode}")
                }
                sendEvent(params)
              }
            }
          }
        }
      }

      val intentFilter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
      
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          reactApplicationContext.registerReceiver(
            smsReceiver,
            intentFilter,
            SmsRetriever.SEND_PERMISSION,
            null,
            Context.RECEIVER_EXPORTED
          )
        } else {
          reactApplicationContext.registerReceiver(
            smsReceiver,
            intentFilter,
            SmsRetriever.SEND_PERMISSION,
            null
          )
        }
        
        isReceiverRegistered.set(true)
        Log.d(NAME, "SMS Receiver registered successfully")
      } catch (e: Exception) {
        Log.e(NAME, "Failed to register receiver", e)
        smsReceiver = null
      }
    }
  }

  /**
   * Thread-safe receiver unregistration using ReentrantLock
   * Prevents race conditions and ensures proper cleanup
   */
  private fun unregisterReceiver() {
    receiverLock.withLock {
      if (!isReceiverRegistered.get() || smsReceiver == null) {
        return
      }
      
      try {
        reactApplicationContext.unregisterReceiver(smsReceiver)
        Log.d(NAME, "SMS Receiver unregistered successfully")
      } catch (e: IllegalArgumentException) {
        // Receiver was not registered, ignore
        Log.w(NAME, "Receiver was not registered", e)
      } finally {
        isReceiverRegistered.set(false)
        smsReceiver = null
      }
    }
  }

  /**
   * Thread-safe consent receiver registration using ReentrantLock
   * Prevents race conditions during concurrent register attempts
   */
  private fun registerConsentReceiver() {
    consentLock.withLock {
      if (isConsentReceiverRegistered.get()) {
        Log.w(NAME, "Consent receiver already registered, skipping")
        return
      }

      consentReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          if (SmsRetriever.SMS_RETRIEVED_ACTION == intent.action) {
            val extras = intent.extras
            val smsRetrieverStatus = extras?.get(SmsRetriever.EXTRA_STATUS) as? Status

            when (smsRetrieverStatus?.statusCode) {
              CommonStatusCodes.SUCCESS -> {
                // Get consent intent
                val consentIntent = extras.getParcelable<Intent>(SmsRetriever.EXTRA_CONSENT_INTENT)
                
                try {
                  // Launch the consent dialog
                  val activity = reactApplicationContext.currentActivity
                  activity?.startActivityForResult(consentIntent, SMS_CONSENT_REQUEST)
                } catch (e: Exception) {
                  val params = Arguments.createMap().apply {
                    putString("status", "error")
                    putString("message", "Failed to launch consent dialog: ${e.message}")
                  }
                  sendEvent(params)
                }
              }
              CommonStatusCodes.TIMEOUT -> {
                val params = Arguments.createMap().apply {
                  putString("status", "timeout")
                  putString("message", "SMS consent timed out")
                }
                sendEvent(params)
                unregisterConsentReceiver()
              }
            }
          }
        }
      }

      val intentFilter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
      
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          reactApplicationContext.registerReceiver(
            consentReceiver,
            intentFilter,
            SmsRetriever.SEND_PERMISSION,
            null,
            Context.RECEIVER_EXPORTED
          )
        } else {
          reactApplicationContext.registerReceiver(
            consentReceiver,
            intentFilter,
            SmsRetriever.SEND_PERMISSION,
            null
          )
        }
        
        isConsentReceiverRegistered.set(true)
        Log.d(NAME, "Consent receiver registered successfully")
      } catch (e: Exception) {
        Log.e(NAME, "Failed to register consent receiver", e)
        consentReceiver = null
      }
    }
  }

  /**
   * Thread-safe consent receiver unregistration using ReentrantLock
   * Prevents race conditions and ensures proper cleanup
   */
  private fun unregisterConsentReceiver() {
    consentLock.withLock {
      if (!isConsentReceiverRegistered.get() || consentReceiver == null) {
        return
      }
      
      try {
        reactApplicationContext.unregisterReceiver(consentReceiver)
        Log.d(NAME, "Consent receiver unregistered successfully")
      } catch (e: IllegalArgumentException) {
        // Receiver was not registered, ignore
        Log.w(NAME, "Consent receiver was not registered", e)
      } finally {
        isConsentReceiverRegistered.set(false)
        consentReceiver = null
      }
    }
  }

  /**
   * Thread-safe event emission using the new EventEmitter pattern
   * The base class provides emitOnSmsReceived method through CodeGen
   */
  private fun sendEvent(params: WritableMap?) {
    if (params == null) return 
    try {
      emitOnSmsReceived(params)
    } catch (e: Exception) {
      Log.e(NAME, "Error sending event: ${e.message}", e)
    }
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    when (requestCode) {
      SMS_CONSENT_REQUEST -> {
        if (resultCode == Activity.RESULT_OK && data != null) {
          // Get SMS message from the result
          val message = data.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE)
          
          val params = Arguments.createMap().apply {
            putString("message", message)
            putString("status", "success")
          }
          sendEvent(params)
        } else {
          // User denied consent
          val params = Arguments.createMap().apply {
            putString("status", "error")
            putString("message", "User denied SMS consent")
          }
          sendEvent(params)
        }
        unregisterConsentReceiver()
      }
    }
  }

  override fun onNewIntent(intent: Intent) {
    // Handle new intents if needed
  }

  override fun invalidate() {
    super.invalidate()
    unregisterReceiver()
    unregisterConsentReceiver()
  }

  companion object {
    const val NAME = "ReactNativeOtpVerify"
    private const val SMS_CONSENT_REQUEST = 1001
  }
}
