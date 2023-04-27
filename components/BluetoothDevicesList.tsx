import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
// import { BleManager, Device } from 'react-native-ble-plx';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { Button, List, ActivityIndicator, IconButton } from 'react-native-paper';
import {
  BLEPrinter,
  COMMANDS,
  ColumnAlignment,
  IBLEPrinter,
} from "react-native-thermal-receipt-printer-image-qr";

interface IDeviceItemProps {
  item: IBLEPrinter;
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
  const [devices, setDevices] = useState<IBLEPrinter[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [deviceAddresses, setDeviceAddresses] = useState<Set<string>>(new Set());

  // const manager = new BleManager();

  useEffect(() => {
    const initPermissions = async () => {
      const granted = await requestLocationPermission();
      if (!granted) {
        console.log('Location permission not granted');
      }

      if(granted){
        await BLEPrinter.init();
      }
    };
    initPermissions();
  }, []);


  const connectToDevice = async (device: IBLEPrinter) => {
    try {
      
      await BLEPrinter.connectPrinter(device.inner_mac_address);
      Alert.alert('Connected', `Connected to ${device.device_name || 'Unknown Device'}`);
     
      setConnectedDeviceId(device.inner_mac_address);
    } catch (error) {
      Alert.alert('Error', 'Unable to connect to the device');
      console.log('Error connecting to device:', error);
    }
  };

  const disconnectFromDevice = async (device: IBLEPrinter) => {
    try {
      // await device.cancelConnection();
      await BLEPrinter.closeConn()
      setConnectedDeviceId(null);
      Alert.alert('Disconnected', `Disconnected from ${device.device_name || 'Unknown Device'}`);
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

  const printText = async (device: IBLEPrinter) => {
    try {
    
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


      Alert.alert('Printed', `Text printed to ${device.device_name || 'Unknown Device'}`);
    } catch (error) {
      Alert.alert('Error', 'Unable to print the text');
      console.log('Error printing text:', error);
    }
  };

  const scanDevices = async () => {
    setScanning(true);
    try {
      const deviceList = await BLEPrinter.getDeviceList();
      const newDevices = deviceList.filter(device => !deviceAddresses.has(device.inner_mac_address));

      setDevices(prevDevices => [...prevDevices, ...newDevices]);
      setDeviceAddresses(prevAddresses => {
        const updatedAddresses = new Set(prevAddresses);
        newDevices.forEach(device => updatedAddresses.add(device.inner_mac_address));
        return updatedAddresses;
      });

    } catch (error) {
      console.log('Error getting device list:', error);
    }
    setScanning(false);
  };

  useEffect(() => {
    console.log(`Devices : ${JSON.stringify(devices)}`);
  }, [devices])

  const renderItem = ({ item }: IDeviceItemProps) => {
    const isConnected = connectedDeviceId === item.inner_mac_address;

    return (
      item.device_name ? <List.Item
        title={item.device_name || 'Unknown Device'}
        description={isConnected ? 'Connected' : `ID: ${item.inner_mac_address}`}
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
        keyExtractor={(item) => item.inner_mac_address}
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
