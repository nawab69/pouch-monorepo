import { CACHE_SERVER_URL } from '@/constants/api';

interface RegisterDeviceParams {
  deviceId: string;
  pushToken: string;
  platform: 'ios' | 'android';
  addresses: string[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Register a device with the notification backend
 */
export async function registerDevice(params: RegisterDeviceParams): Promise<ApiResponse> {
  try {
    const response = await fetch(`${CACHE_SERVER_URL}/notifications/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to register device:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unregister a device from notifications
 */
export async function unregisterDevice(deviceId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${CACHE_SERVER_URL}/notifications/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to unregister device:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add new addresses to a device's monitored list
 */
export async function addAddresses(deviceId: string, addresses: string[]): Promise<ApiResponse> {
  try {
    const response = await fetch(`${CACHE_SERVER_URL}/notifications/addresses`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId,
        add: addresses,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to add addresses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove addresses from a device's monitored list
 */
export async function removeAddresses(deviceId: string, addresses: string[]): Promise<ApiResponse> {
  try {
    const response = await fetch(`${CACHE_SERVER_URL}/notifications/addresses`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId,
        remove: addresses,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to remove addresses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update all addresses for a device (replaces existing)
 * This re-registers the device with the new address list
 */
export async function updateAllAddresses(
  deviceId: string,
  pushToken: string,
  platform: 'ios' | 'android',
  addresses: string[]
): Promise<ApiResponse> {
  return registerDevice({
    deviceId,
    pushToken,
    platform,
    addresses,
  });
}
