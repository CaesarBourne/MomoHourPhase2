/**
 * The `metadata` header GHA's AuthMiddleware requires on every request (see
 * GHA/src/auth/auth.middleware.ts - 400 "HEADERS MISSING" without it). The
 * middleware only checks presence, not shape, but some downstream
 * logging/analytics reads fields out of it, so this portal sends the exact
 * realistic mobile-app-shaped payload captured from real traffic rather than
 * an empty placeholder.
 */
export const METADATA_HEADER_VALUE = JSON.stringify({
  appname: 'MTN MoMo',
  appversion: '3.4.4.000',
  buildtype: 'UAT',
  category: 'Test',
  channel: 'App',
  deviceInfo: {
    brand: 'Apple',
    deviceId: '3B92EF02-079D-4362-9F48-F8043110EC77',
    firstInstallTime: 1775893502923,
    location: '',
    model: 'iPhone 16 Pro',
    msisdn: '233244359439',
    os: 'ios',
    uniqueId: '3B92EF02-079D-4362-9F48-F8043110EC77'
  },
  devicecountry: 'IN',
  devicelocale: false,
  devicename: false,
  devicetype: false,
  devid: '3B92EF02-079D-4362-9F48-F8043110EC77',
  devinfo: 'Handset iPhone 16 Pro Apple',
  devtoken: false,
  firebasetoken: false,
  freediskstorage: false,
  groupname: 'GH',
  instanceid: '3B92EF02-079D-4362-9F48-F8043110EC77',
  ipaddress: false,
  isemulator: true,
  islandscape: false,
  ispinorfingerprintset: false,
  istablet: false,
  lang: 'en',
  model: false,
  msisdn: '233244359439',
  opco: 'GH',
  os: 'ios',
  reqtype: '1',
  screenid: 'Test',
  screentransaction: 'Test',
  sid: 'test',
  subcategory: 'Test',
  subscriberProfile: 'MTNGH Staff Pilot Enhanced Subscriber KYC Profile',
  subscribertype: 'consumer',
  timezone: '-330',
  type: false,
  useragent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  version: '3.4.4/ios',
  wifiormobiledata: 'wifi',
  debugmode: 'true'
});
