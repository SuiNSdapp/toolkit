import { JsonRpcProvider, testnetConnection } from '@mysten/sui.js';
import { faker } from '@faker-js/faker';

import { SuinsClient } from '../src';

const domainName = 'yiuyouioui.sui';
const walletAddress =
  '0xfce343a643991c592c4f1a9ee415a7889293f694ab8828f78e3c81d11c9530c6';

describe('SuiNS Client', () => {
  const client = new SuinsClient(new JsonRpcProvider(testnetConnection), {
    networkType: 'testnet',
    contractObjects: {
      packageId:
        '0x3278d6445c6403c96abe9e25cc1213a85de2bd627026ee57906691f9bbf2bf8a',
      registry:
        '0x13a3ab664bfbdff0ab03cd1ce8c6fb3f31a8803f2e6e0b14b610f8e94fcb8509',
      reverseRegistry:
        '0x4c13592fb96a80d332626ac33cb80b13aa723b0c93fd59c55805d2b6624b8795',
      suins:
        '0xba7b55eb2c3a03943fad5e1980c5b6b1a7005e014add1cfe9b8a44c84d9c3010',
    },
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
      expect(
        await client.getNameObject(domainName, { showOwner: true }),
      ).toEqual({
        id: '0x5955ebd57ef3ceb04164b401907db6fdec23673ddce117bf02032cca0a8d80a2',
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
