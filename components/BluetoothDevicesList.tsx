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
import {
  BLEPrinter,
  COMMANDS,
  ColumnAlignment,
} from "react-native-thermal-receipt-printer-image-qr";

interface IDeviceItemProps {
  item: Device;
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


  const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
  const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;
  let orderList = [
    ["1. Skirt Palas Labuh Muslimah Fashion", "x2", "500$"],
    ["2. BLOUSE ROPOL VIRAL MUSLIMAH FASHION", "x4222", "500$"],
    [
      "3. Women Crew Neck Button Down Ruffle Collar Loose Blouse",
      "x1",
      "30000000000000$",
    ],
    ["4. Retro Buttons Up Full Sleeve Loose", "x10", "200$"],
    ["5. Retro Buttons Up", "x10", "200$"],
  ];
  let columnAlignment = [
    ColumnAlignment.LEFT,
    ColumnAlignment.CENTER,
    ColumnAlignment.RIGHT,
  ];
  let columnWidth = [46 - (7 + 12), 7, 12];
  const header = ["Product list", "Qty", "Price"];

  const printText = async (device: Device) => {
    try {
      await BLEPrinter.init();
      await BLEPrinter.connectPrinter(device.id);
      BLEPrinter.printColumnsText(header, columnWidth, columnAlignment, [
        `${BOLD_ON}`,
        "",
        "",
      ]);
      for (let i in orderList) {
        BLEPrinter.printColumnsText(orderList[i], columnWidth, columnAlignment, [
          `${BOLD_OFF}`,
          "",
          "",
        ]);
      }
      BLEPrinter.printText('\n\n')
      BLEPrinter.printBill(`<C>Thank you\n`);


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
