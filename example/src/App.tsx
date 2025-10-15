import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import {
  startSmsRetriever,
  addSmsListener,
  removeSmsListener,
  getAppSignature,
  extractOtp,
  requestPhoneNumber,
} from '@pushpendersingh/react-native-otp-verify';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [otp, setOtp] = useState('');
  const [appHash, setAppHash] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Get app signature on mount
    getAppSignature()
      .then((hash) => setAppHash(hash))
      .catch((error) => console.error(error));

    // Setup SMS listener
    const subscription = addSmsListener((message) => {
      console.log('SMS Event:', message);

      if (message.status === 'success' && message.message) {
        const code = extractOtp(message.message);
        if (code) {
          setOtp(code);
          setIsListening(false);
          Alert.alert('OTP Received!', `Code: ${code}`);
        }
      } else if (message.status === 'timeout') {
        setIsListening(false);
        Alert.alert('Timeout', 'SMS retrieval timed out');
      }
    });

    return () => {
      subscription.remove();
      removeSmsListener();
    };
  }, []);

  const handleStartListening = async () => {
    try {
      await startSmsRetriever();
      setIsListening(true);
      Alert.alert('Listening', 'Waiting for OTP SMS...');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRequestConsent = async () => {
    try {
      await requestPhoneNumber();
      Alert.alert(
        'SMS Consent Started',
        'Waiting for SMS... You will see a consent dialog when SMS arrives.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🔐 OTP Verify Demo</Text>
          <View style={styles.infoBox}>
            <Text style={styles.info}>
              ⚠️ This demo is designed for Android devices.
              {'\n\n'}
              OTP verification using SMS Retriever API is an Android-only
              feature.
              {'\n\n'}
              The library includes proper iOS support with graceful error
              handling, but the functionality is not available on iOS.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔐 OTP Verify Demo</Text>

        {/* App Hash */}
        <View style={styles.section}>
          <Text style={styles.label}>App Signature Hash:</Text>
          <View style={styles.hashBox}>
            <Text style={styles.hash}>{appHash || 'Loading...'}</Text>
          </View>
          <Text style={styles.hint}>Include this in your SMS</Text>
        </View>

        {/* Status */}
        {isListening && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>🎧 Listening for SMS...</Text>
          </View>
        )}

        {/* Start Button */}
        <View style={styles.section}>
          <Button
            title={isListening ? '⏹️ Listening...' : '▶️ Start SMS Retriever'}
            onPress={handleStartListening}
            disabled={isListening}
          />
        </View>

        {/* SMS Consent API Button */}
        <View style={styles.section}>
          <Text style={styles.label}>Alternative: SMS User Consent</Text>
          <Button
            title="📱 Request SMS Consent"
            onPress={handleRequestConsent}
            color="#ff9800"
          />
          <Text style={styles.hint}>
            Shows consent dialog • Works with any SMS format
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.section}>
          <Text style={styles.label}>OTP Code:</Text>
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            placeholder="Auto-filled or enter manually"
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button
            title="Verify OTP"
            onPress={() => {
              if (otp) {
                Alert.alert('Success', `Verified OTP: ${otp}`);
              } else {
                Alert.alert('Error', 'Please enter OTP');
              }
            }}
            disabled={!otp}
          />
        </View>

        {/* SMS Format */}
        <View style={styles.section}>
          <Text style={styles.label}>Required SMS Format:</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>
              {'<#> Your code is: 123456\n\n'}
              {appHash}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.info}>
            💡 No SMS permissions required!{'\n'}
            ⏱️ Listens for 5 minutes{'\n'}
            🔒 Uses Google Play Services
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  hashBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196f3',
    borderStyle: 'dashed',
  },
  hash: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusBox: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  codeBox: {
    backgroundColor: '#263238',
    padding: 16,
    borderRadius: 8,
  },
  code: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#aed581',
  },
  infoBox: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    marginTop: 10,
  },
  info: {
    fontSize: 14,
    color: '#e65100',
    lineHeight: 22,
  },
  error: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    textAlign: 'center',
  },
});
