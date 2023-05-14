import { JsonRpcProvider, testnetConnection } from '@mysten/sui.js';
// import { faker } from '@faker-js/faker';

import { SuinsClient } from '../src';

const domainName = 'manos2.sui';
const walletAddress =
  '0xe0b97bff42fcef320b5f148db69033b9f689555348b2e90f1da72b0644fa37d0';

describe('SuiNS Client', () => {
  const client = new SuinsClient(new JsonRpcProvider(testnetConnection), {
    networkType: 'testnet',
    contractObjects: {
      packageId:
        '0x90cf48e6fe73784de34b18b3e8d856dc6853a53ab0ca5adcb63274daeb361742',
      registry:
        '0xf30ebb82632f19ad1ddf7d7255d6599db971a70f66d44ea674f29e8263b792e1',
      reverseRegistry:
        '0xbda71ca8f6f3d01848b4846a21e3224c2ee3327f722f2ed76e3ff1f5f9e6b9e4',
      suins:
        '0x60156fc76564760ad99443112c266046b6852e6992266d06a45f705a3ad66900',
    },
  });

  const nonExistingDomain = walletAddress + '.sui';
  const nonExistingWalletAddress =
    walletAddress.substring(0, walletAddress.length - 4) + '0000';

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
        await client.getNameObject(domainName, {
          showOwner: true,
          showAvatar: true,
        }),
      ).toEqual({
        id: '0x4d62a55e1a94d849c0896e03b54241b681d34085b875b60effce2bdb05bd0b2a',
        nftId:
          '0xc8bb387fdcc4cc5683bb3cdab65048830676101dc84573bd9dc5a2dd875de5c9',
        expirationTimestampMs: '1715433249664',
        owner: walletAddress,
        targetAddress: walletAddress,
        avatar:
          'https://api-testnet.suifrens.sui.io/suifrens/0x6f1afd7c8bf933ca19508947a1dd634f42eadbed9ea079119ce99c762bee5838/svg',
        contentHash: 'QmSosoWZJU9Vt8gwnVmG2NZxTDmAP9BD8qevtPtbj8fpyH',
      });
    });

    it('Does not include avatar if the flag is off', async () => {
      expect(
        await client.getNameObject(domainName, {
          showOwner: true,
        }),
      ).not.toHaveProperty('avatar');
    });

    it('Does not include owner if the flag is off', async () => {
      expect(await client.getNameObject(domainName)).not.toHaveProperty(
        'owner',
      );
    });
  });
});
