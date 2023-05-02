import { JsonRpcProvider, SuiAddress } from '@mysten/sui.js';

import {
  DataFields,
  NetworkType,
  NameObject,
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
    if (!dataObjectId) return {};

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
   * - id: the name object address
   * - owner: the owner address
   * - targetAddress: the linked address
   * - avatar?: the custom avatar id
   * - contentHash?: the ipfs cid
   *
   * If the input domain has not been registered, it will return an empty object.
   *
   * @param key a domain name
   */
  async getNameObject(name: string): Promise<NameObject> {
    await this.getSuinsContractObjects();

    const registryResponse = await this.getDynamicFieldObject(
      (this.contractObjects as SuiNSContract).registry,
      name,
    );
    const { defaultDomainName, ...nameObject } =
      parseRegistryResponse(registryResponse);

    if (name.includes('.addr.reverse'))
      return { defaultDomainName, ...nameObject };

    return nameObject;
  }

  /**
   * Returns the linked address of the input domain if the link was set. Otherwise, it will return undefined.
   *
   * @param domain a domain name ends with `.sui`
   */
  async getAddress(domain: string): Promise<string | undefined> {
    const { targetAddress } = await this.getNameObject(domain);

    return targetAddress;
  }

  /**
   * Returns the default name of the input address if it was set. Otherwise, it will return undefined.
   *
   * @param address a Sui address.
   */
  async getName(address: string): Promise<string | undefined> {
    const res = await this.getDynamicFieldObject(
      this.contractObjects?.reverseRegistry ?? '',
      address,
      'address',
    );
    const data = parseObjectDataResponse(res);

    return data?.value;
  }
}

export { SuinsClient };
