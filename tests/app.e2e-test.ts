import { JsonRpcProvider, testnetConnection } from '@mysten/sui.js';
import { faker } from '@faker-js/faker';

import { SuinsClient } from '../src';

const domainName = 'suins.sui';
const walletAddress =
  '0x3dd132088475de4d710826a344700667c3c18211011ca346f45eb30541e286a7';

describe('SuiNS Client', () => {
  const client = new SuinsClient(new JsonRpcProvider(testnetConnection), {
    networkType: 'testnet',
  });

  const nonExistingDomain = faker.datatype.string(64);
  const nonExistingWalletAddress = walletAddress.replace('86a7', '0000');

  beforeEach(async () => {
    console.log(expect.getState().currentTestName);
    await client.getSuinsContractObjects();
  });

  describe('getAddress', () => {
    describe('input domain has a linked address set', () => {
      it('returns the linked address', async () => {
        expect(await client.getAddress(domainName)).toEqual(walletAddress);
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

  describe('getNameObject', () => {
    it('returns related data of the name', async () => {
      expect(await client.getNameObject(domainName)).toEqual({
        avatar:
          '901babd1ab76e5c1918cdd636da16a7319b815fc4292bf00a9795f6f07fd79eb',
        contentHash: 'QmZsHKQk9FbQZYCy7rMYn1z6m9Raa183dNhpGCRm3fX71s',
        owner:
          '0x3dd132088475de4d710826a344700667c3c18211011ca346f45eb30541e286a7',
        targetAddress:
          '0x3dd132088475de4d710826a344700667c3c18211011ca346f45eb30541e286a7',
      });
    });
  });
});
