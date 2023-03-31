import { JsonRpcProvider, devnetConnection } from '@mysten/sui.js';
import { faker } from '@faker-js/faker';

import { SuinsClient } from '../src';

describe('SuiNS Client', () => {
  const client = new SuinsClient(new JsonRpcProvider(devnetConnection));
  const domainName = 'suins-test.sui';
  const walletAddress =
    '0x3dd132088475de4d710826a344700667c3c18211011ca346f45eb30541e286a7';
  const nonExistingDomain = faker.datatype.string(64);
  const nonExistingWalletAddress = walletAddress.replace('86a7', '0000');

  beforeEach(async () => {
    console.log(expect.getState().currentTestName);
    await client.getSuinsContractObjects();
    console.log(client.contractObjects);
  });

  describe('getAddress', () => {
    describe('input domain has a linked address set', () => {
      it('returns the linked address', async () => {
        expect(await client.getAddress(domainName)).toBe(walletAddress);
      });
    });

    describe('input domain does not have a linked address set', () => {
      it('returns undefined', async () => {
        expect(await client.getAddress(nonExistingDomain)).toBeUndefined();
      });
    });
  });

  describe('getName', () => {
    describe('input domain has a default name set', () => {
      it('returns the default name', async () => {
        expect(await client.getName(walletAddress)).toBe(domainName);
      });
    });

    describe('input domain does not have a default name set', () => {
      it('returns undefined', async () => {
        expect(await client.getName(nonExistingWalletAddress)).toBeUndefined();
      });
    });
  });
});
