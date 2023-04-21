import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { Button, List, ActivityIndicator, IconButton } from 'react-native-paper';
import ThermalPrinterModule from 'react-native-thermal-printer'

interface IDeviceItemProps {
  item: Device;
}

class EscPosPrinterCommands {
  static ESC_ALIGN_LEFT = "\u001b" + "a" + "0";
  static ESC_ALIGN_CENTER = "\u001b" + "a" + "1";
  static ESC_ALIGN_RIGHT = "\u001b" + "a" + "2";
  static ESC_BOLD = "\u001b" + "E" + "1";
  static ESC_BOLD_OFF = "\u001b" + "E" + "0";
  static ESC_UNDERLINE = "\u001b" + "-" + "1";
  static ESC_UNDERLINE_OFF = "\u001b" + "-" + "0";
  static ESC_LINE_SEPARATOR = "-------------------------";
}


const requestLocationPermission = async () => {
  const permission = Platform.select({
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  });

  const status = await check(permission!);

  if (status === RESULTS.GRANTED) {
    return true;
  }

  const result = await request(permission!);
  return result === RESULTS.GRANTED;
};

const BluetoothDevicesList = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);

  const manager = new BleManager();

  useEffect(() => {
    const initPermissions = async () => {
      const granted = await requestLocationPermission();
      if (!granted) {
        console.log('Location permission not granted');
      }
    };
    initPermissions();
  }, []);

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        subscription.remove();
      }
    }, true);
    return () => subscription.remove();
  }, []);

  const connectToDevice = async (device: Device) => {
    try {
      const connectedDevice = await device.connect();
      const services = await connectedDevice.discoverAllServicesAndCharacteristics();
      // Connection and pairing is successful
      // Alert.alert('Connected', `Connected to ${device.name || 'Unknown Device'}`);
      console.log('Connected device services:', services);
      setConnectedDeviceId(device.id);
    } catch (error) {
      Alert.alert('Error', 'Unable to connect to the device');
      console.log('Error connecting to device:', error);
    }
  };

  const disconnectFromDevice = async (device: Device) => {
    try {
      await device.cancelConnection();
      setConnectedDeviceId(null);
      Alert.alert('Disconnected', `Disconnected from ${device.name || 'Unknown Device'}`);
    } catch (error) {
      Alert.alert('Error', 'Unable to disconnect from the device');
      console.log('Error disconnecting from device:', error);
    }
  };

  // const text =
  // "      " + EscPosPrinterCommands.ESC_ALIGN_CENTER + "ORDER N°045" + EscPosPrinterCommands.ESC_ALIGN_LEFT + "       \n" +
  // EscPosPrinterCommands.ESC_LINE_SEPARATOR +
  // "                         \n" +
  // EscPosPrinterCommands.ESC_BOLD + " BEAUTIFUL SHIRT" + EscPosPrinterCommands.ESC_BOLD_OFF + "  9.99e  \n" +
  // "   + Size : S           \n" +
  // "                         \n" +
  // EscPosPrinterCommands.ESC_BOLD + " AWESOME HAT" + EscPosPrinterCommands.ESC_BOLD_OFF + "    24.99e  \n" +
  // "   + Size : 57/58        \n" +
  // "                         \n" +
  // EscPosPrinterCommands.ESC_LINE_SEPARATOR +
  // " TOTAL PRICE :  34.98e   \n" +
  // " TAX :          4.23e    \n" +
  // "                         \n" +
  // EscPosPrinterCommands.ESC_LINE_SEPARATOR +
  // EscPosPrinterCommands.ESC_UNDERLINE + " Customer :" + EscPosPrinterCommands.ESC_UNDERLINE_OFF + "              \n" +
  // " Khant Si Thu            \n" +
  // " North oKkalapa       \n" +
  // " 31547 PERPETES          \n" +
  // " Tel : +33801201456      \n" +
  // "                         \n";

  // const text =
  //   "      ORDER N°045       \n" +
  //   "-------------------------\n" +
  //   "                         \n" +
  //   " BEAUTIFUL SHIRT  6000 MMK  \n" +
  //   " Size : S           \n" +
  //   "                         \n" +
  //   " AWESOME HAT    4000 MMK \n" +
  //   "   + Size : 57/58        \n" +
  //   "                         \n" +
  //   "-------------------------\n" +
  //   " TOTAL PRICE :  34.98e   \n" +
  //   " TAX :          4.23e    \n" +
  //   "                         \n" +
  //   "-------------------------\n" +
  //   " Customer :              \n" +
  //   " Khant Si Thu            \n" +
  //   " 5 rue des girafes       \n" +
  //   " 31547 PERPETES          \n" +
  //   " Tel : +33801201456      \n" +
  //   "                         \n";

  const text =
  '[C]<img>https://via.placeholder.com/300.jpg</img>\n' +
  '[L]\n' +
  "[C]<u><font size='big'>ORDER N°045</font></u>\n" +
  '[L]\n' +
  '[C]================================\n' +
  '[L]\n' +
  '[L]<b>BEAUTIFUL SHIRT</b>[R]6000 MMK\n' +
  '[L]  + Size : S\n' +
  '[L]\n' +
  '[L]<b>AWESOME HAT</b>[R]4000 MMK\n' +
  '[L]  + Size : 57/58\n' +
  '[L]\n' +
  '[C]--------------------------------\n' +
  '[R]TOTAL PRICE :[R]10000 MMK\n' +
  '[R]TAX :[R]200 MMK\n' +
  '[L]\n' +
  '[C]================================\n' +
  '[L]\n' +
  "[L]<font size='tall'>Customer :</font>\n" +
  '[L]Khant Si Thu\n' +
  '[L]North Okkalapa\n' +
  '[L]Tel : +959942245083\n' +
  '[L]\n' +
  "[C]<barcode type='ean13' height='10'>831254784551</barcode>\n" +
  // "[C]<qrcode size='20'>http://www.developpeur-web.dantsu.com/</qrcode>\n" +
  '[L]\n' +
  '[L]\n' +
  '[L]\n' +
  '[L]\n' +
  '[L]\n';


  // console.log(text)


  const printText = async (device: Device) => {
    try {
      await ThermalPrinterModule.printBluetooth({
        payload: text,
        // printerNbrCharactersPerLine: 100,
      });
      Alert.alert('Printed', `Text printed to ${device.name || 'Unknown Device'}`);
    } catch (error) {
      Alert.alert('Error', 'Unable to print the text');
      console.log('Error printing text:', error);
    }
  };

  const scanDevices = () => {
    setScanning(true);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Error scanning devices:', error);
        setScanning(false);
        return;
      }

      // Add discovered device to the list
      setDevices((prevState) => {
        const existingDevice = prevState.find((d) => d.id === device?.id);
        if (!existingDevice) {
          return device ? [...prevState, device] : prevState;
        } else {
          return prevState;
        }
      });
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  const renderItem = ({ item }: IDeviceItemProps) => {
    const isConnected = connectedDeviceId === item.id;

    return (
      item.name ? <List.Item
        title={item.name || 'Unknown Device'}
        description={isConnected ? 'Connected' : `ID: ${item.id}`}
        left={() => <List.Icon icon="bluetooth" />}
        right={() => (
          isConnected ? (
            <>
              <IconButton
                icon="link"
                onPress={() => disconnectFromDevice(item)}
                iconColor={'red'}
              />
              <IconButton
                icon="printer"
                onPress={() => printText(item)}
                iconColor={'green'}
              />
            </>
          ) : (
            <IconButton
              icon="link"
              onPress={() => connectToDevice(item)}
              iconColor={'blue'}
            />
          )
        )}
      /> : <></>
    )
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={scanDevices}>
        Scan for Bluetooth devices
      </Button>
      {scanning && (
        <ActivityIndicator
          animating={true}
          color={'blue'}
          style={styles.scanningIndicator}
        />
      )}
      <FlatList
        data={devices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 20
  },
  scanningIndicator: {
    marginTop: 16,
  },
});

export default BluetoothDevicesList;
