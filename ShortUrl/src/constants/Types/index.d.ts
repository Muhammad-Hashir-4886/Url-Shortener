import { InternalAxiosRequestConfig } from 'axios';

interface SignType {
    name?: string
    email: string
    password: string
}

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
 
interface DeviceInfoData {
  deviceId: string;
  deviceName: string;
  platform: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}