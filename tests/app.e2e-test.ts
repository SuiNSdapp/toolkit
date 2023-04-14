import { JsonRpcProvider, devnetConnection } from '@mysten/sui.js';
import { faker } from '@faker-js/faker';

import { SuinsClient } from '../src';

// TODO: Replace those temp hardcoded values for testing
const contractObjects = {
  packageId:
    '0x8960e22a94c60a18672a086d3b15c69898e2f8c1cd80d6348e04695c5688177e',
  registry:
    '0xd669c2f287c22c025279fc021b0ba6377c7dc5383734eb8d42dbfeb07aafc96b',
};
const domainName = 'asdasdf.sui';
const walletAddress =
  '0x3dd132088475de4d710826a344700667c3c18211011ca346f45eb30541e286a7';

describe('SuiNS Client', () => {
  const client = new SuinsClient(new JsonRpcProvider(devnetConnection), {
    contractObjects,
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

  describe('getNameObjectInfo', () => {
    it('returns related data of the name', async () => {
      expect(
        await client.getNameObjectInfo(domainName, {
          showAvatar: true,
          showContentHash: true,
        }),
      ).toEqual({
        avatar:
          'd2e29ec6719c37852882bf4cebc3de83fc061d4e67c89193c3fa0784e5b0dbd1',
        contentHash: 'QmZsHKQk9FbQZYCy7rMYn1z6m9Raa183dNhpGCRm3fX71s',
        data: '0x99703750c7f3efa231df1ed19639b1e607f4098a7c620d49447762e37790dc14',
        linkedAddr:
          '0x3dd132088475de4d710826a344700667c3c18211011ca346f45eb30541e286a7',
        owner:
          '0x3dd132088475de4d710826a344700667c3c18211011ca346f45eb30541e286a7',
        ttl: '0',
      });
    });
  });
});
