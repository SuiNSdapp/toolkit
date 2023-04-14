import { JsonRpcProvider, SuiAddress } from '@mysten/sui.js';

import {
  DataFields,
  NetworkType,
  ResolverData,
  SuiNSContract,
} from './types/objects';
import {
  DEVNET_JSON_FILE,
  GCS_URL,
  TESTNET_JSON_FILE,
} from './utils/constants';
import {
  camelCase,
  parseObjectDataResponse,
  parseRegistryResponse,
} from './utils/parser';

class SuinsClient {
  private suiProvider: JsonRpcProvider;
  contractObjects: SuiNSContract | undefined;
  networkType: NetworkType | undefined;

  constructor(
    suiProvider: JsonRpcProvider,
    options?: {
      contractObjects?: SuiNSContract;
      networkType?: NetworkType;
    },
  ) {
    if (!suiProvider) {
      throw new Error('Sui JsonRpcProvider must be specified.');
    }
    this.suiProvider = suiProvider;
    this.contractObjects = options?.contractObjects;
    this.networkType = options?.networkType;
  }

  async getSuinsContractObjects() {
    if ((this.contractObjects as SuiNSContract)?.packageId) return;

    const contractJsonFileUrl =
      GCS_URL +
      (this.networkType === 'testnet' ? TESTNET_JSON_FILE : DEVNET_JSON_FILE);

    let response;
    try {
      response = await fetch(contractJsonFileUrl);
    } catch (error) {
      throw new Error(
        `Error getting SuiNS contract objects, ${(error as Error).message}`,
      );
    }

    if (!response?.ok) {
      throw new Error(`Network Error: ${response?.status}`);
    }

    this.contractObjects = await response.json();
  }

  protected async getDynamicFieldObject(
    parentObjectId: SuiAddress,
    key: string,
    type = '0x1::string::String',
  ) {
    try {
      return await this.suiProvider.getDynamicFieldObject({
        parentId: parentObjectId,
        name: {
          type: type,
          value: key,
        },
      });
    } catch (error) {
      if (
        !((error as Error).cause as Error).message.includes(
          'Cannot find dynamic field',
        )
      ) {
        throw error;
      }
      return;
    }
  }

  protected async getNameData(
    dataObjectId: SuiAddress,
    fields: DataFields[] = [],
  ) {
    const { data: dynamicFields } = await this.suiProvider.getDynamicFields({
      parentId: dataObjectId,
    });

    const filteredFields = new Set(fields);
    const filteredDynamicFields = dynamicFields.filter(({ name: { value } }) =>
      filteredFields.has(value),
    );

    const data = await Promise.allSettled(
      filteredDynamicFields?.map(({ objectId }) =>
        this.suiProvider
          .getObject({
            id: objectId,
            options: { showContent: true },
          })
          .then(parseObjectDataResponse)
          .then((object) => [camelCase(object.name), object.value]),
      ) ?? [],
    );

    const fulfilledData = data.filter(
      (e) => e.status === 'fulfilled',
    ) as PromiseFulfilledResult<[string, any]>[];

    return Object.fromEntries(fulfilledData.map((e) => e.value));
  }

  /**
   * Returns the name object data including:
   *
   * - owner: the owner address
   * - ttl: caching time-to-live of the name specified by node. If TTL is zero, new data should be fetched on each query.
   * - linkedAddr: the linked address
   * - data?: the name data table id
   * - avatar?: the custom avatar id
   * - contentHash?: the ipfs cid
   *
   * If the input domain has not been registered, it will return an empty object.
   *
   * @param key a domain name or a reverse address, e.g. `3dd132088475de4d710826a344700667c3c18211011ca346f45eb30541e286a7.addr.reverse`.
   */
  async getNameObjectInfo(
    name: string,
    options?: { showAvatar?: boolean; showContentHash?: boolean },
  ): Promise<ResolverData> {
    await this.getSuinsContractObjects();

    const registryResponse = await this.getDynamicFieldObject(
      (this.contractObjects as SuiNSContract).registry,
      name,
    );
    const { defaultDomainName, ...nameObject } =
      parseRegistryResponse(registryResponse);

    if (name.includes('.addr.reverse'))
      return { defaultDomainName, ...nameObject };

    if (options?.showAvatar || options?.showContentHash) {
      const fields: DataFields[] = [
        options?.showAvatar && 'avatar',
        options?.showContentHash && 'contentHash',
      ].filter(Boolean) as DataFields[];

      const data = await this.getNameData(nameObject.data, fields);
      return { ...nameObject, ...data };
    }

    return nameObject;
  }

  /**
   * Returns the linked address of the input domain if the link was set. Otherwise, it will return undefined.
   *
   * @param domain a domain name ends with .sui or .move.
   */
  async getAddress(domain: string): Promise<string | undefined> {
    const { linkedAddr } = await this.getNameObjectInfo(domain);

    return linkedAddr;
  }

  /**
   * Returns the default name of the input address if it was set. Otherwise, it will return undefined.
   *
   * @param address a Sui address.
   */
  async getName(address: string): Promise<string | undefined> {
    const { defaultDomainName } = await this.getNameObjectInfo(
      `${address.slice(2)}.addr.reverse`,
    );

    if (!defaultDomainName) return;

    const { owner } = await this.getNameObjectInfo(defaultDomainName);

    if (address !== owner) return;

    return defaultDomainName;
  }
}

export { SuinsClient };
