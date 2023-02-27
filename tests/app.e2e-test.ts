import { JsonRpcProvider, devnetConnection } from '@mysten/sui.js';

import { SuinsClient } from '../src';

describe('SuiNS Client', () => {
  const client = new SuinsClient(new JsonRpcProvider(devnetConnection));
  const domainName = 'suins-test-domain.sui';
  const walletAddress = '0x484f1024c91ad8c9824bf46a708e3529251b2bc3';

  beforeEach(() => {
    console.log(expect.getState().currentTestName);
  });

  describe('getAddress', () => {
    it('returns linked address of a domain name if it was set', async () => {
      expect(await client.getAddress(domainName)).toBe(walletAddress);
    }, 300000);
  });

  describe('getName', () => {
    it('returns the default name of an address if it was set', async () => {
      expect(await client.getName(walletAddress)).toBe(domainName);
    }, 300000);
  });
});
