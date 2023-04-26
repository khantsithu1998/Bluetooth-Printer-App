import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform, StatusBar } from 'react-native';
import BluetoothDevicesList from './components/BluetoothDevicesList';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';


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


const App = () => {

  useEffect(() => {
    const initPermissions = async () => {
      const granted = await requestLocationPermission();
      if (!granted) {
        console.log('Location permission not granted');
      }
    };
    initPermissions();
  }, []);

  return (
    <>
    <StatusBar backgroundColor={'white'} barStyle={'dark-content'}/>
    <BluetoothDevicesList /></>
  );
};

export default App;
